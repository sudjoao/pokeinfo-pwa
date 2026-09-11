import type { PokemonSpecies } from '@/types/pokemon'
import { formatPokemonName } from '@/utils/pokemon'

/**
 * Nome de exibição da espécie no idioma atual. Só usa o nome em espanhol quando o Pokémon
 * exibido é a própria forma padrão da espécie carregada (vizinhos, variedades e outros nós
 * da cadeia de evolução continuam com o slug formatado, que é a única informação disponível
 * para eles sem buscar a espécie de cada um).
 */
export function speciesDisplayName(
  species: PokemonSpecies | null | undefined,
  pokemonName: string,
  locale: string,
): string {
  if (locale === 'es' && species?.nameEs && species.name === pokemonName) return species.nameEs
  return formatPokemonName(pokemonName)
}

export function speciesGenus(
  species: PokemonSpecies | null | undefined,
  locale: string,
): string | null {
  if (!species) return null
  return locale === 'es' ? (species.genusEs ?? species.genus) : species.genus
}

export function speciesDescription(
  species: PokemonSpecies | null | undefined,
  locale: string,
): string | null {
  if (!species) return null
  return locale === 'es' ? (species.descriptionEs ?? species.description) : species.description
}
