import { GAMES, type FormRegion, type Game, type GameDex } from '@/data/games'
import type { PokemonIndexEntry } from '@/types/pokemon'

export function findGame(slug: string | null | undefined): Game | null {
  if (!slug) return null
  return GAMES.find((game) => game.slug === slug) ?? null
}

/** Pokédex do jogo com o slug informado; cai na primeira quando o slug é inválido. */
export function resolveDex(game: Game, slug: string | null | undefined): GameDex {
  return game.dexes.find((dex) => dex.slug === slug) ?? game.dexes[0]!
}

export interface GameGroup {
  generation: number
  games: Game[]
}

/** Jogos agrupados por geração, na ordem da lista. */
export function groupGamesByGeneration(games: readonly Game[]): GameGroup[] {
  const groups: GameGroup[] = []
  for (const game of games) {
    const group = groups.find((g) => g.generation === game.generation)
    if (group) group.games.push(game)
    else groups.push({ generation: game.generation, games: [game] })
  }
  return groups
}

const FORM_REGIONS: readonly FormRegion[] = ['alola', 'galar', 'hisui', 'paldea']
const FORM_PATTERN = /^(.+?)-(alola|galar|hisui|paldea)(?:-(.+))?$/

/** Sufixos que não são formas regionais de verdade (bonés do Pikachu, totens de Alola). */
const IGNORED_SUFFIXES = ['cap', 'totem']

export type RegionalFormIndex = Record<FormRegion, Map<string, PokemonIndexEntry>>

/**
 * Monta, a partir do índice já em cache, um mapa "nome da espécie -> forma regional"
 * por região (ex.: alola -> raichu -> raichu-alola). A primeira forma encontrada vence,
 * o que resolve os casos com várias variantes (Tauros de Paldea, Darmanitan de Galar).
 */
export function buildRegionalFormIndex(index: readonly PokemonIndexEntry[]): RegionalFormIndex {
  const result = Object.fromEntries(
    FORM_REGIONS.map((region) => [region, new Map<string, PokemonIndexEntry>()]),
  ) as RegionalFormIndex

  for (const entry of index) {
    const match = FORM_PATTERN.exec(entry.name)
    if (!match) continue
    const [, species, region, suffix] = match
    if (suffix && IGNORED_SUFFIXES.some((ignored) => suffix.includes(ignored))) continue
    const forms = result[region as FormRegion]
    if (!forms.has(species!)) forms.set(species!, entry)
  }

  return result
}
