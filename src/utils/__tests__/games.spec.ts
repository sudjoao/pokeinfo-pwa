import { describe, expect, it } from 'vitest'
import { findGame, findGameByVersion, gameContextFromQuery, gameContextQuery } from '@/utils/games'
import { exclusiveVersionOf } from '@/utils/exclusives'
import { formatAreaName } from '@/utils/encounters'

describe('jogos', () => {
  it('resolve versões de DLC para o jogo base', () => {
    const owner = findGameByVersion('the-isle-of-armor-sword')
    expect(owner?.game.slug).toBe('sword-shield')
    expect(owner?.version.slug).toBe('sword')
    expect(findGameByVersion('colosseum')).toBeNull()
  })

  it('contexto de jogo vai e volta pela URL', () => {
    const context = gameContextFromQuery({ game: 'sword-shield', dex: 'crown-tundra' })
    expect(context?.dex.slug).toBe('crown-tundra')
    expect(gameContextQuery(context)).toEqual({ game: 'sword-shield', dex: 'crown-tundra' })
    expect(gameContextFromQuery({ game: 'inexistente' })).toBeNull()
  })

  it('jogo desconhecido não existe', () => {
    expect(findGame('scarlet-violet')?.title).toBeTruthy()
    expect(findGame(null)).toBeNull()
  })
})

describe('exclusivos', () => {
  it('Deino só em Sword, Larvitar só em Shield', () => {
    expect(exclusiveVersionOf('sword-shield', 633)?.slug).toBe('sword')
    expect(exclusiveVersionOf('sword-shield', 246)?.slug).toBe('shield')
    expect(exclusiveVersionOf('sword-shield', 25)).toBeNull()
  })
})

describe('formatAreaName', () => {
  it('tira o sufixo e formata andares e palavras pequenas', () => {
    expect(formatAreaName('kanto-route-1-area')).toBe('Kanto Route 1')
    expect(formatAreaName('cerulean-cave-b1f')).toBe('Cerulean Cave B1F')
    expect(formatAreaName('path-to-the-peak')).toBe('Path to the Peak')
  })
})
