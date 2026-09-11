import { computed, ref, watch, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ApiError } from '@/services/pokeapi/client'
import { collectSpecies } from '@/services/pokeapi/evolution.service'
import { usePokedexStore } from '@/stores/pokedex'
import { usePokemonDetailStore } from '@/stores/pokemonDetail'
import { buildDexList, type GameContext } from '@/utils/games'
import { describeError } from '@/utils/errors'
import type {
  EvolutionChain,
  PokemonDetail,
  PokemonEncounters,
  PokemonIndexEntry,
  PokemonSpecies,
  PokemonSummary,
} from '@/types/pokemon'

export type DetailStatus = 'loading' | 'ready' | 'not-found' | 'error'
export type SectionStatus = 'loading' | 'ready' | 'error'

/** Vizinho na navegação anterior/próximo; `dexNumber` só existe com um jogo selecionado. */
export interface NeighborEntry extends PokemonIndexEntry {
  dexNumber?: number
}

/**
 * Orquestra o carregamento da tela de detalhe: primeiro o Pokémon (libera o topo da
 * tela), depois espécie + cadeia de evolução e os locais de encontro em paralelo. Reage à troca do id na rota.
 * Com um jogo selecionado (`context`), a navegação anterior/próximo segue a Pokédex dele.
 */
export function usePokemonDetail(idOrName: Ref<string>, context: Ref<GameContext | null>) {
  const store = usePokemonDetailStore()
  const pokedex = usePokedexStore()
  const { t } = useI18n()

  const detail = ref<PokemonDetail | null>(null)
  const species = ref<PokemonSpecies | null>(null)
  const chain = ref<EvolutionChain | null>(null)
  /** Resumos (tipos) das espécies da cadeia, indexados por id da espécie. */
  const chainSummaries = ref<Record<number, PokemonSummary>>({})
  /** Locais de encontro por jogo (null enquanto carrega ou em erro). */
  const encounters = ref<PokemonEncounters | null>(null)

  const status = ref<DetailStatus>('loading')
  const speciesStatus = ref<SectionStatus>('loading')
  const chainStatus = ref<SectionStatus>('loading')
  const encountersStatus = ref<SectionStatus>('loading')
  const loadError = ref<unknown>(null)
  const errorMessage = computed(() =>
    loadError.value ? describeError(loadError.value, t, 'detail.loadError') : null,
  )

  // Requisições não são canceladas (alimentam o cache); resultados antigos são ignorados.
  let generation = 0

  async function loadChain(current: number, chainId: number): Promise<void> {
    chainStatus.value = 'loading'
    try {
      const result = await store.ensureChain(chainId)
      const summaries = await pokedex.ensureSummaries(collectSpecies(result.root))
      if (current !== generation) return
      chainSummaries.value = Object.fromEntries(summaries.map((s) => [s.id, s]))
      chain.value = result
      chainStatus.value = 'ready'
    } catch {
      if (current !== generation) return
      chainStatus.value = 'error'
    }
  }

  async function loadEncounters(current: number, pokemonId: number): Promise<void> {
    encountersStatus.value = 'loading'
    try {
      const result = await store.ensureEncounters(pokemonId)
      if (current !== generation) return
      encounters.value = result
      encountersStatus.value = 'ready'
    } catch {
      if (current !== generation) return
      encountersStatus.value = 'error'
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
    encountersStatus.value = 'loading'
    loadError.value = null
    detail.value = null
    species.value = null
    chain.value = null
    chainSummaries.value = {}
    encounters.value = null

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
      await Promise.all([
        loadSpecies(current, result.speciesId),
        loadEncounters(current, result.id),
      ])
    } catch (error) {
      if (current !== generation) return
      if (error instanceof ApiError && error.status === 404) {
        status.value = 'not-found'
      } else {
        status.value = 'error'
        loadError.value = error
      }
    }
  }

  async function retry(): Promise<void> {
    if (status.value !== 'ready' || !detail.value) {
      await load()
      return
    }
    const current = generation
    const pending: Promise<void>[] = []
    if (speciesStatus.value !== 'ready' || chainStatus.value !== 'ready') {
      pending.push(loadSpecies(current, detail.value.speciesId))
    }
    if (encountersStatus.value !== 'ready') pending.push(loadEncounters(current, detail.value.id))
    await Promise.all(pending)
  }

  // Pokédex do jogo selecionado (se houver). Falhas aqui não bloqueiam a tela:
  // sem as entradas, a navegação simplesmente volta a seguir a ordem nacional.
  const dexList = computed(() => {
    const dex = context.value?.dex
    const entries = dex ? pokedex.dexEntries[dex.slug] : undefined
    return dex && entries ? buildDexList(entries, dex, pokedex.regionalForms) : null
  })

  watch(
    () => context.value?.dex.slug,
    (slug) => {
      if (slug) pokedex.ensureDexEntries(slug).catch(() => {})
    },
    { immediate: true },
  )

  /** Posição do Pokémon atual na Pokédex do jogo: pela forma exata ou, se não houver, pela espécie. */
  const dexPosition = computed(() => {
    const list = dexList.value
    const current = detail.value
    if (!list || !current) return -1
    const byForm = list.findIndex((entry) => entry.id === current.id)
    return byForm >= 0 ? byForm : list.findIndex((entry) => entry.speciesId === current.speciesId)
  })

  /** Número do Pokémon atual na Pokédex do jogo selecionado (null fora dela). */
  const dexNumber = computed(() =>
    dexPosition.value >= 0 ? (dexList.value?.[dexPosition.value]?.dexNumber ?? null) : null,
  )

  // Navegação anterior/próximo: pela Pokédex do jogo quando o Pokémon está nela,
  // senão pelo índice nacional (que já fica em cache).
  const neighbors = computed<{ list: readonly NeighborEntry[]; position: number }>(() => {
    if (dexPosition.value >= 0 && dexList.value) {
      return { list: dexList.value, position: dexPosition.value }
    }
    const id = detail.value?.id
    const position = id === undefined ? -1 : pokedex.index.findIndex((entry) => entry.id === id)
    return { list: pokedex.index, position }
  })
  const previous = computed<NeighborEntry | null>(() => {
    const { list, position } = neighbors.value
    return position > 0 ? (list[position - 1] ?? null) : null
  })
  const next = computed<NeighborEntry | null>(() => {
    const { list, position } = neighbors.value
    return position >= 0 ? (list[position + 1] ?? null) : null
  })

  watch(idOrName, load, { immediate: true })
  pokedex.load()

  return {
    detail,
    species,
    chain,
    chainSummaries,
    encounters,
    status,
    speciesStatus,
    chainStatus,
    encountersStatus,
    errorMessage,
    dexNumber,
    previous,
    next,
    retry,
  }
}
