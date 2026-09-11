import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  EvolutionChain,
  PokemonDetail,
  PokemonEncounters,
  PokemonSpecies,
} from '@/types/pokemon'
import { getPokemonDetail } from '@/services/pokeapi/pokemon.service'
import { getPokemonSpecies } from '@/services/pokeapi/species.service'
import { getEvolutionChain } from '@/services/pokeapi/evolution.service'
import { getPokemonEncounters } from '@/services/pokeapi/encounter.service'

/**
 * Cache em memória (só da sessão) de detalhes, espécies, cadeias de evolução e locais de encontro.
 * Não persiste em localStorage de propósito: o offline fica por conta do service worker,
 * que guarda as respostas cruas com limite de entradas (ver vite.config.ts).
 *
 * As requisições não são canceláveis de propósito: mesmo que a tela mude antes da
 * resposta, o resultado entra no cache e serve à próxima visita.
 */
export const usePokemonDetailStore = defineStore('pokemonDetail', () => {
  const details = ref<Record<number, PokemonDetail>>({})
  const species = ref<Record<number, PokemonSpecies>>({})
  const chains = ref<Record<number, EvolutionChain>>({})
  /** Locais por jogo, indexados pelo id da forma (Raichu de Alola tem os seus). */
  const encounters = ref<Record<number, PokemonEncounters>>({})

  /** Deduplica requisições em voo por chave (id ou nome). */
  function dedupe<T>(inFlight: Map<string, Promise<T>>, key: string, run: () => Promise<T>) {
    const pending = inFlight.get(key)
    if (pending) return pending
    const request = run().finally(() => inFlight.delete(key))
    inFlight.set(key, request)
    return request
  }

  const detailRequests = new Map<string, Promise<PokemonDetail>>()
  const speciesRequests = new Map<string, Promise<PokemonSpecies>>()
  const chainRequests = new Map<string, Promise<EvolutionChain>>()
  const encounterRequests = new Map<string, Promise<PokemonEncounters>>()

  function findDetail(idOrName: number | string): PokemonDetail | undefined {
    if (typeof idOrName === 'number') return details.value[idOrName]
    const id = Number(idOrName)
    if (Number.isInteger(id)) return details.value[id]
    return Object.values(details.value).find((detail) => detail.name === idOrName)
  }

  function ensureDetail(idOrName: number | string): Promise<PokemonDetail> {
    const cached = findDetail(idOrName)
    if (cached) return Promise.resolve(cached)
    return dedupe(detailRequests, String(idOrName), async () => {
      const detail = await getPokemonDetail(idOrName)
      details.value[detail.id] = detail
      return detail
    })
  }

  function ensureSpecies(id: number): Promise<PokemonSpecies> {
    const cached = species.value[id]
    if (cached) return Promise.resolve(cached)
    return dedupe(speciesRequests, String(id), async () => {
      const result = await getPokemonSpecies(id)
      species.value[result.id] = result
      return result
    })
  }

  function ensureChain(id: number): Promise<EvolutionChain> {
    const cached = chains.value[id]
    if (cached) return Promise.resolve(cached)
    return dedupe(chainRequests, String(id), async () => {
      const result = await getEvolutionChain(id)
      chains.value[result.id] = result
      return result
    })
  }

  function ensureEncounters(id: number): Promise<PokemonEncounters> {
    const cached = encounters.value[id]
    if (cached) return Promise.resolve(cached)
    return dedupe(encounterRequests, String(id), async () => {
      const result = await getPokemonEncounters(id)
      encounters.value[id] = result
      return result
    })
  }

  return {
    details,
    species,
    chains,
    encounters,
    ensureDetail,
    ensureSpecies,
    ensureChain,
    ensureEncounters,
  }
})
