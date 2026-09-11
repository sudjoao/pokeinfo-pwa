/**
 * Jogos da série principal e as Pokédex regionais de cada um.
 *
 * Lista estática de propósito: montar isso pela PokéAPI custaria ~33 requisições
 * só para abrir o seletor. Os slugs são os mesmos da API (`version-group` e `pokedex`).
 * Ficam de fora: versões japonesas (repetem Kanto), Colosseum/XD (sem Pokédex),
 * DLCs (só repetem Pokédex que o jogo base já lista) e jogos fora da série principal.
 */

/** Regiões que têm formas regionais no índice da PokéAPI (sufixo `-alola`, `-galar`…). */
export type FormRegion = 'alola' | 'galar' | 'hisui' | 'paldea'

export interface GameDex {
  /** Slug do endpoint `/pokedex/{slug}`. */
  slug: string
  label: string
  /** Região usada para trocar a espécie pela forma regional no card. */
  formRegion: FormRegion | null
}

/** Uma versão do jogo (endpoint `/version`), como aparece nos encontros da PokéAPI. */
export interface GameVersion {
  /** Slug em `/version` (ex.: "sword"). */
  slug: string
  title: string
  /** Versões das DLCs que contam como esta (ex.: "the-isle-of-armor-sword"). */
  aliases?: readonly string[]
}

export interface Game {
  /** Slug do `version-group` da PokéAPI. */
  slug: string
  title: string
  generation: number
  dexes: GameDex[]
  /** Versões do jogo; os encontros (`/pokemon/{id}/encounters`) são listados por versão. */
  versions: readonly GameVersion[]
  /**
   * false quando a PokéAPI ainda não tem dados de encontro para o jogo (Brilliant Diamond /
   * Shining Pearl, Legends: Arceus, Scarlet / Violet e Legends: Z-A em 2026-09).
   */
  hasEncounterData: boolean
}

/** Par de versões de um jogo; as DLCs de Galar e Paldea entram na versão base. */
function pair(
  a: [string, string],
  b: [string, string],
  dlcs: readonly string[] = [],
): GameVersion[] {
  return [a, b].map(([slug, title]) => ({
    slug,
    title,
    ...(dlcs.length ? { aliases: dlcs.map((dlc) => `${dlc}-${slug}`) } : {}),
  }))
}

function single(slug: string, title: string): GameVersion[] {
  return [{ slug, title }]
}

const KANTO: GameDex = { slug: 'kanto', label: 'Kanto', formRegion: null }
const ORIGINAL_JOHTO: GameDex = { slug: 'original-johto', label: 'Johto', formRegion: null }
const HOENN: GameDex = { slug: 'hoenn', label: 'Hoenn', formRegion: null }
const ORIGINAL_SINNOH: GameDex = { slug: 'original-sinnoh', label: 'Sinnoh', formRegion: null }

const ALOLA_ORIGINAL: GameDex[] = [
  { slug: 'original-alola', label: 'Alola', formRegion: 'alola' },
  { slug: 'original-melemele', label: 'Melemele', formRegion: 'alola' },
  { slug: 'original-akala', label: 'Akala', formRegion: 'alola' },
  { slug: 'original-ulaula', label: "Ula'ula", formRegion: 'alola' },
  { slug: 'original-poni', label: 'Poni', formRegion: 'alola' },
]

const ALOLA_UPDATED: GameDex[] = [
  { slug: 'updated-alola', label: 'Alola', formRegion: 'alola' },
  { slug: 'updated-melemele', label: 'Melemele', formRegion: 'alola' },
  { slug: 'updated-akala', label: 'Akala', formRegion: 'alola' },
  { slug: 'updated-ulaula', label: "Ula'ula", formRegion: 'alola' },
  { slug: 'updated-poni', label: 'Poni', formRegion: 'alola' },
]

