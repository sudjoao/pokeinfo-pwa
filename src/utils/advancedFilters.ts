import type { LocationQuery } from 'vue-router'
import type { PokemonDataRow } from '@/data/generated/pokemon'
import {
  STAT_NAMES,
  type PokemonIndexEntry,
  type PokemonType,
  type StatName,
} from '@/types/pokemon'
import { isPokemonType } from '@/utils/pokemon'
import { attackMultiplier, typesInGeneration } from '@/utils/typeChart'

export const SORT_KEYS = ['number', 'name', 'total', ...STAT_NAMES, 'height', 'weight'] as const
export type SortKey = (typeof SORT_KEYS)[number]

export const CATEGORIES = ['legendary', 'mythical', 'baby', 'regular'] as const
export type Category = (typeof CATEGORIES)[number]

export const GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const

/** Filtros e ordenação além de busca/jogo/tipo/captura (botão "Filtros" da listagem). */
export interface AdvancedFilters {
  sort: SortKey
  /** Ordem decrescente (o padrão de "total" e stats faz mais sentido do maior para o menor). */
  desc: boolean
  generations: number[]
  categories: Category[]
  /** Só quem toma dano super efetivo deste tipo (como o filtro "Fraqueza" da Pokédex oficial). */
  weakTo: PokemonType | null
  /** Slug da habilidade (normal ou oculta). */
  ability: string | null
  /** Total de stats base mínimo. */
  minTotal: number | null
  favorites: boolean
}

export const EMPTY_ADVANCED: AdvancedFilters = {
  sort: 'number',
  desc: false,
  generations: [],
  categories: [],
  weakTo: null,
  ability: null,
  minTotal: null,
  favorites: false,
}

/** Parâmetros da URL controlados por estes filtros. */
export const ADVANCED_QUERY_KEYS = [
  'sort',
  'desc',
  'gen',
  'cat',
  'weak',
  'ability',
  'min',
  'fav',
] as const

function single(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null
}

function list(value: unknown): string[] {
  const text = single(value)
  return text ? [...new Set(text.split(',').filter(Boolean))] : []
}

export function parseAdvanced(query: LocationQuery): AdvancedFilters {
  const sort = single(query.sort)
  const weak = single(query.weak)
  const min = Number(single(query.min))
  return {
    sort: (SORT_KEYS as readonly string[]).includes(sort ?? '') ? (sort as SortKey) : 'number',
    desc: query.desc === '1',
    generations: list(query.gen)
      .map(Number)
      .filter((gen) => (GENERATIONS as readonly number[]).includes(gen))
      .sort((a, b) => a - b),
    categories: list(query.cat).filter((cat): cat is Category =>
      (CATEGORIES as readonly string[]).includes(cat),
    ),
    weakTo: weak && isPokemonType(weak) ? weak : null,
    ability: single(query.ability),
    minTotal: Number.isFinite(min) && min > 0 ? min : null,
    favorites: query.fav === '1',
  }
}

export function advancedToQuery(filters: AdvancedFilters): Record<string, string> {
  const result: Record<string, string> = {}
  if (filters.sort !== 'number') result.sort = filters.sort
  if (filters.desc) result.desc = '1'
  if (filters.generations.length) result.gen = filters.generations.join(',')
  if (filters.categories.length) result.cat = filters.categories.join(',')
  if (filters.weakTo) result.weak = filters.weakTo
  if (filters.ability) result.ability = filters.ability
  if (filters.minTotal) result.min = String(filters.minTotal)
  if (filters.favorites) result.fav = '1'
  return result
}

/** Quantos filtros estão ativos (a ordenação conta como um). */
export function activeCount(filters: AdvancedFilters): number {
  return (
    Number(filters.sort !== 'number' || filters.desc) +
    Number(filters.generations.length > 0) +
    Number(filters.categories.length > 0) +
    Number(filters.weakTo !== null) +
    Number(filters.ability !== null) +
    Number(filters.minTotal !== null) +
    Number(filters.favorites)
  )
}

/** Precisa da tabela de stats/habilidades (src/data/generated/pokemon.ts, carregada sob demanda). */
export function needsTable(filters: AdvancedFilters): boolean {
  return (
    !['number', 'name'].includes(filters.sort) ||
    filters.generations.length > 0 ||
    filters.categories.length > 0 ||
    filters.ability !== null ||
    filters.minTotal !== null
  )
}

export function rowTotal(row: PokemonDataRow): number {
  return row[0] + row[1] + row[2] + row[3] + row[4] + row[5]
}

/** Valor usado na ordenação (null = sem dado, vai para o fim). */
export function sortValue(row: PokemonDataRow | undefined, key: SortKey): number | null {
  if (!row) return null
  if (key === 'total') return rowTotal(row)
  if (key === 'height') return row[6]
  if (key === 'weight') return row[7]
  const statIndex = STAT_NAMES.indexOf(key as StatName)
  return statIndex >= 0 ? (row[statIndex] as number) : null
}

function categoryOf(row: PokemonDataRow): Category {
  const flags = row[9]
  if (flags & 2) return 'mythical'
  if (flags & 1) return 'legendary'
  if (flags & 4) return 'baby'
  return 'regular'
}

export interface AdvancedContext {
  rows: Readonly<Record<number, PokemonDataRow>> | null
  abilityIndex: ReadonlyMap<string, number> | null
  typesOf: (id: number) => readonly PokemonType[] | undefined
  favorites: ReadonlySet<number>
  /** Geração do jogo selecionado, para o "fraco a" (tabela e tipos daquela geração). */
  generation?: number
}

/** Aplica os filtros avançados e a ordenação; a ordem padrão (número) mantém a da fonte. */
export function applyAdvanced<T extends PokemonIndexEntry>(
  list: readonly T[],
  filters: AdvancedFilters,
  context: AdvancedContext,
): T[] {
  const { rows } = context
  const ability = filters.ability ? context.abilityIndex?.get(filters.ability) : undefined
  const result = list.filter((entry) => {
    if (filters.favorites && !context.favorites.has(entry.id)) return false
    if (filters.weakTo) {
      const own = context.typesOf(entry.id)
      if (!own) return false
      const types = typesInGeneration(entry.id, own, context.generation)
      if (attackMultiplier(filters.weakTo, types, context.generation) <= 1) return false
    }
    if (!rows) return true
    const row = rows[entry.id]
    if (filters.generations.length && (!row || !filters.generations.includes(row[8]))) return false
    if (filters.categories.length && (!row || !filters.categories.includes(categoryOf(row))))
      return false
    if (filters.ability) {
      if (!row || ability === undefined) return false
      if (!row[10].includes(ability) && row[11] !== ability) return false
    }
    if (filters.minTotal && (!row || rowTotal(row) < filters.minTotal)) return false
    return true
  })

  const direction = filters.desc ? -1 : 1
  if (filters.sort === 'name') {
    result.sort((a, b) => a.name.localeCompare(b.name) * direction)
  } else if (filters.sort !== 'number' && rows) {
    // Empate: mantém a ordem da Pokédex (sort é estável).
    result.sort((a, b) => {
      const va = sortValue(rows[a.id], filters.sort)
      const vb = sortValue(rows[b.id], filters.sort)
      if (va === null) return vb === null ? 0 : 1
      if (vb === null) return -1
      return (va - vb) * direction
    })
  } else if (filters.desc) {
    result.reverse()
  }
  return result
}
