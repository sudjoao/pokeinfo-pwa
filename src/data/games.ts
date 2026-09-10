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

export interface Game {
  /** Slug do `version-group` da PokéAPI. */
  slug: string
  title: string
  generation: number
  dexes: GameDex[]
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
  { slug: 'red-blue', title: 'Red / Blue', generation: 1, dexes: [KANTO] },
  { slug: 'yellow', title: 'Yellow', generation: 1, dexes: [KANTO] },
  { slug: 'gold-silver', title: 'Gold / Silver', generation: 2, dexes: [ORIGINAL_JOHTO] },
  { slug: 'crystal', title: 'Crystal', generation: 2, dexes: [ORIGINAL_JOHTO] },
  { slug: 'ruby-sapphire', title: 'Ruby / Sapphire', generation: 3, dexes: [HOENN] },
  { slug: 'emerald', title: 'Emerald', generation: 3, dexes: [HOENN] },
  { slug: 'firered-leafgreen', title: 'FireRed / LeafGreen', generation: 3, dexes: [KANTO] },
  { slug: 'diamond-pearl', title: 'Diamond / Pearl', generation: 4, dexes: [ORIGINAL_SINNOH] },
  {
    slug: 'platinum',
    title: 'Platinum',
    generation: 4,
    dexes: [{ slug: 'extended-sinnoh', label: 'Sinnoh', formRegion: null }],
  },
  {
    slug: 'heartgold-soulsilver',
    title: 'HeartGold / SoulSilver',
    generation: 4,
    dexes: [{ slug: 'updated-johto', label: 'Johto', formRegion: null }],
  },
  {
    slug: 'black-white',
    title: 'Black / White',
    generation: 5,
    dexes: [{ slug: 'original-unova', label: 'Unova', formRegion: null }],
  },
  {
    slug: 'black-2-white-2',
    title: 'Black 2 / White 2',
    generation: 5,
    dexes: [{ slug: 'updated-unova', label: 'Unova', formRegion: null }],
  },
  {
    slug: 'x-y',
    title: 'X / Y',
    generation: 6,
    dexes: [
      { slug: 'kalos-central', label: 'Kalos Central', formRegion: null },
      { slug: 'kalos-coastal', label: 'Kalos Costeira', formRegion: null },
      { slug: 'kalos-mountain', label: 'Kalos Montanhosa', formRegion: null },
    ],
  },
  {
    slug: 'omega-ruby-alpha-sapphire',
    title: 'Omega Ruby / Alpha Sapphire',
    generation: 6,
    dexes: [{ slug: 'updated-hoenn', label: 'Hoenn', formRegion: null }],
  },
  { slug: 'sun-moon', title: 'Sun / Moon', generation: 7, dexes: ALOLA_ORIGINAL },
  {
    slug: 'ultra-sun-ultra-moon',
    title: 'Ultra Sun / Ultra Moon',
    generation: 7,
    dexes: ALOLA_UPDATED,
  },
  {
    slug: 'lets-go-pikachu-lets-go-eevee',
    title: "Let's Go Pikachu / Eevee",
    generation: 7,
    dexes: [{ slug: 'letsgo-kanto', label: 'Kanto', formRegion: null }],
  },
  {
    slug: 'sword-shield',
    title: 'Sword / Shield',
    generation: 8,
    dexes: [
      { slug: 'galar', label: 'Galar', formRegion: 'galar' },
      { slug: 'isle-of-armor', label: 'Ilha da Armadura', formRegion: 'galar' },
      { slug: 'crown-tundra', label: 'Tundra da Coroa', formRegion: 'galar' },
    ],
  },
  {
    slug: 'brilliant-diamond-shining-pearl',
    title: 'Brilliant Diamond / Shining Pearl',
    generation: 8,
    dexes: [ORIGINAL_SINNOH],
  },
  {
    slug: 'legends-arceus',
    title: 'Legends: Arceus',
    generation: 8,
    dexes: [{ slug: 'hisui', label: 'Hisui', formRegion: 'hisui' }],
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
  },
  {
    slug: 'legends-za',
    title: 'Legends: Z-A',
    generation: 9,
    dexes: [
      { slug: 'lumiose-city', label: 'Lumiose', formRegion: null },
      { slug: 'hyperspace', label: 'Hiperespaço', formRegion: null },
    ],
  },
]
