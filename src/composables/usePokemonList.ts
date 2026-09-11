import { computed, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter, type LocationQuery, type LocationQueryRaw } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { GAMES, type Game, type GameDex } from '@/data/games'
import { usePokedexStore } from '@/stores/pokedex'
import { useCaughtStore } from '@/stores/caught'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
import { buildDexList, findGame, resolveDex } from '@/utils/games'
import { describeError } from '@/utils/errors'
import { isPokemonType } from '@/utils/pokemon'
import type { PokemonIndexEntry, PokemonListItem, PokemonType } from '@/types/pokemon'

export const PAGE_SIZE = 24

/** Um Pokémon tem no máximo dois tipos, então o filtro também para em dois. */
export const MAX_TYPE_FILTERS = 2

export type ListStatus = 'idle' | 'loading' | 'error' | 'done'

/** Filtro de captura: só capturados, só os que faltam, ou todos (null). */
export type CaughtFilter = 'caught' | 'missing' | null

function caughtFilterParam(value: unknown): CaughtFilter {
  if (value === '1') return 'caught'
  if (value === '0') return 'missing'
  return null
}

/** `?type=fire,flying` -> ['fire', 'flying'] (ignora nomes inválidos e repetidos). */
function typeFilterParam(value: unknown): PokemonType[] {
  if (typeof value !== 'string' || !value) return []
  const types = value.split(',').filter(isPokemonType)
  return [...new Set(types)].slice(0, MAX_TYPE_FILTERS)
}

/** Entrada da fonte da lista: o índice nacional ou a Pokédex do jogo, já resolvida para a forma. */
interface ListSource extends PokemonIndexEntry {
  dexNumber?: number
  speciesId?: number
}

/** Id usado na marcação de captura: a espécie (número nacional), mesmo quando o card é uma forma regional. */
function speciesOf(entry: ListSource): number {
  return entry.speciesId ?? entry.id
}

/** Predicado de busca já resolvido para a query (número ou trecho do nome). */
function matcherFor(query: string): (entry: ListSource) => boolean {
  if (!query) return () => true
  if (/^\d+$/.test(query)) {
    const number = Number(query)
    return (entry) =>
      entry.dexNumber === undefined ? entry.id === number : entry.dexNumber === number
  }
  return (entry) => entry.name.includes(query)
}

function queryParam(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null
}

/** Parâmetros da URL que esta lista controla; os demais (ex.: `team`) são preservados. */
const OWN_QUERY_KEYS = ['q', 'game', 'dex', 'caught', 'type'] as const

function foreignQuery(query: LocationQuery): LocationQueryRaw {
  const result: LocationQueryRaw = {}
  for (const [key, value] of Object.entries(query)) {
    if (!(OWN_QUERY_KEYS as readonly string[]).includes(key)) result[key] = value
  }
  return result
}

/**
 * Orquestra busca + filtros (jogo, captura, tipo) + scroll infinito sobre a Pokédex.
 * A fonte da lista é o índice nacional ou a Pokédex regional do jogo escolhido;
 * os filtros são aplicados localmente e os lotes carregam só os resumos necessários.
 */
