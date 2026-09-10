import { computed, ref, watch, type Ref } from 'vue'
import { ApiError } from '@/services/pokeapi/client'
import { collectSpeciesIds } from '@/services/pokeapi/evolution.service'
import { usePokedexStore } from '@/stores/pokedex'
import { usePokemonDetailStore } from '@/stores/pokemonDetail'
import type {
  EvolutionChain,
  PokemonDetail,
  PokemonIndexEntry,
  PokemonSpecies,
  PokemonSummary,
} from '@/types/pokemon'

export type DetailStatus = 'loading' | 'ready' | 'not-found' | 'error'
export type SectionStatus = 'loading' | 'ready' | 'error'

function errorMessageOf(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

/**
 * Orquestra o carregamento da tela de detalhe: primeiro o Pokémon (libera o topo da
 * tela), depois espécie + cadeia de evolução em paralelo. Reage à troca do id na rota.
 */
export function usePokemonDetail(idOrName: Ref<string>) {
  const store = usePokemonDetailStore()
  const pokedex = usePokedexStore()

  const detail = ref<PokemonDetail | null>(null)
  const species = ref<PokemonSpecies | null>(null)
  const chain = ref<EvolutionChain | null>(null)
  /** Resumos (tipos) das espécies da cadeia, indexados por id da espécie. */
  const chainSummaries = ref<Record<number, PokemonSummary>>({})

  const status = ref<DetailStatus>('loading')
  const speciesStatus = ref<SectionStatus>('loading')
  const chainStatus = ref<SectionStatus>('loading')
  const errorMessage = ref<string | null>(null)

  // Requisições não são canceladas (alimentam o cache); resultados antigos são ignorados.
  let generation = 0

  async function loadChain(current: number, chainId: number): Promise<void> {
    chainStatus.value = 'loading'
    try {
      const result = await store.ensureChain(chainId)
      const summaries = await pokedex.ensureSummaries(collectSpeciesIds(result.root))
      if (current !== generation) return
      chainSummaries.value = Object.fromEntries(summaries.map((s) => [s.id, s]))
      chain.value = result
      chainStatus.value = 'ready'
    } catch {
      if (current !== generation) return
      chainStatus.value = 'error'
    }
  }

  async function loadSpecies(current: number, speciesId: number): Promise<void> {
    speciesStatus.value = 'loading'
    try {
      const result = await store.ensureSpecies(speciesId)
      if (current !== generation) return
      species.value = result
      speciesStatus.value = 'ready'
      if (result.evolutionChainId) {
        await loadChain(current, result.evolutionChainId)
      } else {
        chainStatus.value = 'ready'
      }
    } catch {
      if (current !== generation) return
      speciesStatus.value = 'error'
      chainStatus.value = 'error'
    }
  }

  async function load(): Promise<void> {
    const current = ++generation
    status.value = 'loading'
    speciesStatus.value = 'loading'
    chainStatus.value = 'loading'
    errorMessage.value = null
    detail.value = null
    species.value = null
    chain.value = null
    chainSummaries.value = {}

    const key = idOrName.value.trim().toLowerCase()
    if (!key) {
      status.value = 'not-found'
      return
    }

    try {
      const result = await store.ensureDetail(/^\d+$/.test(key) ? Number(key) : key)
      if (current !== generation) return
      detail.value = result
      status.value = 'ready'
      await loadSpecies(current, result.speciesId)
    } catch (error) {
      if (current !== generation) return
      if (error instanceof ApiError && error.status === 404) {
        status.value = 'not-found'
      } else {
        status.value = 'error'
        errorMessage.value = errorMessageOf(error, 'Erro ao carregar o Pokémon')
      }
    }
  }

  async function retry(): Promise<void> {
    if (status.value !== 'ready' || !detail.value) {
      await load()
      return
    }
    await loadSpecies(generation, detail.value.speciesId)
  }

  // Navegação anterior/próximo pelo índice da Pokédex (que já fica em cache).
  const indexPosition = computed(() => {
    const id = detail.value?.id
    return id === undefined ? -1 : pokedex.index.findIndex((entry) => entry.id === id)
  })
  const previous = computed<PokemonIndexEntry | null>(() =>
    indexPosition.value > 0 ? (pokedex.index[indexPosition.value - 1] ?? null) : null,
  )
  const next = computed<PokemonIndexEntry | null>(() =>
    indexPosition.value >= 0 ? (pokedex.index[indexPosition.value + 1] ?? null) : null,
  )

  watch(idOrName, load, { immediate: true })
  pokedex.loadIndex()

  return {
    detail,
    species,
    chain,
    chainSummaries,
    status,
    speciesStatus,
    chainStatus,
    errorMessage,
    previous,
    next,
    retry,
  }
}
