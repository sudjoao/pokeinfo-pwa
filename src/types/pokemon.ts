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

/** Entrada de uma Pokédex regional: número no jogo + espécie. Fica só em memória. */
export interface PokedexEntry {
  entryNumber: number
  speciesId: number
  speciesName: string
}

/** Item da listagem. Com um jogo selecionado, traz o número na Pokédex dele e a espécie. */
export interface PokemonListItem extends PokemonSummary {
  /** Número na Pokédex regional selecionada (ausente na Pokédex Nacional). */
  dexNumber?: number
  /** Id da espécie (= número nacional), útil quando o card mostra uma forma regional. */
  speciesId?: number
}

export const STAT_NAMES = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
] as const

export type StatName = (typeof STAT_NAMES)[number]

export interface PokemonStat {
  name: StatName
  value: number
}

export interface PokemonAbility {
  name: string
  isHidden: boolean
}

/** Detalhe de um Pokémon (forma), já mapeado e enxuto. Fica só em memória. */
export interface PokemonDetail extends PokemonSummary {
  speciesId: number
  isDefault: boolean
  /** Altura em metros. */
  height: number
  /** Peso em quilogramas. */
  weight: number
  abilities: PokemonAbility[]
  stats: PokemonStat[]
  cryUrl: string | null
}

export interface PokemonVariety {
  pokemonId: number
  name: string
  isDefault: boolean
}

/** Dados da espécie (compartilhados entre as formas de um Pokémon). */
export interface PokemonSpecies {
  id: number
  name: string
  /** Ex.: "Mouse Pokémon" (a PokéAPI não tem pt-BR). */
  genus: string | null
  /** Texto da Pokédex mais recente em inglês. */
  description: string | null
  /** Número da geração (1..9). */
  generation: number | null
  /** -1 = sem gênero; 0..8 = chance de fêmea em oitavos. */
  genderRate: number
  eggGroups: string[]
  captureRate: number
  baseHappiness: number | null
  isBaby: boolean
  isLegendary: boolean
  isMythical: boolean
  evolutionChainId: number | null
  evolvesFromSpeciesId: number | null
  varieties: PokemonVariety[]
}

/** Um jeito de chegar a um estágio da evolução, já descrito em pt-BR. */
export interface EvolutionMethod {
  description: string
  /** Método considerado o padrão nos jogos atuais (campo is_default da PokéAPI). */
  isDefault: boolean
  /** Grupo de versões em que o método existe (ex.: "sword-shield"). */
  versionGroup: string | null
  /** Nome do Pokémon (forma) resultante quando difere da forma padrão da espécie. */
  resultForm: string | null
}

export interface EvolutionNode {
  speciesId: number
  name: string
  isBaby: boolean
  /** Como este estágio é alcançado a partir do anterior (vazio na base da cadeia). */
  methods: EvolutionMethod[]
  evolvesTo: EvolutionNode[]
}

export interface EvolutionChain {
  id: number
  /** Item que um dos pais deve segurar para o ovo gerar a forma bebê. */
  babyTriggerItem: string | null
  root: EvolutionNode
}
