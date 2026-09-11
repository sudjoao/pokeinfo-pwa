import { GAMES, type Game } from '@/data/games'
import type { EncounterLocation, PokemonEncounters } from '@/types/pokemon'
import { formatPokemonName } from './pokemon'

/** Sufixo genérico da PokéAPI para a área principal de um local ("kanto-route-1-area"). */
const AREA_SUFFIX = /-area$/

/** Pedaços que viram siglas: andares ("1f", "b2f"). */
const FLOOR = /^b?\d+f$/

/** Palavras que ficam minúsculas no meio do nome ("Fields of Honor", "Path to the Peak"). */
const SMALL_WORDS = new Set(['of', 'the', 'to', 'and', 'in', 'on', 'at'])

/**
 * "kanto-route-1-area" -> "Kanto Route 1"; "cerulean-cave-b1f" -> "Cerulean Cave B1F".
 * A PokéAPI só devolve o slug da área nos encontros; o nome bonito custaria uma requisição por área.
 */
export function formatAreaName(slug: string): string {
  return slug
    .replace(AREA_SUFFIX, '')
    .split('-')
    .map((part, index) => {
      if (FLOOR.test(part)) return part.toUpperCase()
      if (index > 0 && SMALL_WORDS.has(part)) return part
      return formatPokemonName(part)
    })
    .join(' ')
}

/** Tradutor de mensagens (assinatura mínima do `t` do vue-i18n, para não acoplar ao plugin). */
export interface Translate {
  (key: string, values?: Record<string, unknown>): string
}

/** Método de encontro no idioma atual; slugs sem tradução caem no nome em inglês formatado. */
export function formatEncounterMethod(
  slug: string,
  t: Translate,
  te: (key: string) => boolean,
): string {
  const key = `encounterMethod.${slug}`
  return te(key) ? t(key) : formatPokemonName(slug)
}

/** "Nv. 2–5" ou "Nv. 18" quando a faixa é um nível só. */
export function formatLevelRange(location: EncounterLocation, t: Translate): string {
  return location.minLevel === location.maxLevel
    ? t('detail.level', { n: location.minLevel })
    : t('detail.levelRange', { min: location.minLevel, max: location.maxLevel })
}

export interface GameEncounters {
  game: Game
  locations: EncounterLocation[]
}

/** Locais agrupados por jogo, na ordem da lista `GAMES` (só jogos com pelo menos um local). */
export function groupEncountersByGame(encounters: PokemonEncounters): GameEncounters[] {
  return GAMES.flatMap((game) => {
    const locations = encounters[game.slug]
    return locations?.length ? [{ game, locations }] : []
  })
}

/** Jogos para os quais a PokéAPI ainda não tem dados de encontro (aviso na tela). */
export function gamesWithoutEncounterData(): Game[] {
  return GAMES.filter((game) => !game.hasEncounterData)
}

/** Título da versão dentro do jogo ("sword" -> "Sword"); cai no slug formatado se não achar. */
export function versionTitle(game: Game, versionSlug: string): string {
  return game.versions.find((v) => v.slug === versionSlug)?.title ?? formatPokemonName(versionSlug)
}
