import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAccountStore } from '@/stores/account'
import { useCaughtStore } from '@/stores/caught'
import { useDailyStore } from '@/stores/daily'
import type { BackupData } from '@/utils/backup'
import { decodeBitset, encodeBitset } from '@/utils/bitset'

/**
 * Motor de sincronização com os stores de verdade e o Supabase simulado. O "navegador" tem um
 * localStorage compartilhado e entrega o evento `storage` só às outras abas, como o real. Os
 * globais só são lidos quando os stores são criados (os imports acima sobem antes deles).
 */
type StorageListener = (event: { key: string }) => void

const disk = new Map<string, string>()
const tabs = new Map<string, StorageListener[]>()
let currentTab = 'A'

Object.assign(globalThis, {
  localStorage: {
    getItem: (key: string) => disk.get(key) ?? null,
    setItem: (key: string, value: string) => {
      const old = disk.get(key)
      disk.set(key, value)
      if (old === value) return
      for (const [tab, listeners] of tabs) {
        if (tab !== currentTab) listeners.forEach((listener) => listener({ key }))
      }
    },
    removeItem: (key: string) => void disk.delete(key),
  },
  window: {
    addEventListener: (type: string, listener: StorageListener) => {
      if (type === 'storage') tabs.set(currentTab, [...(tabs.get(currentTab) ?? []), listener])
    },
    location: { origin: 'http://localhost' },
  },
  document: { addEventListener: () => {}, visibilityState: 'visible' },
})
Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true })

let remote: { data: BackupData; version: number } | null = null
let failUpdate = false
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

vi.mock('@/services/cloud/client', () => ({
  cloudEnabled: true,
  getClient: async () => ({ auth: { onAuthStateChange: () => {} } }),
  hasStoredSession: () => false,
  storedSessionUser: () => ({ id: 'user-1', email: 'ash@example.com', user_metadata: {} }),
}))

vi.mock('@/services/cloud/collection.service', () => ({
  fetchCollection: async () => (remote ? clone(remote) : null),
  createCollection: async (_client: unknown, _user: string, data: BackupData) => {
    remote = { data: clone(data), version: 1 }
    return 1
  },
  updateCollection: async (_client: unknown, _user: string, data: BackupData, version: number) => {
    if (failUpdate) throw new Error('network')
    if (!remote || remote.version !== version) return null
    remote = { data: clone(data), version: version + 1 }
    return remote.version
  },
  deleteAccount: async () => {},
}))

function openTab(name: string) {
  currentTab = name
  setActivePinia(createPinia())
  const account = useAccountStore()
  account.start()
  return { account, caught: useCaughtStore(), daily: useDailyStore() }
}

function switchTo(name: string, pinia: ReturnType<typeof createPinia>) {
  currentTab = name
  setActivePinia(pinia)
}

const remoteCaught = (game: string) => [...decodeBitset(remote?.data.caught[game] ?? '')].sort()

describe('sincronização', () => {
  beforeEach(() => {
    disk.clear()
    tabs.clear()
    remote = null
    failUpdate = false
  })

  it('palpite do Pokémon do dia sobrevive à sincronização', async () => {
    const { account, daily } = openTab('A')
    daily.gameFor('2026-10-25')
    await account.sync()
    daily.guess('2026-10-25', 25, 1)
    await account.sync()
    expect(daily.game?.guesses).toEqual([25])
    expect(remote?.data.daily?.game?.guesses).toEqual([25])
  })

  it('envio que falhou não desfaz o que o outro aparelho mudou depois', async () => {
    const { account, caught } = openTab('A')
    caught.setCaught('red', 7, true)
    await account.sync()
    // Outro aparelho desmarca o 7; este marca o 9 e o envio falha.
    remote!.data.caught = {}
    remote!.version++
    caught.setCaught('red', 9, true)
    failUpdate = true
    await account.sync()
    expect(caught.isCaught('red', 7)).toBe(false)
    // O outro aparelho marca o 7 de novo: tem que ficar.
    failUpdate = false
    remote!.data.caught = { red: encodeBitset(new Set([7])) }
    remote!.version++
    await account.sync()
    expect(caught.isCaught('red', 7)).toBe(true)
    expect(remoteCaught('red')).toEqual([7, 9])
  })

  it('aba desatualizada recarrega quando outra grava; nada é apagado depois', async () => {
    const piniaA = createPinia()
    switchTo('A', piniaA)
    const accountA = useAccountStore()
    accountA.start()
    const caughtA = useCaughtStore()
    await accountA.sync()
    const piniaB = createPinia()
    switchTo('B', piniaB)
    useAccountStore().start()
    const caughtB = useCaughtStore()

    switchTo('A', piniaA)
    caughtA.setCaught('red', 7, true)
    await accountA.sync()
    await new Promise((resolve) => setTimeout(resolve, 80))

    switchTo('B', piniaB)
    expect(caughtB.isCaught('red', 7)).toBe(true)
    caughtB.setCaught('red', 9, true)
    caughtB.flush() // aba fechada antes do envio

    const next = openTab('C')
    await next.account.sync()
    expect(next.caught.isCaught('red', 7)).toBe(true)
    expect(remoteCaught('red')).toEqual([7, 9])
  })
})
