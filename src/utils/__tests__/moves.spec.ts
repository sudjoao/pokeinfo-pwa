import { describe, expect, it } from 'vitest'
import {
  moveInfo,
  movesByMethod,
  versionGroupsWithMoves,
  moveList,
  filterMoves,
  moveHistory,
} from '@/utils/moves'
import {
  applyCharacteristic,
  captureChance,
  eggSteps,
  possibleIvs,
  statRange,
  statValue,
} from '@/utils/stats'

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

describe('lista de golpes', () => {
  it('sem jogo: só golpes aprendíveis (sem Z-moves nem Max/G-Max), com Sketch', () => {
    const slugs = new Set(moveList(null).map((m) => m.slug))
    expect(slugs.has('thunderbolt')).toBe(true)
    expect(slugs.has('sketch')).toBe(true)
    expect(slugs.has('acid-downpour--physical')).toBe(false)
    expect(slugs.has('max-flare')).toBe(false)
    expect(slugs.has('g-max-wildfire')).toBe(false)
  })

  it('com o learnset do jogo: só os golpes dele, com os valores dele', () => {
    const list = moveList('red-blue', new Set(['karate-chop', 'tackle']))
    expect(list.map((m) => m.slug).sort()).toEqual(['karate-chop', 'tackle'])
    expect(list.find((m) => m.slug === 'karate-chop')?.type).toBe('normal')
  })

  it('filtra por nome sem acento, tipo e categoria, e ordena por poder', () => {
    const moves = moveList(null)
    const fire = filterMoves(
      moves,
      { query: '', type: 'fire', category: 'special', sort: 'power', desc: true },
      'en',
    )
    expect(fire.every((m) => m.type === 'fire' && m.category === 'special')).toBe(true)
    expect(fire[0]!.power).toBeGreaterThanOrEqual(fire[fire.length - 1]!.power ?? 0)
    const es = filterMoves(
      moves,
      { query: 'acrobata', type: null, category: null, sort: 'name', desc: false },
      'es',
    )
    expect(es.map((m) => m.slug)).toContain('acrobatics')
  })

  it('histórico: Karate Chop era Normal antes de Gold/Silver', () => {
    const history = moveHistory('karate-chop')
    expect(history.some((h) => h.before === 'gold-silver' && h.type === 'normal')).toBe(true)
  })
})

describe('stat real e IVs', () => {
  // Exemplo da Bulbapedia (página "Stat"): Garchomp nível 78, Adamant.
  const garchomp = {
    base: {
      hp: 108,
      attack: 130,
      defense: 95,
      'special-attack': 80,
      'special-defense': 85,
      speed: 102,
    },
    ivs: { hp: 24, attack: 12, defense: 30, 'special-attack': 16, 'special-defense': 23, speed: 5 },
    evs: {
      hp: 74,
      attack: 190,
      defense: 91,
      'special-attack': 48,
      'special-defense': 84,
      speed: 23,
    },
    nature: { attack: 110, 'special-attack': 90 } as Partial<Record<string, 110 | 90>>,
    stats: {
      hp: 289,
      attack: 278,
      defense: 193,
      'special-attack': 135,
      'special-defense': 171,
      speed: 171,
    },
  }
  const names = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'] as const

  it('fórmula com IV, EV e natureza', () => {
    for (const name of names) {
      expect(
        statValue(
          name,
          garchomp.base[name],
          78,
          garchomp.ivs[name],
          garchomp.evs[name],
          garchomp.nature[name] ?? 100,
        ),
      ).toBe(garchomp.stats[name])
    }
  })

  it('IVs possíveis incluem o real; no nível 78 sobram no máximo 3', () => {
    for (const name of names) {
      const ivs = possibleIvs(
        name,
        garchomp.base[name],
        78,
        garchomp.evs[name],
        garchomp.nature[name] ?? 100,
        garchomp.stats[name],
      )
      expect(ivs).toContain(garchomp.ivs[name])
      expect(ivs.length).toBeLessThanOrEqual(3)
    }
  })

  it('característica: filtra pelo resto ÷5 e limita os outros ao maior IV', () => {
    const ivs = {
      hp: [20, 21, 22],
      attack: [28, 29, 30, 31],
      defense: [0, 1],
      'special-attack': [5],
      'special-defense': [9],
      speed: [10],
    }
    const narrowed = applyCharacteristic(ivs, 'hp', 1)
    expect(narrowed.hp).toEqual([21])
    expect(narrowed.attack).toEqual([])
    expect(narrowed.speed).toEqual([10])
  })
})