export function usePokemonList() {
  const store = usePokedexStore()
  const caughtStore = useCaughtStore()
  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()

  const query = ref(queryParam(route.query.q) ?? '')
  const debouncedQuery = useDebouncedRef(query, 300)
  const normalizedQuery = computed(() => debouncedQuery.value.trim().toLowerCase())

  const gameSlug = ref<string | null>(queryParam(route.query.game))
  const dexSlug = ref<string | null>(queryParam(route.query.dex))

  const game = computed<Game | null>(() => findGame(gameSlug.value))
  const dex = computed<GameDex | null>(() =>
    game.value ? resolveDex(game.value, dexSlug.value) : null,
  )

  const caughtFilter = ref<CaughtFilter>(caughtFilterParam(route.query.caught))
  const typeFilter = ref<PokemonType[]>(typeFilterParam(route.query.type))

  function setGame(slug: string | null): void {
    gameSlug.value = slug
    dexSlug.value = null
    caughtFilter.value = null
  }

  function setCaughtFilter(filter: CaughtFilter): void {
    caughtFilter.value = filter
  }

  function setDex(slug: string): void {
    dexSlug.value = slug
  }

  /** Liga/desliga um tipo; com dois já escolhidos, o novo substitui o mais recente. */
  function toggleType(type: PokemonType): void {
    const current = typeFilter.value
    if (current.includes(type)) {
      typeFilter.value = current.filter((item) => item !== type)
    } else if (current.length < MAX_TYPE_FILTERS) {
      typeFilter.value = [...current, type]
    } else {
      typeFilter.value = [...current.slice(0, MAX_TYPE_FILTERS - 1), type]
    }
  }

  function clearTypes(): void {
    typeFilter.value = []
  }

  // Carregamento das entradas da Pokédex do jogo (uma requisição por dex, cacheada na store).
  const dexLoading = ref(false)
  const dexError = ref<unknown>(null)

  async function loadDex(): Promise<void> {
    const current = dex.value
    dexError.value = null
    if (!current || store.dexEntries[current.slug]) {
      dexLoading.value = false
      return
    }
    dexLoading.value = true
    try {
      await store.ensureDexEntries(current.slug)
    } catch (error) {
      if (dex.value?.slug !== current.slug) return
      dexError.value = error
    } finally {
      if (dex.value?.slug === current.slug) dexLoading.value = false
    }
  }

  const source = computed<ListSource[]>(() => {
    if (!dex.value) return store.index
    const entries = store.dexEntries[dex.value.slug]
    return entries ? buildDexList(entries, dex.value, store.regionalForms) : []
  })

  /**
   * Filtros aplicados à fonte. O de captura lê o conjunto sem rastreamento reativo: marcar um
   * card não pode encolher a lista no meio da paginação (o próximo lote pularia um Pokémon).
   * O de tipo exige que o Pokémon tenha todos os tipos escolhidos (lê o mapa de tipos, que já
   * está pronto antes de a lista aparecer). A lista só reaplica os filtros quando eles mudam.
   */
  const filtered = computed(() => {
    const matches = matcherFor(normalizedQuery.value)
    const status = game.value ? caughtFilter.value : null
    const caught = caughtStore.caughtInRaw(game.value?.slug)
    const types = typeFilter.value
    return source.value.filter((entry) => {
      if (!matches(entry)) return false
      if (status !== null && caught.has(speciesOf(entry)) !== (status === 'caught')) return false
      if (types.length === 0) return true
      const own = store.typesOf(entry.id)
      return own !== undefined && types.every((type) => own.includes(type))
    })
  })

  /** Ids de espécie capturados no jogo atual (reativo por id: só o card tocado re-renderiza). */
  const caughtIds = computed(() => caughtStore.caughtIn(game.value?.slug))

  /** Capturados e faltantes dentro da Pokédex atual (o conjunto do jogo pode ter espécies de outras dexes). */
  const caughtCount = computed(() => {
    const ids = caughtIds.value
    let count = 0
    for (const entry of source.value) if (ids.has(speciesOf(entry))) count++
    return count
  })
  const missingCount = computed(() => source.value.length - caughtCount.value)

  function toggleCaught(speciesId: number): void {
    if (game.value) caughtStore.toggle(game.value.slug, speciesId)
  }

  // shallowRef: os itens não mudam depois de carregados; a lista é substituída a cada lote.
  const items = shallowRef<PokemonListItem[]>([])
  const status = ref<ListStatus>('idle')
  const loadError = ref<unknown>(null)
  const errorMessage = computed(() =>
    loadError.value ? describeError(loadError.value, t, 'home.loadMoreError') : null,
  )
  /** Muda a cada reset; usado como :key para reiniciar o scroll infinito. */
  const listKey = ref(0)

  const sourceLoading = computed(() => store.loading || dexLoading.value)
  const sourceError = computed(() => {
    const error = store.sourceError ?? dexError.value
    return error ? describeError(error, t, 'error.loadDex') : null
  })
  const sourceReady = computed(
    () =>
      store.ready &&
      !sourceLoading.value &&
      !sourceError.value &&
      (!dex.value || Boolean(store.dexEntries[dex.value.slug])),
  )

  const hasMore = computed(() => items.value.length < filtered.value.length)
  const isEmpty = computed(() => sourceReady.value && filtered.value.length === 0)

  let generation = 0

  async function loadMore(): Promise<ListStatus> {
    if (status.value === 'loading') return status.value
    if (!hasMore.value) {
      status.value = 'done'
      return status.value
    }

    const current = ++generation
    status.value = 'loading'
    loadError.value = null

    const batch = filtered.value.slice(items.value.length, items.value.length + PAGE_SIZE)

    try {
      const summaries = await store.ensureSummaries(batch)
      if (current !== generation) return status.value
      items.value = [
        ...items.value,
        ...summaries.map((summary, i) => ({
          ...summary,
          dexNumber: batch[i]?.dexNumber,
          speciesId: batch[i]?.speciesId,
        })),
      ]
      status.value = hasMore.value ? 'idle' : 'done'
    } catch (error) {
      if (current !== generation) return status.value
      loadError.value = error
      status.value = 'error'
    }
    return status.value
  }

  function reset(): void {
    generation++
    listKey.value++
    items.value = []
    status.value = 'idle'
    loadError.value = null
  }

  async function retry(): Promise<void> {
    if (!store.ready) {
      await store.load(true)
      return
    }
    if (dexError.value) {
      await loadDex()
      return
    }
    status.value = 'idle'
    await loadMore()
  }

  function buildQuery(): LocationQueryRaw {
    const result: LocationQueryRaw = {}
    if (normalizedQuery.value) result.q = normalizedQuery.value
    if (game.value) {
      result.game = game.value.slug
      if (game.value.dexes.length > 1 && dex.value) result.dex = dex.value.slug
      if (caughtFilter.value) result.caught = caughtFilter.value === 'caught' ? '1' : '0'
    }
    if (typeFilter.value.length) result.type = typeFilter.value.join(',')
    return result
  }

  watch(
    [normalizedQuery, () => game.value?.slug, () => dex.value?.slug, caughtFilter, typeFilter],
    () => {
      router.replace({ query: { ...foreignQuery(route.query), ...buildQuery() } })
    },
  )

  // Troca de jogo/dex volta ao topo; a busca só reinicia a lista.
  watch(dex, () => {
    window.scrollTo({ top: 0 })
    loadDex()
  })

  watch([source, normalizedQuery, caughtFilter, typeFilter], () => reset())

  store.load()
  loadDex()

  return {
    query,
    games: GAMES,
    game,
    dex,
    setGame,
    setDex,
    caughtFilter,
    setCaughtFilter,
    typeFilter,
    toggleType,
    clearTypes,
    caughtIds,
    caughtCount,
    missingCount,
    toggleCaught,
    filtered,
    items,
    status,
    errorMessage,
    listKey,
    hasMore,
    isEmpty,
    sourceLoading,
    sourceError,
    loadMore,
    retry,
  }
}
