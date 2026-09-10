import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePokedexStore } from '@/stores/pokedex'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
import type { PokemonIndexEntry, PokemonSummary } from '@/types/pokemon'

export const PAGE_SIZE = 24

export type ListStatus = 'idle' | 'loading' | 'error' | 'done'

function matches(entry: PokemonIndexEntry, query: string): boolean {
  if (!query) return true
  if (/^\d+$/.test(query)) return entry.id === Number(query)
  return entry.name.includes(query)
}

/**
 * Orquestra busca + scroll infinito sobre o índice da Pokédex.
 * A busca filtra o índice localmente; os lotes carregam só os resumos necessários.
 */
export function usePokemonList() {
  const store = usePokedexStore()
  const route = useRoute()
  const router = useRouter()

  const query = ref(typeof route.query.q === 'string' ? route.query.q : '')
  const debouncedQuery = useDebouncedRef(query, 300)
  const normalizedQuery = computed(() => debouncedQuery.value.trim().toLowerCase())

  const filtered = computed(() =>
    store.index.filter((entry) => matches(entry, normalizedQuery.value)),
  )

  const items = ref<PokemonSummary[]>([])
  const status = ref<ListStatus>('idle')
  const errorMessage = ref<string | null>(null)
  /** Muda a cada reset; usado como :key para reiniciar o scroll infinito. */
  const listKey = ref(0)

  const hasMore = computed(() => items.value.length < filtered.value.length)
  const isEmpty = computed(
    () => store.hasIndex && !store.indexLoading && filtered.value.length === 0,
  )

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

    const nextIds = filtered.value
      .slice(items.value.length, items.value.length + PAGE_SIZE)
      .map((entry) => entry.id)

    try {
      const summaries = await store.ensureSummaries(nextIds)
      if (current !== generation) return status.value
      items.value.push(...summaries)
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
    status.value = 'idle'
    await loadMore()
  }

  watch(normalizedQuery, (value) => {
    router.replace({ query: value ? { q: value } : {} })
    reset()
  })

  watch(
    () => store.index,
    () => reset(),
  )

  store.loadIndex()

  return {
    query,
    filtered,
    items,
    status,
    errorMessage,
    listKey,
    hasMore,
    isEmpty,
    indexLoading: computed(() => store.indexLoading),
    indexError: computed(() => store.indexError),
    loadMore,
    retry,
  }
}
