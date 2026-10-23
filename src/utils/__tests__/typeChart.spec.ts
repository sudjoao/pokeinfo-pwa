import { describe, expect, it } from 'vitest'
import {
  analyzeCoverage,
  analyzeDefense,
  attackMultiplier,
  battleTypes,
  coverageGaps,
  formatMultiplier,
  teamThreats,
  typesInGeneration,
} from '@/utils/typeChart'

describe('attackMultiplier', () => {
  it('multiplica os dois tipos do defensor', () => {
    expect(attackMultiplier('ice', ['dragon', 'flying'])).toBe(4)
    expect(attackMultiplier('fire', ['water', 'rock'])).toBe(0.25)
    expect(attackMultiplier('electric', ['water', 'ground'])).toBe(0)
  })

  it('assume 1× para relações que não estão na tabela', () => {
    expect(attackMultiplier('normal', ['fire'])).toBe(1)
    expect(attackMultiplier('dragon', ['fairy'])).toBe(0)
  })
})

describe('formatMultiplier', () => {
  it('usa frações e esconde o neutro', () => {
    expect(formatMultiplier(4)).toBe('4×')
    expect(formatMultiplier(0.5)).toBe('½')
    expect(formatMultiplier(0.25)).toBe('¼')
    expect(formatMultiplier(0)).toBe('0')
    expect(formatMultiplier(1)).toBe('')
  })
})

describe('análise do time', () => {
  const team = [
    { types: ['grass'] as const },
    { types: ['grass', 'poison'] as const },
    { types: ['water'] as const },
  ]

  it('conta membros fracos e resistentes por tipo de ataque', () => {
    const fire = analyzeDefense(team).find((row) => row.type === 'fire')!
    expect(fire.multipliers).toEqual([2, 2, 0.5])
    expect(fire.weak).toBe(2)
    expect(fire.resistant).toBe(1)
  })

  it('só aponta ameaça com dois ou mais fracos e mais fracos do que resistentes', () => {
    const threats = teamThreats(analyzeDefense(team)).map((row) => row.type)
    expect(threats).toContain('flying')
    expect(threats).not.toContain('electric')
  })

  it('cobertura por STAB e lacunas', () => {
    const rows = analyzeCoverage(team)
    expect(rows.find((row) => row.type === 'fire')!.coveredBy).toEqual([2])
    expect(coverageGaps(rows).map((row) => row.type)).toContain('steel')
  })
})

describe('tabelas por geração', () => {
  it('Fantasma não afetava Psíquico e Inseto/Venenoso se acertavam na 1ª geração', () => {
    expect(attackMultiplier('ghost', ['psychic'], 1)).toBe(0)
    expect(attackMultiplier('ghost', ['psychic'], 2)).toBe(2)
    expect(attackMultiplier('bug', ['poison'], 1)).toBe(2)
    expect(attackMultiplier('ice', ['fire'], 1)).toBe(1)
  })

  it('Aço resistia a Fantasma e Sombrio até a 5ª', () => {
    expect(attackMultiplier('ghost', ['steel'], 5)).toBe(0.5)
    expect(attackMultiplier('ghost', ['steel'], 6)).toBe(1)
  })

  it('tipos que ainda não existiam ficam fora da análise', () => {
    expect(battleTypes(1)).not.toContain('dark')
    expect(battleTypes(1)).not.toContain('fairy')
    expect(battleTypes(5)).toContain('steel')
    expect(battleTypes(5)).not.toContain('fairy')
    expect(battleTypes()).toHaveLength(18)
    expect(analyzeDefense([{ types: ['normal'] }], 1)).toHaveLength(15)
  })

  it('tipos antigos dos Pokémon', () => {
    expect(typesInGeneration(35, ['fairy'], 5)).toEqual(['normal'])
    expect(typesInGeneration(35, ['fairy'], 6)).toEqual(['fairy'])
    expect(typesInGeneration(81, ['electric', 'steel'], 1)).toEqual(['electric'])
    expect(typesInGeneration(25, ['electric'], 1)).toEqual(['electric'])
  })
})
