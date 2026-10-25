import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import {
  POKEMON_TYPES,
  type PokedexEntry,
  type PokemonIndexEntry,
  type PokemonSummary,
  type PokemonType,
} from '@/types/pokemon'
import { getPokemonIndex, getPokemonSummary } from '@/services/pokeapi/pokemon.service'
import { getPokedexEntries } from '@/services/pokeapi/pokedex.service'
import { getLocationAreaEncounters } from '@/services/pokeapi/location.service'
import type { LocationAreaDto } from '@/services/pokeapi/dto'
import {
  DEX_INDEX_DATE,
  DEX_INDEX_NAMES,
  DEX_INDEX_RANGES,
  DEX_INDEX_TYPES,
} from '@/data/generated/dexIndex'
import { decodeDexIndex, type TypeMap } from '@/utils/dexIndex'
import { buildRegionalFormIndex } from '@/utils/games'
import { whenIdle } from '@/utils/idle'
import { readStorage, removeStorage, writeStorage } from '@/utils/storage'

/** O que a PokéAPI tem e o build não: Pokémon/formas lançados depois do índice gerado. */
const EXTRA_KEY = 'pokeinfo:index-extra:v1'
/**
 * Chaves antigas: resumos por Pokémon (~150 KB), e depois o índice (~40 KB) e o mapa de tipos
 * (~16 KB) baixados da API na primeira visita. Hoje os dois vêm embutidos no build.
 */
const LEGACY_KEYS = ['pokeinfo:summaries:v1', 'pokeinfo:index:v1', 'pokeinfo:types:v1']
/** Intervalo entre conferências do índice da API atrás de Pokémon mais novos que o build. */
const CHECK_EVERY_MS = 7 * 24 * 60 * 60 * 1000

/** Formato persistido do que veio depois do build; os tipos são índices em POKEMON_TYPES. */
interface PersistedExtra {
  checkedAt: number
  entries: PokemonIndexEntry[]
  types: Record<number, number[]>
}

/**
 * Índice da Pokédex e mapa de tipos, embutidos no build (scripts/gen-dex-index.mjs), mais o que a
 * API ganhou depois dele. Com os dois em mãos, os cards da lista e da cadeia de evolução não fazem
 * requisição nenhuma. As Pokédex regionais ficam só em memória; offline fica por conta do service
 * worker.
 */
