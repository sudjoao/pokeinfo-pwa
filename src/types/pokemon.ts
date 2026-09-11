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
  /** Título da versão em que a espécie é exclusiva no jogo selecionado (ex.: "Sword"). */
  exclusiveTo?: string
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
  /** Nome em espanhol, quando a PokéAPI tiver (null se não tiver). */
  nameEs: string | null
  /** Gênero (ex.: "Pokémon Semilla") em espanhol, quando a PokéAPI tiver. */
  genusEs: string | null
  /** Texto da Pokédex mais recente em espanhol, quando a PokéAPI tiver. */
  descriptionEs: string | null
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

/**
 * Condições de uma evolução já normalizadas (só nomes/números), independentes do formato
 * da PokéAPI. A frase é montada na hora de exibir, no idioma atual (`describeEvolution`).
 */
export interface EvolutionRequirement {
  trigger: string | null
  item: string | null
  heldItem: string | null
  gender: number | null
  knownMove: string | null
  knownMoveType: string | null
  location: string | null
  minLevel: number | null
  minHappiness: number | null
  minBeauty: number | null
  minAffection: number | null
  nearSpecialRock: boolean
  needsMultiplayer: boolean
  needsOverworldRain: boolean
  partySpecies: string | null
  partyType: string | null
  relativePhysicalStats: number | null
  timeOfDay: string | null
  tradeSpecies: string | null
  turnUpsideDown: boolean
  region: string | null
  usedMove: string | null
  minMoveCount: number | null
  minSteps: number | null
  minDamageTaken: number | null
}

/** Um jeito de chegar a um estágio da evolução. */
export interface EvolutionMethod {
  requirement: EvolutionRequirement
  /** Forma de origem quando só ela evolui assim (ex.: Sirfetch'd vem do Farfetch'd de Galar). */
  baseForm: string | null
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

/** Onde um Pokémon aparece em um jogo, agregado por área (a PokéAPI lista uma entrada por nível/chance). */
export interface EncounterLocation {
  /** Slug da área na PokéAPI (ex.: "kanto-route-1-area"); o nome exibido é montado a partir dele. */
  area: string
  /** Métodos de encontro (slugs de `/encounter-method`: "walk", "surf", "old-rod"…), sem repetição. */
  methods: string[]
  minLevel: number
  maxLevel: number
  /** Slug da versão quando o encontro só existe em uma das versões do jogo (ex.: "sword"); null nas duas. */
  onlyIn: string | null
}

/** Locais por jogo (chave = slug do jogo em `data/games.ts`). Só jogos da lista; fica só em memória. */
export type PokemonEncounters = Record<string, EncounterLocation[]>
