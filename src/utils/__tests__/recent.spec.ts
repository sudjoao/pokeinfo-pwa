import { describe, expect, it } from 'vitest'
import { pushRecent } from '@/stores/recent'

describe('recentes', () => {
  it('coloca no começo, sem repetir e com limite', () => {
    expect(pushRecent([1, 2, 3], 2, 5)).toEqual([2, 1, 3])
    expect(pushRecent([1, 2, 3], 4, 3)).toEqual([4, 1, 2])
  })
})
