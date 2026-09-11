import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import {
  POKEMON_TYPES,
  type PokedexEntry,
  type PokemonIndexEntry,
  type PokemonSummary,
  type PokemonType,
} from '@/types/pokemon'
import { getPokemonIndex, getPokemonSummary } from '@/services/pokeapi/pokemon.service'
import { getPokedexEntries } from '@/services/pokeapi/pokedex.service'
import { getTypeMap, type TypeMap } from '@/services/pokeapi/type.service'
import { buildRegionalFormIndex } from '@/utils/games'
import { readStorage, removeStorage, writeStorage } from '@/utils/storage'

const INDEX_KEY = 'pokeinfo:index:v1'
const TYPES_KEY = 'pokeinfo:types:v1'
/** Chave antiga (resumos por Pokémon, ~150 KB); substituída pelo mapa de tipos. */
const LEGACY_SUMMARIES_KEY = 'pokeinfo:summaries:v1'
/** Idade a partir da qual o mapa de tipos é atualizado em segundo plano. */
const TYPES_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

/** Formato persistido do mapa de tipos: índices em POKEMON_TYPES no lugar dos nomes (~16 KB). */
interface PersistedTypes {
  savedAt: number
  types: Record<number, number[]>
}

function encodeTypes(map: TypeMap): PersistedTypes {
  const types: Record<number, number[]> = {}
  for (const [id, list] of Object.entries(map)) {
    types[Number(id)] = list.map((type) => POKEMON_TYPES.indexOf(type))
  }
  return { savedAt: Date.now(), types }
}

function decodeTypes(saved: PersistedTypes): TypeMap {
  const map: TypeMap = {}
  for (const [id, list] of Object.entries(saved.types)) {
    map[Number(id)] = list.map((i) => POKEMON_TYPES[i] ?? 'unknown')
  }
  return map
}

/**
 * Cache em memória + localStorage do índice da Pokédex e do mapa de tipos.
 * Com os dois em mãos, os cards da lista e da cadeia de evolução não fazem requisição nenhuma.
 * As Pokédex regionais ficam só em memória; offline fica por conta do service worker.
 */
export const usePokedexStore = defineStore('pokedex', () => {
  removeStorage(LEGACY_SUMMARIES_KEY)

  // shallowRef: são listas/mapas grandes e imutáveis, não precisam de proxies profundos.
  const index = shallowRef<PokemonIndexEntry[]>(readStorage<PokemonIndexEntry[]>(INDEX_KEY) ?? [])
  const savedTypes = readStorage<PersistedTypes>(TYPES_KEY)
  const typesById = shallowRef<TypeMap | null>(savedTypes ? decodeTypes(savedTypes) : null)

  const indexLoading = ref(false)
  const typesLoading = ref(false)
  /** Erro do último carregamento (índice ou tipos); a mensagem é traduzida na interface. */
  const sourceError = ref<unknown>(null)

  const hasIndex = computed(() => index.value.length > 0)
  const hasTypes = computed(() => typesById.value !== null)
  /** Índice + tipos prontos: tudo que a listagem precisa para montar os cards. */
  const ready = computed(() => hasIndex.value && hasTypes.value)
  const loading = computed(() => indexLoading.value || typesLoading.value)

  /** Mapa "espécie -> forma regional" por região, derivado do índice (usado pela lista e pelo detalhe). */
  const regionalForms = computed(() => buildRegionalFormIndex(index.value))

  /** Índice por id, para resolver nomes a partir de ids soltos (ex.: o time na URL). */
  const indexById = computed(() => new Map(index.value.map((entry) => [entry.id, entry])))

  function entryOf(id: number): PokemonIndexEntry | undefined {
    return indexById.value.get(id)
  }

  async function loadIndex(force = false): Promise<void> {
    if ((hasIndex.value && !force) || indexLoading.value) return
    indexLoading.value = true
    try {
      index.value = await getPokemonIndex()
      writeStorage(INDEX_KEY, index.value)
    } catch (error) {
      sourceError.value = error
    } finally {
      indexLoading.value = false
    }
  }

  let typesRequest: Promise<void> | null = null

  /** Baixa o mapa de tipos (18 requisições paralelas). Silencioso quando é só atualização. */
  function loadTypes(force = false): Promise<void> {
    if (hasTypes.value && !force) return Promise.resolve()
    if (typesRequest) return typesRequest
    const background = hasTypes.value
    if (!background) typesLoading.value = true
    typesRequest = getTypeMap()
      .then((map) => {
        typesById.value = map
        writeStorage(TYPES_KEY, encodeTypes(map))
      })
      .catch((error: unknown) => {
        if (!background) sourceError.value = error
      })
      .finally(() => {
        typesLoading.value = false
        typesRequest = null
      })
    return typesRequest
  }

  /** Carrega o que faltar para a listagem; refaz o mapa de tipos em segundo plano se estiver velho. */
  async function load(force = false): Promise<void> {
    if (force) sourceError.value = null
    await Promise.all([loadIndex(force), loadTypes(force)])
    if (savedTypes && Date.now() - savedTypes.savedAt > TYPES_MAX_AGE_MS && hasTypes.value) {
      loadTypes(true)
    }
  }

  const summaryInFlight = new Map<number, Promise<PokemonType[]>>()

  /**
   * Tipos de um Pokémon que não está no mapa (lançado depois do cache): busca o detalhe
   * uma vez e grava no mapa, para o card não ficar sem tipos.
   */
  function fetchMissingTypes(id: number): Promise<PokemonType[]> {
    const pending = summaryInFlight.get(id)
    if (pending) return pending
    const request = getPokemonSummary(id)
      .then((summary) => {
        typesById.value = { ...typesById.value, [id]: summary.types }
        writeStorage(TYPES_KEY, encodeTypes(typesById.value))
        return summary.types
      })
      .finally(() => summaryInFlight.delete(id))
    summaryInFlight.set(id, request)
    return request
  }

  function typesOf(id: number): PokemonType[] | undefined {
    return typesById.value?.[id]
  }

  /** Resumos (id, nome, tipos) das entradas informadas; só faz requisição para ids fora do mapa. */
  async function ensureSummaries(entries: readonly PokemonIndexEntry[]): Promise<PokemonSummary[]> {
    await loadTypes()
    return Promise.all(
      entries.map(async (entry) => ({
        id: entry.id,
        name: entry.name,
        types: typesOf(entry.id) ?? (await fetchMissingTypes(entry.id)),
      })),
    )
  }

  /** Entradas das Pokédex regionais já carregadas, por slug (ex.: "galar"). */
  const dexEntries = shallowRef<Record<string, PokedexEntry[]>>({})
  const dexInFlight = new Map<string, Promise<PokedexEntry[]>>()

  /** Garante que as entradas da Pokédex informada estejam em memória (uma requisição por dex). */
  function ensureDexEntries(slug: string): Promise<PokedexEntry[]> {
    const cached = dexEntries.value[slug]
    if (cached) return Promise.resolve(cached)

    const pending = dexInFlight.get(slug)
    if (pending) return pending

    const request = getPokedexEntries(slug)
      .then((entries) => {
        dexEntries.value = { ...dexEntries.value, [slug]: entries }
        return entries
      })
      .finally(() => dexInFlight.delete(slug))
    dexInFlight.set(slug, request)
    return request
  }

  return {
    index,
    hasIndex,
    ready,
    loading,
    sourceError,
    regionalForms,
    entryOf,
    load,
    typesOf,
    ensureSummaries,
    dexEntries,
    ensureDexEntries,
  }
})
