import { beforeEach, describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  isOwnerEmail,
  keepAlive,
  keepAliveDue,
  KEEP_ALIVE_INTERVAL,
  KEEP_ALIVE_KEY,
  KEEP_ALIVE_REQUESTS,
} from '@/services/cloud/keepAlive'

const disk = new Map<string, string>()
Object.assign(globalThis, {
  localStorage: {
    getItem: (key: string) => disk.get(key) ?? null,
    setItem: (key: string, value: string) => void disk.set(key, value),
    removeItem: (key: string) => void disk.delete(key),
  },
})

/** Cliente simulado: conta as consultas e registra as colunas pedidas. */
function fakeClient(fail = false) {
  const selects: string[] = []
  const client = {
    from: () => ({
      select: (columns: string) => {
        selects.push(columns)
        return {
          eq: () => ({
            limit: () => (fail ? Promise.reject(new Error('network')) : Promise.resolve({})),
          }),
        }
      },
    }),
  } as unknown as SupabaseClient
  return { client, selects }
}

describe('isOwnerEmail', () => {
  it('reconhece os e-mails do dono sem distinguir maiúsculas nem espaços', async () => {
    expect(await isOwnerEmail('isudjoao@gmail.com')).toBe(true)
    expect(await isOwnerEmail('  Joaosempre147@Gmail.com ')).toBe(true)
  })

  it('não reconhece outros e-mails nem vazio', async () => {
    expect(await isOwnerEmail('ash@example.com')).toBe(false)
    expect(await isOwnerEmail('')).toBe(false)
    expect(await isOwnerEmail(null)).toBe(false)
  })
})

describe('keepAlive', () => {
  beforeEach(() => disk.clear())

  it('faz a rodada de consultas e anota o horário', async () => {
    const { client, selects } = fakeClient()
    expect(keepAliveDue(1000)).toBe(true)
    expect(await keepAlive(client, 'user-1', 1000)).toBe(true)
    expect(selects).toHaveLength(KEEP_ALIVE_REQUESTS)
    expect(JSON.parse(disk.get(KEEP_ALIVE_KEY)!)).toBe(1000)
  })

  it('não repete antes do intervalo e repete depois', async () => {
    const { client, selects } = fakeClient()
    await keepAlive(client, 'user-1', 1000)
    expect(await keepAlive(client, 'user-1', 1000 + KEEP_ALIVE_INTERVAL - 1)).toBe(false)
    expect(selects).toHaveLength(KEEP_ALIVE_REQUESTS)
    expect(await keepAlive(client, 'user-1', 1000 + KEEP_ALIVE_INTERVAL)).toBe(true)
    expect(selects).toHaveLength(KEEP_ALIVE_REQUESTS * 2)
  })

  it('falha de rede não propaga e não vira rajada', async () => {
    const { client, selects } = fakeClient(true)
    await expect(keepAlive(client, 'user-1', 1000)).resolves.toBe(true)
    expect(selects).toHaveLength(1)
    expect(await keepAlive(client, 'user-1', 2000)).toBe(false)
  })
})
