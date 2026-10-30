import type { LocationQuery } from 'vue-router'
import type { Game, GameDex } from '@/data/games'
import { findGame } from '@/utils/games'
import { readStorage, removeStorage, writeStorage } from '@/utils/storage'

/** Último jogo (e Pokédex) escolhido na lista: volta selecionado na próxima visita. */
const STORAGE_KEY = 'pokeinfo:game:v1'

export interface SavedGame {
  game: string
  dex?: string
}

/** Jogo salvo, se ainda existir na lista de jogos (um slug antigo é ignorado). */
export function savedGame(): SavedGame | null {
  const saved = readStorage<SavedGame>(STORAGE_KEY)
  if (!saved || typeof saved.game !== 'string') return null
  const game = findGame(saved.game)
  if (!game) return null
  const dex = game.dexes.some((item) => item.slug === saved.dex) ? saved.dex : undefined
  return dex ? { game: game.slug, dex } : { game: game.slug }
}

/** Grava a escolha atual; "Todos os jogos" (null) apaga, e a Pokédex nacional volta a ser o início. */
export function saveGame(game: Game | null, dex: GameDex | null): void {
  if (!game) {
    removeStorage(STORAGE_KEY)
    return
  }
  const value: SavedGame = { game: game.slug }
  if (game.dexes.length > 1 && dex) value.dex = dex.slug
  writeStorage(STORAGE_KEY, value)
}

/**
 * Parâmetros que, em cada tela, não dizem nada sobre o jogo: só com eles na URL (ou sem nenhum) a
 * tela é aberta "do zero" e recebe o jogo salvo. Com qualquer outro (busca, tipo, um link
 * compartilhado com filtros), a URL é respeitada como veio.
 */
const NEUTRAL_KEYS: Partial<Record<string, readonly string[]>> = {
  home: ['fav', 'layout'],
  // Um link de time sem jogo é um time da Pokédex nacional: não pode cair no time do jogo salvo.
  team: [],
  moves: ['mode'],
  move: [],
  item: [],
  speed: ['level', 'team'],
}

/**
 * Query com o jogo salvo, para quem entra numa tela que filtra por jogo sem dizer qual; null quando
 * não há o que mudar (a URL já tem jogo, tem outros filtros, ou nada foi salvo).
 */
export function queryWithSavedGame(
  routeName: string,
  query: LocationQuery,
  saved: SavedGame | null = savedGame(),
): LocationQuery | null {
  const neutral = NEUTRAL_KEYS[routeName]
  if (!saved || !neutral) return null
  if (Object.keys(query).some((key) => !neutral.includes(key))) return null
  // As ferramentas só usam o jogo; a Pokédex escolhida vale para a lista e o time.
  const withDex = saved.dex && (routeName === 'home' || routeName === 'team')
  return { ...query, game: saved.game, ...(withDex ? { dex: saved.dex } : {}) }
}
