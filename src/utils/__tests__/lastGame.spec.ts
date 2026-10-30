import { beforeEach, describe, expect, it } from 'vitest'
import { findGame } from '@/utils/games'
import { queryWithSavedGame, saveGame, savedGame } from '@/utils/lastGame'

const disk = new Map<string, string>()
Object.assign(globalThis, {
  localStorage: {
    getItem: (key: string) => disk.get(key) ?? null,
    setItem: (key: string, value: string) => disk.set(key, value),
    removeItem: (key: string) => disk.delete(key),
  },
})

const sv = findGame('scarlet-violet')!

describe('último jogo escolhido', () => {
  beforeEach(() => disk.clear())

  it('grava jogo e Pokédex, e "Todos os jogos" apaga', () => {
    saveGame(sv, sv.dexes[1]!)
    expect(savedGame()).toEqual({ game: 'scarlet-violet', dex: sv.dexes[1]!.slug })
    saveGame(null, null)
    expect(savedGame()).toBeNull()
  })

  it('ignora jogo e Pokédex que não existem mais', () => {
    localStorage.setItem('pokeinfo:game:v1', JSON.stringify({ game: 'pokemon-z' }))
    expect(savedGame()).toBeNull()
    localStorage.setItem('pokeinfo:game:v1', JSON.stringify({ game: 'scarlet-violet', dex: 'x' }))
    expect(savedGame()).toEqual({ game: 'scarlet-violet' })
  })

  it('só preenche a URL de quem entra sem jogo nem filtros', () => {
    const saved = { game: 'scarlet-violet', dex: 'kitakami' }
    expect(queryWithSavedGame('home', {}, saved)).toEqual(saved)
    expect(queryWithSavedGame('home', { fav: '1' }, saved)).toEqual({ fav: '1', ...saved })
    expect(queryWithSavedGame('team', {}, saved)).toEqual(saved)
    // As ferramentas recebem só o jogo.
    expect(queryWithSavedGame('moves', {}, saved)).toEqual({ game: 'scarlet-violet' })
    // Link com filtro, jogo já na URL, tela sem jogo ou nada salvo: a URL fica como veio.
    expect(queryWithSavedGame('home', { type: 'fire' }, saved)).toBeNull()
    expect(queryWithSavedGame('home', { game: 'x-y' }, saved)).toBeNull()
    // Link de time sem jogo: é da Pokédex nacional, não do jogo salvo.
    expect(queryWithSavedGame('team', { team: '1,4' }, saved)).toBeNull()
    expect(queryWithSavedGame('pokemon', {}, saved)).toBeNull()
    expect(queryWithSavedGame('home', {}, null)).toBeNull()
  })
})
