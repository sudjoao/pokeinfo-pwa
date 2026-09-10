import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { PokedexEntry, PokemonIndexEntry, PokemonSummary } from '@/types/pokemon'
import { getPokemonIndex, getPokemonSummary } from '@/services/pokeapi/pokemon.service'
import { getPokedexEntries } from '@/services/pokeapi/pokedex.service'
import { readStorage, writeStorage } from '@/utils/storage'

const INDEX_KEY = 'pokeinfo:index:v1'
const SUMMARIES_KEY = 'pokeinfo:summaries:v1'

/**
 * Cache em memória + localStorage do índice da Pokédex e dos resumos dos Pokémon.
 * Só resumos enxutos são guardados (~120 bytes cada), para não inflar o storage do usuário.
 * As Pokédex regionais ficam só em memória; offline fica por conta do service worker.
 */
export const usePokedexStore = defineStore('pokedex', () => {
  const index = ref<PokemonIndexEntry[]>(readStorage<PokemonIndexEntry[]>(INDEX_KEY) ?? [])
  const summaries = ref<Record<number, PokemonSummary>>(
    readStorage<Record<number, PokemonSummary>>(SUMMARIES_KEY) ?? {},
  )
  const indexLoading = ref(false)
  const indexError = ref<string | null>(null)

  const hasIndex = computed(() => index.value.length > 0)

  let persistTimer: ReturnType<typeof setTimeout> | undefined
  watch(
    summaries,
    (value) => {
      clearTimeout(persistTimer)
      persistTimer = setTimeout(() => writeStorage(SUMMARIES_KEY, value), 500)
    },
    { deep: true },
  )

  async function loadIndex(force = false): Promise<void> {
    if ((hasIndex.value && !force) || indexLoading.value) return
    indexLoading.value = true
    indexError.value = null
    try {
      index.value = await getPokemonIndex()
      writeStorage(INDEX_KEY, index.value)
    } catch (error) {
      indexError.value = error instanceof Error ? error.message : 'Erro ao carregar a Pokédex'
    } finally {
      indexLoading.value = false
    }
  }

  const inFlight = new Map<number, Promise<PokemonSummary>>()

  function fetchSummary(id: number): Promise<PokemonSummary> {
    const cached = summaries.value[id]
    if (cached) return Promise.resolve(cached)

    const pending = inFlight.get(id)
    if (pending) return pending

    const request = getPokemonSummary(id)
      .then((summary) => {
        summaries.value[id] = summary
        return summary
      })
      .finally(() => inFlight.delete(id))
    inFlight.set(id, request)
    return request
  }

  /** Garante que os resumos dos ids informados estejam em cache, buscando só os que faltam. */
  async function ensureSummaries(ids: number[]): Promise<PokemonSummary[]> {
    return Promise.all(ids.map(fetchSummary))
  }

  /** Entradas das Pokédex regionais já carregadas, por slug (ex.: "galar"). */
  const dexEntries = ref<Record<string, PokedexEntry[]>>({})
  const dexInFlight = new Map<string, Promise<PokedexEntry[]>>()

  /** Garante que as entradas da Pokédex informada estejam em memória (uma requisição por dex). */
  function ensureDexEntries(slug: string): Promise<PokedexEntry[]> {
    const cached = dexEntries.value[slug]
    if (cached) return Promise.resolve(cached)

    const pending = dexInFlight.get(slug)
    if (pending) return pending

    const request = getPokedexEntries(slug)
      .then((entries) => {
        dexEntries.value[slug] = entries
        return entries
      })
      .finally(() => dexInFlight.delete(slug))
    dexInFlight.set(slug, request)
    return request
  }

  return {
    index,
    summaries,
    indexLoading,
    indexError,
    hasIndex,
    loadIndex,
    ensureSummaries,
    dexEntries,
    ensureDexEntries,
  }
})
