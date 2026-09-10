import type { PokemonType } from '@/types/pokemon'

const ARTWORK_BASE_URL =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork'

/** URL do artwork oficial, derivada só do id (não precisa do JSON de detalhe). */
export function artworkUrl(id: number): string {
  return `${ARTWORK_BASE_URL}/${id}.png`
}

/** 25 -> "#0025" */
export function formatDexNumber(id: number): string {
  return `#${String(id).padStart(4, '0')}`
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
