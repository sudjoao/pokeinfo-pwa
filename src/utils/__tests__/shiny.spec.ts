import { describe, expect, it } from 'vitest'
import { chanceByNow, hasShinies, shinyOdds } from '@/utils/shiny'

describe('shinyOdds', () => {
  it('chances base por geração', () => {
    expect(shinyOdds(9, false, false).oneIn).toBe(4096)
    expect(shinyOdds(4, false, false).oneIn).toBe(8192)
    expect(hasShinies(1)).toBe(false)
  })

  it('Shiny Charm e Masuda (aproximações conhecidas)', () => {
    expect(shinyOdds(9, true, false).oneIn).toBe(1366)
    expect(shinyOdds(9, false, true).oneIn).toBe(683)
    expect(shinyOdds(9, true, true).oneIn).toBe(512)
    expect(shinyOdds(4, false, true).oneIn).toBe(1639)
  })

  it('bônus que não existem na geração são ignorados', () => {
    expect(shinyOdds(3, true, true).rolls).toBe(1)
  })

  it('probabilidade acumulada', () => {
    const odds = shinyOdds(9, false, false)
    expect(chanceByNow(odds, 0)).toBe(0)
    expect(chanceByNow(odds, 4096)).toBeCloseTo(0.632, 2)
  })
})
