import { describe, expect, it } from 'vitest'
import { speedValues, stageMultiplier } from '@/utils/speed'

describe('speed tiers', () => {
  it('Garchomp (base 102) no nível 50 e 100', () => {
    expect(speedValues(102, 50)).toEqual({ min: 96, neutral: 122, max: 154, maxPlus: 169 })
    expect(speedValues(102, 100).maxPlus).toBe(333)
  })

  it('Scarf, Tailwind e estágios', () => {
    expect(speedValues(102, 50, { scarf: true, tailwind: false, stage: 0 }).maxPlus).toBe(253)
    expect(speedValues(102, 50, { scarf: false, tailwind: true, stage: 0 }).maxPlus).toBe(338)
    expect(stageMultiplier(1)).toBe(1.5)
    expect(stageMultiplier(-1)).toBeCloseTo(2 / 3)
    expect(stageMultiplier(6)).toBe(4)
  })
})
