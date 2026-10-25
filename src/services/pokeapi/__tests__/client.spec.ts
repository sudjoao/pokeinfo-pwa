import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, fetchJson } from '@/services/pokeapi/client'

describe('fetchJson', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('pede os caminhos da PokéAPI', async () => {
    const fetch = vi.fn(async () => new Response('{"ok":true}'))
    vi.stubGlobal('fetch', fetch)
    await fetchJson('/pokemon/25')
    await fetchJson('/pokemon?limit=100000&offset=0')
    await fetchJson('/machine/12/')
    await fetchJson('/item/kings-rock')
    expect(fetch).toHaveBeenCalledTimes(4)
  })

  it('recusa caminho montado com parâmetro adulterado, sem ir à rede', async () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    for (const path of [
      '/item/../../pokemon',
      '/item/a/../b',
      '/move/x?fields=1',
      '/move/%2e%2e',
      '/move/x#y',
      '/move/ x',
      '//evil.com/x',
      'evil',
    ]) {
      await expect(fetchJson(path)).rejects.toEqual(new ApiError('http', 404))
    }
    expect(fetch).not.toHaveBeenCalled()
  })
})
