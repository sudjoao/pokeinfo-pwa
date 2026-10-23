import { describe, expect, it } from 'vitest'
import { chainUrl, estimatePackMb, packUrls } from '@/utils/offline'
import { artworkSrc, cryUrl, HERO_ARTWORK_SIZE } from '@/utils/pokemon'

describe('pacotes offline', () => {
  it('usa exatamente as URLs que as telas pedem', () => {
    expect(packUrls('data', 25)).toEqual([
      'https://pokeapi.co/api/v2/pokemon/25',
      'https://pokeapi.co/api/v2/pokemon-species/25',
    ])
    expect(packUrls('images', 25)).toEqual([artworkSrc(25, 120), artworkSrc(25, HERO_ARTWORK_SIZE)])
    expect(packUrls('cries', 25)).toEqual([cryUrl(25)])
  })

  it('cadeia de evolução a partir da espécie', () => {
    expect(
      chainUrl({ evolution_chain: { url: 'https://pokeapi.co/api/v2/evolution-chain/10/' } }),
    ).toBe('https://pokeapi.co/api/v2/evolution-chain/10')
    expect(chainUrl({})).toBeNull()
  })

  it('estimativa por geração', () => {
    const kanto = new Map([[1, Array.from({ length: 151 }, (_, i) => i + 1)]])
    expect(Math.round(estimatePackMb('data', kanto))).toBe(49)
    expect(Math.round(estimatePackMb('cries', kanto))).toBe(1)
  })
})
