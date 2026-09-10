import type { PokemonType, StatName } from '@/types/pokemon'

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

export interface TypeStyle {
  label: string
  color: string
}

export const TYPE_STYLES: Record<PokemonType, TypeStyle> = {
  normal: { label: 'Normal', color: '#A8A878' },
  fire: { label: 'Fogo', color: '#F08030' },
  water: { label: 'Água', color: '#6890F0' },
  grass: { label: 'Planta', color: '#78C850' },
  electric: { label: 'Elétrico', color: '#F8D030' },
  ice: { label: 'Gelo', color: '#98D8D8' },
  fighting: { label: 'Lutador', color: '#C03028' },
  poison: { label: 'Venenoso', color: '#A040A0' },
  ground: { label: 'Terra', color: '#E0C068' },
  flying: { label: 'Voador', color: '#A890F0' },
  psychic: { label: 'Psíquico', color: '#F85888' },
  bug: { label: 'Inseto', color: '#A8B820' },
  rock: { label: 'Pedra', color: '#B8A038' },
  ghost: { label: 'Fantasma', color: '#705898' },
  dragon: { label: 'Dragão', color: '#7038F8' },
  dark: { label: 'Sombrio', color: '#705848' },
  steel: { label: 'Aço', color: '#B8B8D0' },
  fairy: { label: 'Fada', color: '#EE99AC' },
  stellar: { label: 'Estelar', color: '#40B5A5' },
  unknown: { label: 'Desconhecido', color: '#68A090' },
}

const CRY_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest'

/** URL do grito (cry) mais recente, derivada só do id. Arquivo .ogg (Vorbis), ~7 KB. */
export function cryUrl(id: number): string {
  return `${CRY_BASE_URL}/${id}.ogg`
}

const decimalFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/** 0.4 -> "0,4 m" */
export function formatHeight(meters: number): string {
  return `${decimalFormatter.format(meters)} m`
}

/** 6 -> "6,0 kg" */
export function formatWeight(kilograms: number): string {
  return `${decimalFormatter.format(kilograms)} kg`
}

export const STAT_LABELS: Record<StatName, { label: string; short: string }> = {
  hp: { label: 'HP', short: 'HP' },
  attack: { label: 'Ataque', short: 'ATK' },
  defense: { label: 'Defesa', short: 'DEF' },
  'special-attack': { label: 'Ataque Especial', short: 'SpA' },
  'special-defense': { label: 'Defesa Especial', short: 'SpD' },
  speed: { label: 'Velocidade', short: 'SPD' },
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

const EGG_GROUP_LABELS: Record<string, string> = {
  monster: 'Monstro',
  water1: 'Água 1',
  water2: 'Água 2',
  water3: 'Água 3',
  bug: 'Inseto',
  flying: 'Voador',
  ground: 'Campo',
  fairy: 'Fada',
  plant: 'Planta',
  humanshape: 'Humanoide',
  mineral: 'Mineral',
  indeterminate: 'Amorfo',
  ditto: 'Ditto',
  dragon: 'Dragão',
  'no-eggs': 'Sem ovos',
}

export function formatEggGroup(name: string): string {
  return EGG_GROUP_LABELS[name] ?? formatPokemonName(name)
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