export const GAMES: readonly Game[] = [
  {
    slug: 'red-blue',
    title: 'Red / Blue',
    generation: 1,
    dexes: [KANTO],
    versions: pair(['red', 'Red'], ['blue', 'Blue']),
    hasEncounterData: true,
  },
  {
    slug: 'yellow',
    title: 'Yellow',
    generation: 1,
    dexes: [KANTO],
    versions: single('yellow', 'Yellow'),
    hasEncounterData: true,
  },
  {
    slug: 'gold-silver',
    title: 'Gold / Silver',
    generation: 2,
    dexes: [ORIGINAL_JOHTO],
    versions: pair(['gold', 'Gold'], ['silver', 'Silver']),
    hasEncounterData: true,
  },
  {
    slug: 'crystal',
    title: 'Crystal',
    generation: 2,
    dexes: [ORIGINAL_JOHTO],
    versions: single('crystal', 'Crystal'),
    hasEncounterData: true,
  },
  {
    slug: 'ruby-sapphire',
    title: 'Ruby / Sapphire',
    generation: 3,
    dexes: [HOENN],
    versions: pair(['ruby', 'Ruby'], ['sapphire', 'Sapphire']),
    hasEncounterData: true,
  },
  {
    slug: 'emerald',
    title: 'Emerald',
    generation: 3,
    dexes: [HOENN],
    versions: single('emerald', 'Emerald'),
    hasEncounterData: true,
  },
  {
    slug: 'firered-leafgreen',
    title: 'FireRed / LeafGreen',
    generation: 3,
    dexes: [KANTO],
    versions: pair(['firered', 'FireRed'], ['leafgreen', 'LeafGreen']),
    hasEncounterData: true,
  },
  {
    slug: 'diamond-pearl',
    title: 'Diamond / Pearl',
    generation: 4,
    dexes: [ORIGINAL_SINNOH],
    versions: pair(['diamond', 'Diamond'], ['pearl', 'Pearl']),
    hasEncounterData: true,
  },
  {
    slug: 'platinum',
    title: 'Platinum',
    generation: 4,
    dexes: [{ slug: 'extended-sinnoh', label: 'Sinnoh', formRegion: null }],
    versions: single('platinum', 'Platinum'),
    hasEncounterData: true,
  },
  {
    slug: 'heartgold-soulsilver',
    title: 'HeartGold / SoulSilver',
    generation: 4,
    dexes: [{ slug: 'updated-johto', label: 'Johto', formRegion: null }],
    versions: pair(['heartgold', 'HeartGold'], ['soulsilver', 'SoulSilver']),
    hasEncounterData: true,
  },
  {
    slug: 'black-white',
    title: 'Black / White',
    generation: 5,
    dexes: [{ slug: 'original-unova', label: 'Unova', formRegion: null }],
    versions: pair(['black', 'Black'], ['white', 'White']),
    hasEncounterData: true,
  },
  {
    slug: 'black-2-white-2',
    title: 'Black 2 / White 2',
    generation: 5,
    dexes: [{ slug: 'updated-unova', label: 'Unova', formRegion: null }],
    versions: pair(['black-2', 'Black 2'], ['white-2', 'White 2']),
    hasEncounterData: true,
  },
  {
    slug: 'x-y',
    title: 'X / Y',
    generation: 6,
    dexes: [
      { slug: 'kalos-central', label: 'Central Kalos', formRegion: null },
      { slug: 'kalos-coastal', label: 'Coastal Kalos', formRegion: null },
      { slug: 'kalos-mountain', label: 'Mountain Kalos', formRegion: null },
    ],
    versions: pair(['x', 'X'], ['y', 'Y']),
    hasEncounterData: true,
  },
  {
    slug: 'omega-ruby-alpha-sapphire',
    title: 'Omega Ruby / Alpha Sapphire',
    generation: 6,
    dexes: [{ slug: 'updated-hoenn', label: 'Hoenn', formRegion: null }],
    versions: pair(['omega-ruby', 'Omega Ruby'], ['alpha-sapphire', 'Alpha Sapphire']),
    hasEncounterData: true,
  },
  {
    slug: 'sun-moon',
    title: 'Sun / Moon',
    generation: 7,
    dexes: ALOLA_ORIGINAL,
    versions: pair(['sun', 'Sun'], ['moon', 'Moon']),
    hasEncounterData: true,
  },
  {
    slug: 'ultra-sun-ultra-moon',
    title: 'Ultra Sun / Ultra Moon',
    generation: 7,
    dexes: ALOLA_UPDATED,
    versions: pair(['ultra-sun', 'Ultra Sun'], ['ultra-moon', 'Ultra Moon']),
    hasEncounterData: true,
  },
  {
    slug: 'lets-go-pikachu-lets-go-eevee',
    title: "Let's Go Pikachu / Eevee",
    generation: 7,
    dexes: [{ slug: 'letsgo-kanto', label: 'Kanto', formRegion: null }],
    versions: pair(['lets-go-pikachu', "Let's Go Pikachu"], ['lets-go-eevee', "Let's Go Eevee"]),
    hasEncounterData: true,
  },
  {
    slug: 'sword-shield',
    title: 'Sword / Shield',
    generation: 8,
    dexes: [
      { slug: 'galar', label: 'Galar', formRegion: 'galar' },
      { slug: 'isle-of-armor', label: 'Isle of Armor', formRegion: 'galar' },
      { slug: 'crown-tundra', label: 'Crown Tundra', formRegion: 'galar' },
    ],
    versions: pair(
      ['sword', 'Sword'],
      ['shield', 'Shield'],
      ['the-isle-of-armor', 'the-crown-tundra'],
    ),
    hasEncounterData: true,
  },
  {
    slug: 'brilliant-diamond-shining-pearl',
    title: 'Brilliant Diamond / Shining Pearl',
    generation: 8,
    dexes: [ORIGINAL_SINNOH],
    versions: pair(['brilliant-diamond', 'Brilliant Diamond'], ['shining-pearl', 'Shining Pearl']),
    hasEncounterData: false,
  },
  {
    slug: 'legends-arceus',
    title: 'Legends: Arceus',
    generation: 8,
    dexes: [{ slug: 'hisui', label: 'Hisui', formRegion: 'hisui' }],
    versions: single('legends-arceus', 'Legends: Arceus'),
    hasEncounterData: false,
  },
  {
    slug: 'scarlet-violet',
    title: 'Scarlet / Violet',
    generation: 9,
    dexes: [
      { slug: 'paldea', label: 'Paldea', formRegion: 'paldea' },
      { slug: 'kitakami', label: 'Kitakami', formRegion: 'paldea' },
      { slug: 'blueberry', label: 'Blueberry', formRegion: 'paldea' },
    ],
    versions: pair(
      ['scarlet', 'Scarlet'],
      ['violet', 'Violet'],
      ['the-teal-mask', 'the-indigo-disk'],
    ),
    hasEncounterData: false,
  },
  {
    slug: 'legends-za',
    title: 'Legends: Z-A',
    generation: 9,
    dexes: [
      { slug: 'lumiose-city', label: 'Lumiose City', formRegion: null },
      { slug: 'hyperspace', label: 'Hyperspace', formRegion: null },
    ],
    versions: single('legends-za', 'Legends: Z-A'),
    hasEncounterData: false,
  },
]
