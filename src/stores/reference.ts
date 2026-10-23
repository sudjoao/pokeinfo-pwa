import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import { getMachineItem, getMoveDetail, type MoveDetail } from '@/services/pokeapi/move.service'

/**
 * Cache em memória (só da sessão) das páginas de referência: golpes e máquinas. Mesmo padrão do
 * store `pokemonDetail`: Maps com objetos `markRaw`, requisições deduplicadas e só os últimos
 * MAX_CACHED golpes (cada `/move` traz a lista de aprendizes). O offline fica com o service worker.
 */
const MAX_CACHED = 30

function remember<K, V extends object>(cache: Map<K, V>, key: K, value: V, max = Infinity): V {
  cache.delete(key)
  cache.set(key, markRaw(value))
  while (cache.size > max) cache.delete(cache.keys().next().value as K)
  return value
}

export const useReferenceStore = defineStore('reference', () => {
  const moves = new Map<string, MoveDetail>()
  /** URL de `/machine/{id}` -> item ("tm24"); pequeno e imutável, sem limite. */
  const machines = new Map<string, string>()

  const inFlight = new Map<string, Promise<unknown>>()
  function dedupe<T>(key: string, run: () => Promise<T>): Promise<T> {
    const pending = inFlight.get(key) as Promise<T> | undefined
    if (pending) return pending
    const request = run().finally(() => inFlight.delete(key))
    inFlight.set(key, request)
    return request
  }

  function ensureMove(slug: string): Promise<MoveDetail> {
    const cached = moves.get(slug)
    if (cached) return Promise.resolve(remember(moves, slug, cached, MAX_CACHED))
    return dedupe(`move:${slug}`, async () =>
      remember(moves, slug, await getMoveDetail(slug), MAX_CACHED),
    )
  }

  function ensureMachineItem(url: string): Promise<string> {
    const cached = machines.get(url)
    if (cached) return Promise.resolve(cached)
    return dedupe(`machine:${url}`, async () => {
      const item = await getMachineItem(url)
      machines.set(url, item)
      return item
    })
  }

  return { ensureMove, ensureMachineItem }
})
