import { FORM_SPECIES } from '@/data/generated/forms'

/** Espécie de um Pokémon ou forma (10091 rattata-alola -> 19); a forma padrão já é a espécie. */
export function speciesIdOf(pokemonId: number): number {
  return FORM_SPECIES[pokemonId] ?? pokemonId
}
