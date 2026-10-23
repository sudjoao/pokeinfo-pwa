import { describe, expect, it } from 'vitest'
import { ABILITIES, POKEMON_DATA } from '@/data/generated/pokemon'
import {
  activeCount,
  advancedToQuery,
  applyAdvanced,
  EMPTY_ADVANCED,
  needsTable,
  parseAdvanced,
  type AdvancedFilters,
} from '@/utils/advancedFilters'
import type { PokemonType } from '@/types/pokemon'

const TYPES: Record<number, PokemonType[]> = {
  1: ['grass', 'poison'],
  4: ['fire'],
  6: ['fire', 'flying'],
  25: ['electric'],
  35: ['fairy'],
  150: ['psychic'],
  151: ['psychic'],
  172: ['electric'],
}
const list = Object.keys(TYPES).map((id) => ({ id: Number(id), name: `p${id}` }))
const context = {
  rows: POKEMON_DATA,
  abilityIndex: new Map(ABILITIES.map(([slug], index) => [slug, index])),
  typesOf: (id: number) => TYPES[id],
  favorites: new Set([25, 6]),
}
const filters = (change: Partial<AdvancedFilters>) => ({ ...EMPTY_ADVANCED, ...change })
const ids = (change: Partial<AdvancedFilters>, extra = {}) =>
  applyAdvanced(list, filters(change), { ...context, ...extra }).map((entry) => entry.id)

describe('URL', () => {
  it('vai e volta', () => {
    const value = filters({
      sort: 'speed',
      desc: true,
      generations: [1, 2],
      categories: ['legendary'],
      weakTo: 'ice',
      ability: 'static',
      minTotal: 500,
      favorites: true,
    })
    const query = advancedToQuery(value)
    expect(parseAdvanced(query)).toEqual(value)
    expect(activeCount(value)).toBe(7)
  })

  it('ignora valores inválidos', () => {
    expect(
      parseAdvanced({ sort: 'x', gen: '0,99', cat: 'boss', weak: 'laser', min: '-3' }),
    ).toEqual(EMPTY_ADVANCED)
    expect(advancedToQuery(EMPTY_ADVANCED)).toEqual({})
  })

  it('só pede a tabela quando precisa', () => {
    expect(needsTable(filters({ weakTo: 'ice', favorites: true, sort: 'name' }))).toBe(false)
    expect(needsTable(filters({ sort: 'total' }))).toBe(true)
  })
})

describe('applyAdvanced', () => {
  it('ordena por total, do maior para o menor', () => {
    expect(ids({ sort: 'total', desc: true }).slice(0, 2)).toEqual([150, 151])
  })

  it('geração e categoria', () => {
    expect(ids({ generations: [2] })).toEqual([172])
    expect(ids({ categories: ['mythical'] })).toEqual([151])
    expect(ids({ categories: ['baby'] })).toEqual([172])
  })

  it('fraco a: gelo acerta Charizard? não (½×2); Bulbasaur sim', () => {
    expect(ids({ weakTo: 'ice' })).toEqual([1])
  })

  it('fraco a usa a geração do jogo (Fada não existia: Clefairy era Normal)', () => {
    expect(ids({ weakTo: 'poison' })).toContain(35)
    expect(ids({ weakTo: 'poison' }, { generation: 1 })).not.toContain(35)
  })

  it('habilidade, total mínimo e favoritos', () => {
    expect(ids({ ability: 'static' })).toEqual([25, 172])
    expect(ids({ minTotal: 600 })).toEqual([150, 151])
    expect(ids({ favorites: true })).toEqual([6, 25])
  })

  it('número decrescente inverte a ordem da fonte', () => {
    expect(ids({ desc: true })[0]).toBe(172)
  })
})
