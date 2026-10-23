import { describe, expect, it } from 'vitest'
import {
  decodeLearners,
  hasLearnset,
  learnersByMethod,
  loadLearnset,
  pokemonLearningAll,
} from '@/utils/learnsets'

describe('decodeLearners', () => {
  it('lê id em base36, método e nível', () => {
    expect(decodeLearners('pL10,pM,3hL1a,sE')).toEqual([
      { id: 25, method: 'L', level: 36 },
      { id: 25, method: 'M', level: null },
      { id: 125, method: 'L', level: 46 },
      { id: 28, method: 'E', level: null },
    ])
    expect(decodeLearners(undefined)).toEqual([])
  })

  it('agrupa por método, por nível, sem repetir', () => {
    const groups = learnersByMethod(decodeLearners('qL5,pLa,pM,pM,1L1,1M'))
    expect(groups.L).toEqual([
      { id: 1, level: 1 },
      { id: 26, level: 5 },
      { id: 25, level: 10 },
    ])
    expect(groups.M).toEqual([1, 25])
  })
})

describe('pokemonLearningAll', () => {
  const learnset = { thunderbolt: 'pM,qM,1M', surf: 'pO,9M', 'iron-tail': 'pM,qM' }

  it('interseção por qualquer método', () => {
    expect([...pokemonLearningAll(learnset, ['thunderbolt', 'surf'])]).toEqual([25])
    expect([...pokemonLearningAll(learnset, ['thunderbolt', 'iron-tail'])].sort()).toEqual([25, 26])
    expect(pokemonLearningAll(learnset, [])).toEqual(new Set())
  })
})

describe('arquivos gerados', () => {
  it('Scarlet/Violet tem learnset; Legends: Z-A não', () => {
    expect(hasLearnset('scarlet-violet')).toBe(true)
    expect(hasLearnset('legends-za')).toBe(false)
    expect(loadLearnset('legends-za')).toBeNull()
  })

  it('Pikachu aprende Thunderbolt em Scarlet/Violet, e Earthquake + Ice Beam juntos são raros', async () => {
    const learnset = await loadLearnset('scarlet-violet')!
    const pikachu = decodeLearners(learnset.thunderbolt).filter((l) => l.id === 25)
    expect(pikachu.map((l) => l.method).sort()).toEqual(['L', 'M'])
    const both = pokemonLearningAll(learnset, ['earthquake', 'ice-beam'])
    expect(both.has(130)).toBe(true) // Gyarados
    expect(both.has(25)).toBe(false)
  })
})