export const usePokedexStore = defineStore('pokedex', () => {
  LEGACY_KEYS.forEach(removeStorage)

  const generated = decodeDexIndex(DEX_INDEX_RANGES, DEX_INDEX_NAMES, DEX_INDEX_TYPES)
  const extra = readStorage<PersistedExtra>(EXTRA_KEY)
  /** Última conferência do índice; sem nenhuma, conta a partir da data do build. */
  let checkedAt = extra?.checkedAt ?? Date.parse(DEX_INDEX_DATE)

  const extraTypes: TypeMap = {}
  for (const [id, list] of Object.entries(extra?.types ?? {})) {
    extraTypes[Number(id)] = list.map((i) => POKEMON_TYPES[i] ?? 'unknown')
  }

  // shallowRef: são listas/mapas grandes e imutáveis, não precisam de proxies profundos.
  const index = shallowRef<PokemonIndexEntry[]>(
    extra?.entries.length ? withEntries(generated.entries, extra.entries) : generated.entries,
  )
  const typesById = shallowRef<TypeMap>({ ...extraTypes, ...generated.types })

  /** Mapa "espécie -> forma regional" por região, derivado do índice (usado pela lista e pelo detalhe). */
  const regionalForms = computed(() => buildRegionalFormIndex(index.value))

  /** Índice por id, para resolver nomes a partir de ids soltos (ex.: o time na URL). */
  const indexById = computed(() => new Map(index.value.map((entry) => [entry.id, entry])))

  function entryOf(id: number): PokemonIndexEntry | undefined {
    return indexById.value.get(id)
  }

  /** O índice com as entradas que ele ainda não tem, em ordem de id. */
  function withEntries(
    base: PokemonIndexEntry[],
    added: readonly PokemonIndexEntry[],
  ): PokemonIndexEntry[] {
    const known = new Set(base.map((entry) => entry.id))
    const missing = added.filter((entry) => !known.has(entry.id))
    return missing.length ? [...base, ...missing].sort((a, b) => a.id - b.id) : base
  }

  /** Guarda só o que não está no build (quase sempre nada além da data da conferência). */
  function persistExtra(): void {
    const types: Record<number, number[]> = {}
    for (const [id, list] of Object.entries(typesById.value)) {
      if (generated.types[Number(id)]) continue
      types[Number(id)] = list.map((type) => POKEMON_TYPES.indexOf(type))
    }
    const builtIds = new Set(generated.entries.map((entry) => entry.id))
    const entries = index.value.filter((entry) => !builtIds.has(entry.id))
    writeStorage(EXTRA_KEY, { checkedAt, entries, types } satisfies PersistedExtra)
  }

  /**
   * Confere, em segundo plano e no máximo uma vez por semana, se a PokéAPI tem Pokémon que o build
   * não tem. É uma requisição só (o índice, ~12 KB comprimidos); os tipos dos novos são buscados
   * quando um card precisar deles. Sem rede, tenta de novo na próxima abertura.
   */
  function checkForNewEntries(): void {
    if (Date.now() - checkedAt < CHECK_EVERY_MS) return
    whenIdle(() => {
      getPokemonIndex()
        .then((latest) => {
          index.value = withEntries(index.value, latest)
          checkedAt = Date.now()
          persistExtra()
        })
        .catch(() => {})
    })
  }

  const summaryInFlight = new Map<number, Promise<PokemonType[]>>()

  /**
   * Tipos de um Pokémon que não está no mapa (lançado depois do build): busca o detalhe
   * uma vez e grava no mapa, para o card não ficar sem tipos.
   */
  function fetchMissingTypes(id: number): Promise<PokemonType[]> {
    const pending = summaryInFlight.get(id)
    if (pending) return pending
    const request = getPokemonSummary(id)
      .then((summary) => {
        typesById.value = { ...typesById.value, [id]: summary.types }
        persistExtra()
        return summary.types
      })
      .finally(() => summaryInFlight.delete(id))
    summaryInFlight.set(id, request)
    return request
  }

  function typesOf(id: number): PokemonType[] | undefined {
    return typesById.value[id]
  }

  /** Resumos (id, nome, tipos) das entradas informadas; só faz requisição para ids fora do mapa. */
  async function ensureSummaries(entries: readonly PokemonIndexEntry[]): Promise<PokemonSummary[]> {
    return Promise.all(
      entries.map(async (entry) => ({
        id: entry.id,
        name: entry.name,
        types: typesOf(entry.id) ?? (await fetchMissingTypes(entry.id)),
      })),
    )
  }

  checkForNewEntries()

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

  /** Encontros crus de áreas (`/location-area/{slug}`) já carregados, por slug. */
  const areaEncounters = shallowRef<Record<string, LocationAreaDto>>({})
  const areaInFlight = new Map<string, Promise<LocationAreaDto>>()

  /** Garante que os encontros da área informada estejam em memória (uma requisição por área). */
  function ensureAreaEncounters(slug: string): Promise<LocationAreaDto> {
    const cached = areaEncounters.value[slug]
    if (cached) return Promise.resolve(cached)

    const pending = areaInFlight.get(slug)
    if (pending) return pending

    const request = getLocationAreaEncounters(slug)
      .then((dto) => {
        areaEncounters.value = { ...areaEncounters.value, [slug]: dto }
        return dto
      })
      .finally(() => areaInFlight.delete(slug))
    areaInFlight.set(slug, request)
    return request
  }

  return {
    index,
    regionalForms,
    entryOf,
    typesOf,
    ensureSummaries,
    dexEntries,
    ensureDexEntries,
    areaEncounters,
    ensureAreaEncounters,
  }
})
