import { GAMES, type Game } from '@/data/games'
import type { PokemonGameSprite, PokemonHeldItem } from '@/types/pokemon'
import { findGameByVersion } from './games'
import { formatPokemonName } from './pokemon'

/** Chaves de `sprites.versions` que não são um jogo da lista nem uma versão dele. */
const SPRITE_TITLES: Readonly<Record<string, string>> = {
  'red-green-japan': 'Red / Green (JP)',
  champions: 'Pokémon Champions',
  showdown: 'Showdown',
}

/** Jogo da lista a que uma chave de sprite pertence ("gold" -> Gold / Silver). */
export function spriteGame(key: string): Game | null {
  return GAMES.find((game) => game.slug === key) ?? findGameByVersion(key)?.game ?? null
}

/** "gold" -> "Gold"; "sword-shield" -> "Sword / Shield"; "showdown" -> "Showdown". */
export function spriteTitle(key: string): string {
  const special = SPRITE_TITLES[key]
  if (special) return special
  const game = GAMES.find((g) => g.slug === key)
  if (game) return game.title
  return findGameByVersion(key)?.version.title ?? formatPokemonName(key)
}

/** Sprites com os do jogo selecionado primeiro (o resto mantém a ordem por geração). */
export function spritesForGame(
  sprites: readonly PokemonGameSprite[],
  game: Game | null,
): PokemonGameSprite[] {
  if (!game) return [...sprites]
  const isCurrent = (sprite: PokemonGameSprite) => spriteGame(sprite.key)?.slug === game.slug
  return [...sprites.filter(isCurrent), ...sprites.filter((s) => !isCurrent(s))]
}

export interface HeldRarity {
  /** Jogo ou versão quando a chance muda entre eles; null quando vale para todos os mostrados. */
  label: string | null
  rarity: number
}

export interface HeldItemSummary {
  item: string
  rarities: HeldRarity[]
  /** Jogos a mais, além dos mostrados (sem jogo selecionado, mostra só os 3 mais recentes). */
  more: number
}

/** Até quantos jogos aparecem por item quando nenhum jogo está selecionado. */
const MAX_GAMES = 3

/** Versões com a mesma chance viram uma só ("50%"); senão, uma por versão ("Sword 5%"). */
function byVersion(game: Game, rarity: Record<string, number>): HeldRarity[] {
  const entries = game.versions.flatMap((version) => {
    const value = [version.slug, ...(version.aliases ?? [])]
      .map((slug) => rarity[slug])
      .find((v) => v !== undefined)
    return value === undefined ? [] : [{ label: version.title, rarity: value }]
  })
  if (entries.length && entries.every((e) => e.rarity === entries[0]!.rarity)) {
    return [{ label: null, rarity: entries[0]!.rarity }]
  }
  return entries
}

/**
 * Itens segurados em linguagem de tela. Com jogo: só as versões dele (o item some se não
 * aparece nele). Sem jogo: um resumo por jogo, do mais recente para o mais antigo.
 */
export function heldItemsForGame(
  items: readonly PokemonHeldItem[],
  game: Game | null,
): HeldItemSummary[] {
  return items.flatMap((held) => {
    if (game) {
      const rarities = byVersion(game, held.rarity)
      return rarities.length ? [{ item: held.item, rarities, more: 0 }] : []
    }
    const games = GAMES.filter((g) =>
      g.versions.some((v) => [v.slug, ...(v.aliases ?? [])].some((s) => s in held.rarity)),
    ).reverse()
    const rarities = games.slice(0, MAX_GAMES).flatMap((g) => {
      const list = byVersion(g, held.rarity)
      return list.length === 1 && list[0]!.label === null
        ? [{ label: g.title, rarity: list[0]!.rarity }]
        : list
    })
    return rarities.length
      ? [{ item: held.item, rarities, more: Math.max(0, games.length - MAX_GAMES) }]
      : []
  })
}
