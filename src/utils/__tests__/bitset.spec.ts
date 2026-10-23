import { describe, expect, it } from 'vitest'
import { decodeBitset, encodeBitset } from '@/utils/bitset'

describe('bitset', () => {
  it('ida e volta preserva o conjunto', () => {
    const ids = new Set([1, 7, 8, 25, 151, 1025])
    expect(decodeBitset(encodeBitset(ids))).toEqual(ids)
  })

  it('conjunto vazio vira texto vazio', () => {
    expect(encodeBitset(new Set())).toBe('')
    expect(decodeBitset('')).toEqual(new Set())
  })

  it('a Pokédex inteira cabe em ~172 caracteres', () => {
    const all = new Set(Array.from({ length: 1025 }, (_, i) => i + 1))
    expect(encodeBitset(all).length).toBeLessThanOrEqual(172)
  })

  it('texto inválido não quebra', () => {
    expect(decodeBitset('%%%')).toEqual(new Set())
  })
})
