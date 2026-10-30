import type { PokemonType } from './pokemon'

/**
 * Líderes de ginásio, kahunas, Elite 4 e campeão de cada jogo, gerados da Bulbapedia por
 * scripts/gen-trainers.mjs em `data/generated/trainers/{jogo}.ts`.
 */

/** Seções da tela, na ordem do jogo; "kanto" são os ginásios de Kanto nos jogos de Johto. */
export type LeagueSectionKey = 'gyms' | 'kahunas' | 'elite4' | 'champion' | 'kanto' | 'postgame'

/** Condição para o treinador ou o time aparecer; sem condição, vale sempre. */
export interface TrainerCondition {
  /** Só nesta versão (slug de `GameVersion`, ex.: "sword"). */
  version?: string
  /** Só se o jogador escolheu este inicial (id da espécie). */
  starter?: number
  /** Só se o Eevee do rival evoluiu para este (Yellow). */
  rivalEevee?: number
}

/** Mecânica especial que o treinador usa nesse Pokémon. */
export type TrainerSpecial = 'mega' | 'z' | 'dmax' | 'gmax'

export interface TrainerPokemon {
  /** Id do Pokémon ou da forma (Raichu de Alola = 10100). */
  id: number
  level: number
  /** Slugs dos golpes (`MOVES`); os valores mudam por jogo, ver `moveInfo`. */
  moves: string[]
  gender?: 'm' | 'f'
  ability?: string
  item?: string
  /** Tipo Tera (Scarlet/Violet). */
  tera?: PokemonType | 'stellar'
  special?: TrainerSpecial
}

export interface TrainerTeam {
  when?: TrainerCondition
  pokemon: TrainerPokemon[]
}

export interface TrainerBattle {
  kind: 'first' | 'rematch'
  /** Título da luta na Bulbapedia, em inglês, quando diz algo a mais ("After Stark Mountain"). */
  detail?: string
  /** Observação da Bulbapedia, em inglês ("Brock has five Full Heals per Pokémon."). */
  note?: string
  /** Um time por variação (inicial, versão); quase sempre só um. */
  teams: TrainerTeam[]
}

export interface Trainer {
  name: string
  /** Página na Bulbapedia (para o link "ver mais"). */
  page: string
  /** Tipo em que o treinador é especialista (null nos campeões de time misto). */
  type?: PokemonType
  /** Local da luta, em inglês ("Pewter Gym"). */
  location?: string
  when?: TrainerCondition
  battles: TrainerBattle[]
}

export interface LeagueSection {
  key: LeagueSectionKey
  trainers: Trainer[]
}
