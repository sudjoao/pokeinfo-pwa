import { describe, expect, it } from 'vitest'
import {
  DAILY_SPECIES,
  EMPTY_STATS,
  compareFacts,
  dailyAnswer,
  dailyOrder,
  dayKey,
  dayNumber,
  emojiGrid,
  previousDay,
  recordResult,
  type DailyFacts,
} from '@/utils/daily'

describe('sorteio do dia', () => {
  it('determinístico e sem repetir dentro da permutação', () => {
    const order = dailyOrder()
    expect(order).toHaveLength(DAILY_SPECIES)
    expect(new Set(order).size).toBe(DAILY_SPECIES)
    expect(dailyAnswer('2026-10-24')).toBe(dailyAnswer('2026-10-24'))
    expect(dailyAnswer('2026-10-24')).not.toBe(dailyAnswer('2026-10-25'))
  })

  it('número do dia e virada à meia-noite local', () => {
    expect(dayNumber('2026-10-23')).toBe(1)
    expect(dayNumber('2026-10-24')).toBe(2)
    expect(dayNumber('2026-01-01')).toBe(1)
    expect(dayKey(new Date(2026, 9, 24, 23, 59))).toBe('2026-10-24')
    expect(dayKey(new Date(2026, 9, 25, 0, 1))).toBe('2026-10-25')
    expect(previousDay('2026-11-01')).toBe('2026-10-31')
    expect(dailyAnswer('2026-10-23')).toBe(dailyAnswer('2029-08-13'))
  })
})

describe('pistas', () => {
  const garchomp: DailyFacts = {
    id: 445,
    generation: 4,
    types: ['dragon', 'ground'],
    height: 19,
    weight: 950,
    total: 600,
  }
  const flygon: DailyFacts = {
    id: 330,
    generation: 3,
    types: ['ground', 'dragon'],
    height: 20,
    weight: 820,
    total: 520,
  }

  it('direção aponta para a resposta; tipo trocado de slot é amarelo', () => {
    expect(compareFacts(flygon, garchomp)).toEqual({
      generation: 'higher',
      type1: 'swapped',
      type2: 'swapped',
      height: 'lower',
      weight: 'higher',
      total: 'higher',
    })
    expect(
      Object.values(compareFacts(garchomp, garchomp)).every(
        (c) => c === 'equal' || c === 'correct',
      ),
    ).toBe(true)
  })

  it('grade de emojis', () => {
    expect(emojiGrid([compareFacts(flygon, garchomp), compareFacts(garchomp, garchomp)])).toBe(
      '🔼🟨🟨🔽🔼🔼\n🟩🟩🟩🟩🟩🟩',
    )
  })
})

describe('estatísticas', () => {
  it('sequência só continua em dias seguidos; derrota zera', () => {
    let stats = recordResult(EMPTY_STATS, '2026-10-24', true, 3)
    stats = recordResult(stats, '2026-10-25', true, 5)
    expect(stats).toMatchObject({ played: 2, won: 2, streak: 2, best: 2 })
    expect(stats.distribution[2]).toBe(1)
    stats = recordResult(stats, '2026-10-27', true, 1)
    expect(stats.streak).toBe(1)
    stats = recordResult(stats, '2026-10-28', false, 8)
    expect(stats).toMatchObject({ played: 4, won: 3, streak: 0, best: 2 })
  })
})
