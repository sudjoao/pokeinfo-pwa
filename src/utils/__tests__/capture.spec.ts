import { describe, expect, it } from 'vitest'
import {
  BALLS,
  ballsInGeneration,
  captureProbability,
  captureWithin,
  throwsFor,
  type CaptureSituation,
} from '@/utils/capture'

const ball = (slug: string) => BALLS.find((b) => b.slug === slug)!
const situation: CaptureSituation = {
  generation: 9,
  types: ['water'],
  level: 20,
  turns: 0,
  dark: false,
  water: false,
  caught: false,
}

describe('captura', () => {
  it('Gen 4, taxa 255, HP cheio, Poké Ball: a = 85, b = 49931, ~33,7%', () => {
    const p = captureProbability({
      captureRate: 255,
      hp: 1,
      ball: 1,
      status: 'none',
      generation: 4,
    })
    expect(p).toBeCloseTo((49931 / 65536) ** 4, 6)
  })

  it('Gen 5 faz 3 checagens e Gen 6+ faz 4 (mesmo b)', () => {
    const input = { captureRate: 45, hp: 0.5, ball: 1, status: 'none' as const }
    const gen5 = captureProbability({ ...input, generation: 5 })
    const gen6 = captureProbability({ ...input, generation: 6 })
    expect(gen5 ** (1 / 3)).toBeCloseTo(gen6 ** (1 / 4), 3)
    expect(gen6).toBeLessThan(gen5)
  })

  it('Master Ball e a ≥ 255 garantem; menos HP e status ajudam', () => {
    expect(
      captureProbability({
        captureRate: 3,
        hp: 1,
        ball: ball('master-ball').multiplier(situation),
        status: 'none',
        generation: 9,
      }),
    ).toBe(1)
    expect(
      captureProbability({ captureRate: 255, hp: 0.01, ball: 2, status: 'none', generation: 9 }),
    ).toBe(1)
    const full = captureProbability({
      captureRate: 45,
      hp: 1,
      ball: 1,
      status: 'none',
      generation: 9,
    })
    const low = captureProbability({
      captureRate: 45,
      hp: 0.1,
      ball: 1,
      status: 'none',
      generation: 9,
    })
    const asleep = captureProbability({
      captureRate: 45,
      hp: 0.1,
      ball: 1,
      status: 'sleep',
      generation: 9,
    })
    expect(full).toBeLessThan(low)
    expect(low).toBeLessThan(asleep)
  })

  it('bolas com condição', () => {
    expect(ball('net-ball').multiplier(situation)).toBe(3.5)
    expect(ball('net-ball').multiplier({ ...situation, generation: 4 })).toBe(3)
    expect(ball('quick-ball').multiplier(situation)).toBe(5)
    expect(ball('quick-ball').multiplier({ ...situation, turns: 1 })).toBe(1)
    expect(ball('timer-ball').multiplier({ ...situation, turns: 10 })).toBe(4)
    expect(ball('repeat-ball').multiplier({ ...situation, caught: true })).toBe(3.5)
    expect(ball('nest-ball').multiplier({ ...situation, level: 1 })).toBe(4)
    expect(ball('dusk-ball').multiplier({ ...situation, dark: true })).toBe(3)
    expect(ballsInGeneration(3).some((b) => b.slug === 'quick-ball')).toBe(false)
  })

  it('várias tentativas', () => {
    expect(captureWithin(0.5, 2)).toBeCloseTo(0.75)
    expect(throwsFor(0.5)).toBe(4)
    expect(throwsFor(1)).toBe(1)
    expect(throwsFor(0)).toBe(Number.POSITIVE_INFINITY)
  })
})
