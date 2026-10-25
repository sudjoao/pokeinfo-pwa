import { describe, expect, it } from 'vitest'
import { decodeDexIndex } from '@/utils/dexIndex'
import { DEX_INDEX_NAMES, DEX_INDEX_RANGES, DEX_INDEX_TYPES } from '@/data/generated/dexIndex'

describe('decodeDexIndex', () => {
  it('expande os intervalos de ids e os tipos de dois caracteres', () => {
    const { entries, types } = decodeDexIndex(
      [
        [1, 2],
        [10001, 10001],
      ],
      'a b c',
      'dh--b-',
    )
    expect(entries).toEqual([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
      { id: 10001, name: 'c' },
    ])
    expect(types).toEqual({ 1: ['grass', 'poison'], 10001: ['fire'] })
  })

  it('decodifica o índice gerado com nomes e tipos alinhados', () => {
    const { entries, types } = decodeDexIndex(DEX_INDEX_RANGES, DEX_INDEX_NAMES, DEX_INDEX_TYPES)
    expect(DEX_INDEX_TYPES).toHaveLength(entries.length * 2)
    expect(DEX_INDEX_NAMES.split(' ')).toHaveLength(entries.length)
    const byName = new Map(entries.map((entry) => [entry.name, entry.id]))
    expect(byName.get('bulbasaur')).toBe(1)
    expect(byName.get('pikachu')).toBe(25)
    expect(types[6]).toEqual(['fire', 'flying'])
    expect(types[byName.get('rotom-wash')!]).toEqual(['electric', 'water'])
    expect(types[byName.get('raichu-alola')!]).toEqual(['electric', 'psychic'])
  })
})
