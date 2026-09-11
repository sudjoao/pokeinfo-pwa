import { GAMES, type FormRegion, type Game, type GameDex, type GameVersion } from '@/data/games'
import type { PokedexEntry, PokemonIndexEntry } from '@/types/pokemon'

export function findGame(slug: string | null | undefined): Game | null {
  if (!slug) return null
  return GAMES.find((game) => game.slug === slug) ?? null
}

/** Pokédex do jogo com o slug informado; cai na primeira quando o slug é inválido. */
export function resolveDex(game: Game, slug: string | null | undefined): GameDex {
  return game.dexes.find((dex) => dex.slug === slug) ?? game.dexes[0]!
}

export interface GameContext {
  game: Game
  dex: GameDex
}

/** Jogo + Pokédex a partir da query da rota (`?game=...&dex=...`); null quando não há jogo válido. */
export function gameContextFromQuery(query: Record<string, unknown>): GameContext | null {
  const game = findGame(typeof query.game === 'string' ? query.game : null)
  if (!game) return null
  return { game, dex: resolveDex(game, typeof query.dex === 'string' ? query.dex : null) }
}

/** Query da rota que preserva o jogo selecionado (o `dex` só quando o jogo tem mais de uma). */
export function gameContextQuery(context: GameContext | null): Record<string, string> {
  if (!context) return {}
  const query: Record<string, string> = { game: context.game.slug }
  if (context.game.dexes.length > 1) query.dex = context.dex.slug
  return query
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

/** Entrada da Pokédex de um jogo já resolvida para a forma que aparece nele. */
export interface DexListEntry extends PokemonIndexEntry {
  dexNumber: number
  speciesId: number
}

/** Troca cada espécie da Pokédex pela forma regional, quando a região tiver uma. */
export function buildDexList(
  entries: readonly PokedexEntry[],
  dex: GameDex,
  forms: RegionalFormIndex,
): DexListEntry[] {
  const regional = dex.formRegion ? forms[dex.formRegion] : null
  return entries.map((entry) => {
    const form = regional?.get(entry.speciesName)
    return {
      id: form?.id ?? entry.speciesId,
      name: form?.name ?? entry.speciesName,
      dexNumber: entry.entryNumber,
      speciesId: entry.speciesId,
    }
  })
}

/** Jogo e versão a que uma versão da PokéAPI pertence (DLCs resolvem para a versão base). */
export interface VersionOwner {
  game: Game
  version: GameVersion
}

let versionLookup: Map<string, VersionOwner> | null = null

/** "the-isle-of-armor-sword" -> { game: Sword / Shield, version: Sword }; null para jogos fora da lista. */
export function findGameByVersion(versionSlug: string): VersionOwner | null {
  if (!versionLookup) {
    versionLookup = new Map()
    for (const game of GAMES) {
      for (const version of game.versions) {
        versionLookup.set(version.slug, { game, version })
        for (const alias of version.aliases ?? []) versionLookup.set(alias, { game, version })
      }
    }
  }
  return versionLookup.get(versionSlug) ?? null
}
