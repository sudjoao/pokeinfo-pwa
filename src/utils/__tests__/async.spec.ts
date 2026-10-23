import { describe, expect, it } from 'vitest'
import { mapLimit } from '@/utils/async'

describe('mapLimit', () => {
  it('mantém a ordem e nunca passa do limite de chamadas simultâneas', async () => {
    let running = 0
    let peak = 0
    const result = await mapLimit([5, 1, 4, 2, 3, 0], 2, async (n) => {
      running++
      peak = Math.max(peak, running)
      await new Promise((resolve) => setTimeout(resolve, n))
      running--
      return n * 10
    })
    expect(result).toEqual([50, 10, 40, 20, 30, 0])
    expect(peak).toBe(2)
  })

  it('rejeita no primeiro erro e aceita lista vazia', async () => {
    await expect(mapLimit([1, 2], 4, async () => Promise.reject(new Error('x')))).rejects.toThrow(
      'x',
    )
    await expect(mapLimit([], 4, async () => 1)).resolves.toEqual([])
  })
})
