import { POKEMON_TYPES, type PokemonType } from '@/types/pokemon'

const ARTWORK_BASE_URL =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork'

/** URL do artwork oficial, derivada só do id (não precisa do JSON de detalhe). */
export function artworkUrl(id: number, shiny = false): string {
  return `${ARTWORK_BASE_URL}${shiny ? '/shiny' : ''}/${id}.png`
}

/**
 * Larguras (px) servidas pelo proxy. Poucas faixas fixas fazem cards, evolução e time
 * reaproveitarem a mesma imagem no cache em vez de baixar uma por tamanho exibido.
 */
const ARTWORK_WIDTHS = [96, 240, 480] as const

/** Lado do artwork no topo do detalhe; o detalhe pré-carrega essa mesma URL (ver usePokemonDetail). */
export const HERO_ARTWORK_SIZE = 240

/** Lado do artwork nos cards da lista; o router pré-carrega os primeiros (ver router/index.ts). */
export const CARD_ARTWORK_SIZE = 120

/**
 * Artwork redimensionado e convertido para WebP pelo wsrv.nl (proxy de imagens na Cloudflare).
 * O PNG original tem 475 px e ~120 KB; na largura de um card (240 px, 2× da tela) fica com ~13 KB.
 * `size` é o lado exibido em px; a largura pedida cobre telas 2×. Se o proxy falhar, quem exibe
 * volta para `artworkUrl` (ver PokemonArtwork e PokemonAvatar).
 */
export function artworkSrc(id: number, size: number, shiny = false): string {
  const width =
    ARTWORK_WIDTHS.find((w) => w >= size * 2) ?? ARTWORK_WIDTHS[ARTWORK_WIDTHS.length - 1]
  const source = artworkUrl(id, shiny).replace(/^https:\/\//, '')
  return `https://wsrv.nl/?url=${source}&w=${width}&we&output=webp`
}

/**
 * Começa a baixar um artwork que vai ser o LCP (o topo do detalhe, os primeiros cards) antes de a
 * tela renderizar. Mesma requisição do `<img>` (tamanho e crossorigin iguais), para cair no cache
 * dele.
 */
export function preloadArtwork(id: number, size = HERO_ARTWORK_SIZE): void {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.fetchPriority = 'high'
  image.src = artworkSrc(id, size)
}

/** Sprite de item (PNG pequeno do repositório de sprites da PokéAPI): "oran-berry" -> URL. */
export function itemSpriteUrl(slug: string): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${slug}.png`
}

/** 25 -> "#0025"; com `digits` 3 (Pokédex regionais): 25 -> "#025" */
export function formatDexNumber(id: number, digits = 4): string {
  return `#${String(id).padStart(digits, '0')}`
}

/** "https://pokeapi.co/api/v2/pokemon/25/" -> 25 */
export function idFromResourceUrl(url: string): number {
  const match = /\/(\d+)\/?$/.exec(url)
  return match ? Number(match[1]) : NaN
}

/** "mr-mime" -> "Mr Mime" */
export function formatPokemonName(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/** Cor de cada tipo; o nome traduzido vem das mensagens (`type.*`). */
export const TYPE_COLORS: Record<PokemonType, string> = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  grass: '#78C850',
  electric: '#F8D030',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
  stellar: '#40B5A5',
  unknown: '#68A090',
}

const DARK_TEXT = '#1a1a1a'

/** Luminância relativa (WCAG) de uma cor `#rrggbb`. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Texto branco ou escuro, o que tiver mais contraste com o fundo. */
function readableTextOn(background: string): string {
  const bg = luminance(background)
  const onWhite = 1.05 / (bg + 0.05)
  const onDark = (bg + 0.05) / (luminance(DARK_TEXT) + 0.05)
  return onWhite >= onDark ? '#ffffff' : DARK_TEXT
}

/**
 * Cor do texto sobre a cor de cada tipo (chips). Branco em todos ficava abaixo de 4,5:1 na maioria
 * (Elétrico 1,5:1, Gelo 1,6:1); só os tipos escuros (Lutador, Venenoso, Fantasma, Dragão, Sombrio)
 * seguem com texto branco.
 */
export const TYPE_TEXT_COLORS = Object.fromEntries(
  Object.entries(TYPE_COLORS).map(([type, color]) => [type, readableTextOn(color)]),
) as Record<PokemonType, string>

export function isPokemonType(name: string): name is PokemonType {
  return (POKEMON_TYPES as readonly string[]).includes(name)
}

const CRY_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest'

/** URL do grito (cry) mais recente, derivada só do id. Arquivo .ogg (Vorbis), ~7 KB. */
export function cryUrl(id: number): string {
  return `${CRY_BASE_URL}/${id}.ogg`
}

const decimalFormatters = new Map<string, Intl.NumberFormat>()

function decimal(value: number, locale: string): string {
  let formatter = decimalFormatters.get(locale)
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })
    decimalFormatters.set(locale, formatter)
  }
  return formatter.format(value)
}

/** 12.5 -> "12,5%" (pt-BR) / "12.5%" (en) */
export function formatPercent(value: number, locale: string): string {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)}%`
}

/** 0.4 -> "0,4 m" (pt-BR) / "0.4 m" (en) */
export function formatHeight(meters: number, locale: string): string {
  return `${decimal(meters, locale)} m`
}

/** 6 -> "6,0 kg" (pt-BR) / "6.0 kg" (en) */
export function formatWeight(kilograms: number, locale: string): string {
  return `${decimal(kilograms, locale)} kg`
}

/** Valor máximo de um stat base na série principal (Blissey, HP 255). */
export const MAX_BASE_STAT = 255

/** Cor da barra de stat conforme o valor (escala parecida com a de sites de Pokédex). */
export function statColor(value: number): string {
  if (value < 50) return '#ef4444'
  if (value < 80) return '#f97316'
  if (value < 100) return '#eab308'
  if (value < 120) return '#84cc16'
  return '#22c55e'
}

/** "generation-iv" -> 4 */
export function generationNumber(name: string): number | null {
  const roman = name.replace(/^generation-/, '').toUpperCase()
  const values: Record<string, number> = { I: 1, V: 5, X: 10 }
  let total = 0
  for (let i = 0; i < roman.length; i++) {
    const current = values[roman[i]!] ?? 0
    const next = values[roman[i + 1] ?? ''] ?? 0
    total += current < next ? -current : current
  }
  return total > 0 ? total : null
}

export interface GenderRatio {
  female: number
  male: number
}

/** gender_rate da PokéAPI: -1 = sem gênero, 0..8 = chance de fêmea em oitavos. */
export function genderRatio(rate: number): GenderRatio | null {
  if (rate < 0) return null
  const female = (rate / 8) * 100
  return { female, male: 100 - female }
}
