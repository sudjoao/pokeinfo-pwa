import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { CAUGHT_KEY, useCaughtStore } from '@/stores/caught'
import { onLocalChange } from '@/utils/localChanges'
import { decodeBitset } from '@/utils/bitset'

const disk = new Map<string, string>()
Object.assign(globalThis, {
  localStorage: {
    getItem: (key: string) => disk.get(key) ?? null,
    setItem: (key: string, value: string) => void disk.set(key, value),
    removeItem: (key: string) => void disk.delete(key),
  },
})

describe('caught store: setMany (seleção múltipla)', () => {
  beforeEach(() => {
    disk.clear()
    setActivePinia(createPinia())
  })

  it('marca e desmarca várias espécies com uma gravação e um aviso de mudança', () => {
    vi.useFakeTimers()
    const changes = vi.fn()
    const stop = onLocalChange(changes)
    const caught = useCaughtStore()

    caught.setMany('red-blue', [1, 4, 7], true)
    expect([...caught.caughtIn('red-blue')]).toEqual([1, 4, 7])
    expect(changes).toHaveBeenCalledTimes(1)

    caught.setMany('red-blue', [4, 99], false)
    expect([...caught.caughtIn('red-blue')]).toEqual([1, 7])

    vi.runAllTimers()
    const saved = JSON.parse(disk.get(CAUGHT_KEY)!) as Record<string, string>
    expect([...decodeBitset(saved['red-blue']!)].sort((a, b) => a - b)).toEqual([1, 7])
    stop()
    vi.useRealTimers()
  })

  it('desmarcar num jogo sem marcações não cria o jogo', () => {
    const caught = useCaughtStore()
    caught.setMany('x-y', [1], false)
    expect(caught.counts()).toEqual({})
  })
})
