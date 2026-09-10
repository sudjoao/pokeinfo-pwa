export const POKEMON_TYPES = [
  'normal',
  'fire',
  'water',
  'grass',
  'electric',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
  'stellar',
  'unknown',
] as const

export type PokemonType = (typeof POKEMON_TYPES)[number]

/** Entrada leve do índice da Pokédex (vem da listagem da PokéAPI). */
export interface PokemonIndexEntry {
  id: number
  name: string
}

/** Resumo enxuto usado nos cards da listagem. É isso que persiste em cache. */
export interface PokemonSummary extends PokemonIndexEntry {
  types: PokemonType[]
}
