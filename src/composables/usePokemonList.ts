import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import { GAMES, type Game, type GameDex } from '@/data/games'
import { usePokedexStore } from '@/stores/pokedex'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
import { buildDexList, buildRegionalFormIndex, findGame, resolveDex } from '@/utils/games'
import type { PokemonIndexEntry, PokemonListItem } from '@/types/pokemon'

export const PAGE_SIZE = 24

export type ListStatus = 'idle' | 'loading' | 'error' | 'done'

/** Entrada da fonte da lista: o índice nacional ou a Pokédex do jogo, já resolvida para a forma. */
interface ListSource extends PokemonIndexEntry {
  dexNumber?: number
  speciesId?: number
}

function matches(entry: ListSource, query: string): boolean {
  if (!query) return true
  if (/^\d+$/.test(query)) {
    const number = Number(query)
    return entry.dexNumber === undefined ? entry.id === number : entry.dexNumber === number
  }
  return entry.name.includes(query)
}

function queryParam(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null
}

/**
 * Orquestra busca + filtro por jogo + scroll infinito sobre a Pokédex.
 * A fonte da lista é o índice nacional ou a Pokédex regional do jogo escolhido;
 * a busca filtra a fonte localmente e os lotes carregam só os resumos necessários.
 */
export function usePokemonList() {
  const store = usePokedexStore()
  const route = useRoute()
  const router = useRouter()

  const query = ref(queryParam(route.query.q) ?? '')
  const debouncedQuery = useDebouncedRef(query, 300)
  const normalizedQuery = computed(() => debouncedQuery.value.trim().toLowerCase())

  const gameSlug = ref<string | null>(queryParam(route.query.game))
  const dexSlug = ref<string | null>(queryParam(route.query.dex))

  const game = computed<Game | null>(() => findGame(gameSlug.value))
  const dex = computed<GameDex | null>(() =>
    game.value ? resolveDex(game.value, dexSlug.value) : null,
  )

  function setGame(slug: string | null): void {
    gameSlug.value = slug
    dexSlug.value = null
  }

  function setDex(slug: string): void {
    dexSlug.value = slug
  }

  // Carregamento das entradas da Pokédex do jogo (uma requisição por dex, cacheada na store).
  const dexLoading = ref(false)
  const dexError = ref<string | null>(null)

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
      dexError.value = error instanceof Error ? error.message : 'Erro ao carregar a Pokédex'
    } finally {
      if (dex.value?.slug === current.slug) dexLoading.value = false
    }
  }

  const regionalForms = computed(() => buildRegionalFormIndex(store.index))

  const source = computed<ListSource[]>(() => {
    if (!dex.value) return store.index
    const entries = store.dexEntries[dex.value.slug]
    return entries ? buildDexList(entries, dex.value, regionalForms.value) : []
  })

  const filtered = computed(() =>
    source.value.filter((entry) => matches(entry, normalizedQuery.value)),
  )

  const items = ref<PokemonListItem[]>([])
  const status = ref<ListStatus>('idle')
  const errorMessage = ref<string | null>(null)
  /** Muda a cada reset; usado como :key para reiniciar o scroll infinito. */
  const listKey = ref(0)

  const sourceLoading = computed(() => store.indexLoading || dexLoading.value)
  const sourceError = computed(() => store.indexError ?? dexError.value)
  const sourceReady = computed(
    () =>
      store.hasIndex &&
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
    errorMessage.value = null

    const batch = filtered.value.slice(items.value.length, items.value.length + PAGE_SIZE)

    try {
      const summaries = await store.ensureSummaries(batch.map((entry) => entry.id))
      if (current !== generation) return status.value
      items.value.push(
        ...summaries.map((summary, i) => ({
          ...summary,
          dexNumber: batch[i]?.dexNumber,
          speciesId: batch[i]?.speciesId,
        })),
      )
      status.value = hasMore.value ? 'idle' : 'done'
    } catch (error) {
      if (current !== generation) return status.value
      errorMessage.value = error instanceof Error ? error.message : 'Erro ao carregar Pokémon'
      status.value = 'error'
    }
    return status.value
  }

  function reset(): void {
    generation++
    listKey.value++
    items.value = []
    status.value = 'idle'
    errorMessage.value = null
  }

  async function retry(): Promise<void> {
    if (!store.hasIndex) {
      await store.loadIndex(true)
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
    }
    return result
  }

  watch([normalizedQuery, () => game.value?.slug, () => dex.value?.slug], () => {
    router.replace({ query: buildQuery() })
  })

  // Troca de jogo/dex volta ao topo; a busca só reinicia a lista.
  watch(dex, () => {
    window.scrollTo({ top: 0 })
    loadDex()
  })

  watch([source, normalizedQuery], () => reset())

  store.loadIndex()
  loadDex()

  return {
    query,
    games: GAMES,
    game,
    dex,
    setGame,
    setDex,
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
