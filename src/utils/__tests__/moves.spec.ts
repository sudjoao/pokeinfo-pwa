import { describe, expect, it } from 'vitest'
import { moveInfo, movesByMethod, versionGroupsWithMoves } from '@/utils/moves'
import { captureChance, eggSteps, statRange } from '@/utils/stats'

describe('moveInfo', () => {
  it('valores atuais sem grupo de versões', () => {
    const chop = moveInfo('karate-chop')!
    expect(chop.type).toBe('fighting')
    expect(chop.category).toBe('physical')
    expect(chop.power).toBe(50)
    expect(chop.nameEs).toBe('Golpe Kárate')
  })

  it('valores antigos antes do grupo em que o golpe mudou', () => {
    expect(moveInfo('karate-chop', 'red-blue')!.type).toBe('normal')
    expect(moveInfo('karate-chop', 'gold-silver')!.type).toBe('fighting')
  })

  it('golpe de status sem poder', () => {
    expect(moveInfo('growl')!.power).toBeNull()
    expect(moveInfo('growl')!.category).toBe('status')
  })

  it('golpe desconhecido', () => {
    expect(moveInfo('nao-existe')).toBeNull()
  })
})

describe('movesByMethod', () => {
  const moves = [
    { move: 'tackle', versionGroup: 'red-blue', method: 'level-up', level: 1 },
    { move: 'vine-whip', versionGroup: 'red-blue', method: 'level-up', level: 13 },
    { move: 'growl', versionGroup: 'red-blue', method: 'level-up', level: 7 },
    { move: 'swords-dance', versionGroup: 'red-blue', method: 'machine', level: 0 },
    { move: 'tackle', versionGroup: 'scarlet-violet', method: 'level-up', level: 1 },
    { move: 'tackle', versionGroup: 'red-blue', method: 'level-up', level: 1 },
  ]

  it('separa por método, ordena por nível e tira repetidos', () => {
    const groups = movesByMethod(moves, 'red-blue')
    expect(groups['level-up'].map((m) => m.info.slug)).toEqual(['tackle', 'growl', 'vine-whip'])
    expect(groups.machine).toHaveLength(1)
    expect(groups.egg).toHaveLength(0)
  })

  it('grupos de versões do mais recente para o mais antigo', () => {
    expect(versionGroupsWithMoves(moves)).toEqual(['scarlet-violet', 'red-blue'])
  })
})

describe('stats', () => {
  it('faixa no nível 100 (Garchomp: ataque 130, HP 108)', () => {
    expect(statRange('attack', 130, 100)).toEqual({ min: 238, max: 394 })
    expect(statRange('hp', 108, 100)).toEqual({ min: 326, max: 420 })
  })

  it('faixa no nível 50', () => {
    expect(statRange('speed', 102, 50)).toEqual({ min: 96, max: 169 })
  })

  it('Shedinja tem sempre 1 de HP', () => {
    expect(statRange('hp', 1, 100)).toEqual({ min: 1, max: 1 })
  })

  it('captura e ovo', () => {
    expect(captureChance(255, 'full')).toBeCloseTo(1 / 3)
    expect(captureChance(3, 'min')).toBeCloseTo(3 / 255)
    expect(captureChance(255, 'min')).toBe(1)
    expect(eggSteps(20)).toBe(5140)
  })
})
