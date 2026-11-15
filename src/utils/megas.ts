import { MEGA_DEBUTS } from '@/data/generated/megas'
import type { PokemonVariety } from '@/types/pokemon'
import { speciesIdOf } from '@/utils/forms'
import { formatPokemonName } from '@/utils/pokemon'

const GEN_6 = ['x-y', 'omega-ruby-alpha-sapphire']
const LETS_GO = 'lets-go-pikachu-lets-go-eevee'
/** Let's Go só tem as espécies de Kanto (e Meltan/Melmetal, que não têm mega). */
const LAST_KANTO_SPECIES = 151

/**
 * Jogos com Mega Evolução -> grupos de versões cujas megas existem neles. De Omega Ruby/Alpha
 * Sapphire a Ultra Sun/Ultra Moon valem todas as da 6ª geração; Legends: Z-A (com a DLC Mega
 * Dimension, que o app trata como o mesmo jogo) tem as antigas e as novas.
 */
const GAME_DEBUTS: Readonly<Record<string, readonly string[]>> = {
  'x-y': ['x-y'],
  'omega-ruby-alpha-sapphire': GEN_6,
  'sun-moon': GEN_6,
  'ultra-sun-ultra-moon': GEN_6,
  [LETS_GO]: GEN_6,
  'legends-za': [...GEN_6, 'legends-za', 'mega-dimension'],
}

/** Mega (id do Pokémon) -> grupo de versões em que estreou. */
const DEBUT_OF = new Map<number, string>(
  Object.entries(MEGA_DEBUTS).flatMap(([debut, ids]) => ids.map((id) => [id, debut] as const)),
)

/**
 * Megas que não partem da forma que o nome sugere: a Mega Floette vem da Floette da Flor Eterna e
 * a Mega Zygarde, da forma Completa.
 */
const BASE_EXCEPTIONS: Readonly<Record<string, string>> = {
  'floette-mega': 'floette-eternal',
  'zygarde-mega': 'zygarde-complete',
}

/** "-mega" e, se houver, a variante: "charizard-mega-x", "absol-mega-z", "meowstic-male-mega". */
const MEGA_SUFFIX = /-mega(?:-([a-z]))?$/

/** O jogo (slug do grupo de versões) tem Mega Evolução? */
export function hasMegaEvolution(gameSlug: string): boolean {
  return gameSlug in GAME_DEBUTS
}

export function isMega(pokemonId: number): boolean {
  return DEBUT_OF.has(pokemonId)
}

/** A mega existe no jogo? Sem jogo (Pokédex Nacional) valem todas. */
export function megaExistsIn(pokemonId: number, gameSlug: string | null): boolean {
  const debut = DEBUT_OF.get(pokemonId)
  if (!debut) return false
  if (!gameSlug) return true
  if (gameSlug === LETS_GO && speciesIdOf(pokemonId) > LAST_KANTO_SPECIES) return false
  return GAME_DEBUTS[gameSlug]?.includes(debut) ?? false
}

/** "charizard-mega-x" -> "Mega Charizard X" */
export function megaLabel(name: string): string {
  const variant = MEGA_SUFFIX.exec(name)?.[1]
  const base = formatPokemonName(name.replace(MEGA_SUFFIX, ''))
  return variant ? `Mega ${base} ${variant.toUpperCase()}` : `Mega ${base}`
}

/** Formas da espécie sem as megas (que têm seção própria na tela de detalhe). */
export function withoutMegas(varieties: readonly PokemonVariety[]): PokemonVariety[] {
  return varieties.filter((variety) => !isMega(variety.pokemonId))
}

/** Forma de origem e as megas dela, na ordem da PokéAPI. */
export interface MegaLine {
  base: PokemonVariety
  megas: PokemonVariety[]
}

/**
 * Megas a mostrar no detalhe do Pokémon `currentId`: as da forma atual (ou, se ele já é uma mega,
 * as da forma de onde ela vem) que existem no jogo. A mega que está aberta entra sempre, para a
 * tela não perder o caminho de volta. Null quando não há nenhuma.
 */
export function megaLineOf(
  varieties: readonly PokemonVariety[],
  currentId: number,
  gameSlug: string | null,
): MegaLine | null {
  const current = varieties.find((variety) => variety.pokemonId === currentId)
  if (!current) return null

  const fallback = varieties.find((variety) => variety.isDefault)
  const baseOf = (mega: PokemonVariety): PokemonVariety | undefined => {
    const name = BASE_EXCEPTIONS[mega.name] ?? mega.name.replace(MEGA_SUFFIX, '')
    return varieties.find((variety) => variety.name === name) ?? fallback
  }

  const base = isMega(currentId) ? baseOf(current) : current
  if (!base) return null

  const megas = varieties.filter(
    (variety) =>
      isMega(variety.pokemonId) &&
      baseOf(variety)?.pokemonId === base.pokemonId &&
      (variety.pokemonId === currentId || megaExistsIn(variety.pokemonId, gameSlug)),
  )
  return megas.length ? { base, megas } : null
}
