import { POKEMON_TYPES, type PokemonType } from '@/types/pokemon'

const ARTWORK_BASE_URL =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork'

/** URL do artwork oficial, derivada só do id (não precisa do JSON de detalhe). */
export function artworkUrl(id: number): string {
  return `${ARTWORK_BASE_URL}/${id}.png`
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
