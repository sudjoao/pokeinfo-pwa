import { describe, expect, it } from 'vitest'
import { exportShowdown, importShowdown, showdownName, speciesFromLine } from '@/utils/showdown'
import { suggestCounters } from '@/utils/typeChart'
import type { PokemonType } from '@/types/pokemon'

const index = [
  { id: 6, name: 'charizard' },
  { id: 122, name: 'mr-mime' },
  { id: 445, name: 'garchomp' },
  { id: 479, name: 'rotom' },
  { id: 10009, name: 'rotom-wash' },
  { id: 10100, name: 'raichu-alola' },
  { id: 83, name: 'farfetchd' },
]

describe('Showdown', () => {
  it('nomes das formas e especiais', () => {
    expect(showdownName('raichu-alola')).toBe('Raichu-Alola')
    expect(showdownName('mr-mime')).toBe('Mr. Mime')
    expect(showdownName('farfetchd')).toBe("Farfetch'd")
  })

  it('espécie da primeira linha', () => {
    expect(speciesFromLine('Chompy (Garchomp) (M) @ Choice Scarf')).toBe('Garchomp')
    expect(speciesFromLine('Rotom-Wash @ Leftovers')).toBe('Rotom-Wash')
    expect(speciesFromLine('Charizard (F)')).toBe('Charizard')
  })

  it('exporta e importa de volta', () => {
    const text = exportShowdown([index[0]!, index[5]!, index[1]!])
    expect(importShowdown(text, index).ids).toEqual([6, 10100, 122])
  })

  it('importa um time completo do Showdown', () => {
    const text = `Chompy (Garchomp) (M) @ Choice Scarf
Ability: Rough Skin
- Earthquake

Rotom-Wash @ Leftovers
Ability: Levitate

Farfetch’d @ Leek

Missingno @ Nada`
    const result = importShowdown(text, index)
    expect(result.ids).toEqual([445, 10009, 83])
    expect(result.unknown).toEqual(['Missingno'])
  })
})

describe('suggestCounters', () => {
  const types: Record<number, PokemonType[]> = {
    1: ['steel'],
    2: ['water', 'ground'],
    3: ['grass'],
    4: ['fire'],
  }
  const candidates = [1, 2, 3, 4].map((id) => ({ id, name: `p${id}` }))

  it('quem resiste a mais ameaças sem ser fraco a nenhuma', () => {
    const result = suggestCounters(candidates, ['ice', 'rock'], (id) => types[id], new Set())
    expect(result.map((r) => r.id)).toEqual([1, 2])
    expect(result[0]!.covers).toEqual(['ice', 'rock'])
  })

  it('ignora quem já está no time', () => {
    expect(suggestCounters(candidates, ['ice'], (id) => types[id], new Set([1, 4]))).toEqual([])
  })
})
