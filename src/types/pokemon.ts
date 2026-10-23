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
  /** Critério de ordenação já formatado (ex.: "Total 600", "1,7 m"), mostrado no card. */
  sortLabel?: string
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

/** Um jeito de aprender um golpe num grupo de versões (ex.: nível 16 em Scarlet/Violet). */
export interface PokemonMoveLearn {
  /** Slug do golpe (`/move`). */
  move: string
  /** Slug do grupo de versões (o mesmo de `Game.slug`). */
  versionGroup: string
  /** "level-up", "machine", "egg", "tutor"… (`/move-learn-method`). */
  method: string
  /** Nível (só em "level-up"; 0 = ao evoluir ou no nível 1 conforme o jogo). */
  level: number
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
  /** EVs que o Pokémon dá ao ser derrotado (só os stats com valor > 0). */
  evYield: PokemonStat[]
  baseExperience: number | null
  cryUrl: string | null
  /** Golpes por grupo de versões, já sem o resto da resposta (~260 KB crus). */
  moves: PokemonMoveLearn[]
}

/** Texto da Pokédex de uma versão de jogo. */
export interface PokedexText {
  /** Slug da versão (`/version`, ex.: "scarlet"). */
  version: string
  en: string | null
  es: string | null
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
  /** Slug da curva de experiência (`/growth-rate`: "slow", "medium-slow"…). */
  growthRate: string | null
  /** Ciclos de ovo (passos para chocar ≈ ciclos × 257). */
  hatchCounter: number | null
  /** Textos da Pokédex por versão, na ordem da API (mais antigas primeiro). */
  pokedexTexts: PokedexText[]
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

/** Um método de encontro numa rota, com a chance somada (capada em 100; covis de raid podem estourar). */
/**
 * Chance de um método sob um conjunto de condições da PokéAPI ("time-night", "swarm-yes"…).
 * Valores da mesma categoria são alternativas ("manhã ou dia"); de categorias diferentes, valem
 * juntos ("rádio Hoenn e noite"). `conditions` vazio = vale sempre.
 */
export interface ConditionVariant {
  conditions: string[]
  chance: number
}

export interface RouteEncounterMethod {
  slug: string
  /** Maior chance entre as variantes (é a que ordena a lista). */
  chance: number
  /** Só quando a chance depende de condição (hora, estação, swarm…); da maior para a menor. */
  variants?: ConditionVariant[]
}

/**
 * Um Pokémon disponível numa rota sem nome resolvido (usado pelos jogos com dados pré-computados,
 * como BDSP via Bulbapedia: o nome vem do índice já em memória, não precisa ir no arquivo estático).
 */
export interface StaticRoutePokemon {
  id: number
  minLevel: number
  maxLevel: number
  /** Ordenados do maior para o menor `chance`. */
  methods: RouteEncounterMethod[]
  /** Slug da versão quando só aparece em uma das versões do jogo (ex.: "sword"); null nas duas. */
  onlyIn: string | null
}

/** Um Pokémon disponível numa rota, já somando todas as áreas do local para o jogo selecionado. */
export interface RoutePokemon extends StaticRoutePokemon {
  name: string
}
