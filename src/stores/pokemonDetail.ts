import { defineStore } from 'pinia'
import { markRaw } from 'vue'
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
 *
 * Os caches são Maps simples com objetos `markRaw`: só são lidos pelos `ensure*`, nunca no
 * template, e um detalhe tem milhares de golpes (movimentos × versões); torná-los reativos criava
 * milhares de proxies por Pokémon. Detalhes e encontros (os grandes) guardam só os últimos
 * MAX_CACHED, como os gritos em useCry.
 */
const MAX_CACHED = 30

/** Guarda no Map como "usado agora" (fim da ordem de inserção) e descarta os mais antigos. */
function remember<K, V extends object>(cache: Map<K, V>, key: K, value: V, max = Infinity): V {
  cache.delete(key)
  cache.set(key, markRaw(value))
  while (cache.size > max) cache.delete(cache.keys().next().value as K)
  return value
}

export const usePokemonDetailStore = defineStore('pokemonDetail', () => {
  const details = new Map<number, PokemonDetail>()
  const species = new Map<number, PokemonSpecies>()
  const chains = new Map<number, EvolutionChain>()
  /** Locais por jogo, indexados pelo id da forma (Raichu de Alola tem os seus). */
  const encounters = new Map<number, PokemonEncounters>()

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
    const id = typeof idOrName === 'number' ? idOrName : Number(idOrName)
    if (Number.isInteger(id)) return details.get(id)
    return [...details.values()].find((detail) => detail.name === idOrName)
  }

  function ensureDetail(idOrName: number | string): Promise<PokemonDetail> {
    const cached = findDetail(idOrName)
    if (cached) return Promise.resolve(remember(details, cached.id, cached, MAX_CACHED))
    return dedupe(detailRequests, String(idOrName), async () => {
      const detail = await getPokemonDetail(idOrName)
      return remember(details, detail.id, detail, MAX_CACHED)
    })
  }

  function ensureSpecies(id: number): Promise<PokemonSpecies> {
    const cached = species.get(id)
    if (cached) return Promise.resolve(cached)
    return dedupe(speciesRequests, String(id), async () => {
      const result = await getPokemonSpecies(id)
      return remember(species, result.id, result)
    })
  }

  function ensureChain(id: number): Promise<EvolutionChain> {
    const cached = chains.get(id)
    if (cached) return Promise.resolve(cached)
    return dedupe(chainRequests, String(id), async () => {
      const result = await getEvolutionChain(id)
      return remember(chains, result.id, result)
    })
  }

  function ensureEncounters(id: number): Promise<PokemonEncounters> {
    const cached = encounters.get(id)
    if (cached) return Promise.resolve(remember(encounters, id, cached, MAX_CACHED))
    return dedupe(encounterRequests, String(id), async () => {
      const result = await getPokemonEncounters(id)
      return remember(encounters, id, result, MAX_CACHED)
    })
  }

  return {
    ensureDetail,
    ensureSpecies,
    ensureChain,
    ensureEncounters,
  }
})
