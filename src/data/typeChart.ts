import { POKEMON_TYPES, type PokemonType } from '@/types/pokemon'

/**
 * Tabela de efetividade de tipos (6ª geração em diante, a usada nos jogos atuais).
 *
 * Estática de propósito: o `/type/{nome}` da PokéAPI até traz `damage_relations`, mas a tabela
 * não muda e ficar em código evita persistir mais um mapa. Só as relações diferentes de 1×
 * aparecem aqui; `attackMultiplier` (utils/typeChart.ts) assume 1× para o resto.
 */

/** Os 18 tipos que existem em batalha (`stellar` e `unknown` ficam fora). */
export const BATTLE_TYPES: readonly PokemonType[] = POKEMON_TYPES.filter(
  (type) => type !== 'stellar' && type !== 'unknown',
)

export type Effectiveness = 0 | 0.5 | 2

/** O que uma habilidade faz com o dano recebido de cada tipo (só as que mudam a tabela). */
export interface AbilityDefense {
  /** Multiplicador extra por tipo de ataque (0 = imune, 0.5 = metade, 2 = dobro). */
  multipliers?: Partial<Record<PokemonType, number>>
  /** Wonder Guard: só golpes super efetivos acertam. */
  onlySuperEffective?: boolean
}

/**
 * Habilidades que alteram as fraquezas e resistências (slugs da PokéAPI). Lista curta de
 * propósito: só as que entram na tabela de tipos; as que dependem da situação (Multiscale,
 * Filter, Solid Rock…) ficam de fora.
 */
export const ABILITY_DEFENSE: Readonly<Record<string, AbilityDefense>> = {
  levitate: { multipliers: { ground: 0 } },
  'earth-eater': { multipliers: { ground: 0 } },
  'flash-fire': { multipliers: { fire: 0 } },
  'well-baked-body': { multipliers: { fire: 0 } },
  'water-absorb': { multipliers: { water: 0 } },
  'storm-drain': { multipliers: { water: 0 } },
  'dry-skin': { multipliers: { water: 0, fire: 1.25 } },
  'volt-absorb': { multipliers: { electric: 0 } },
  'lightning-rod': { multipliers: { electric: 0 } },
  'motor-drive': { multipliers: { electric: 0 } },
  'sap-sipper': { multipliers: { grass: 0 } },
  'wind-rider': { multipliers: { flying: 0 } },
  'thick-fat': { multipliers: { fire: 0.5, ice: 0.5 } },
  heatproof: { multipliers: { fire: 0.5 } },
  'purifying-salt': { multipliers: { ghost: 0.5 } },
  fluffy: { multipliers: { fire: 2 } },
  'wonder-guard': { onlySuperEffective: true },
}

/** `TYPE_CHART[atacante][defensor]` = multiplicador do golpe do tipo atacante contra o defensor. */
export const TYPE_CHART: Partial<Record<PokemonType, Partial<Record<PokemonType, Effectiveness>>>> =
  {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    grass: {
      fire: 0.5,
      water: 2,
      grass: 0.5,
      poison: 0.5,
      ground: 2,
      flying: 0.5,
      bug: 0.5,
      rock: 2,
      dragon: 0.5,
      steel: 0.5,
    },
    electric: { water: 2, grass: 0.5, electric: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    ice: {
      fire: 0.5,
      water: 0.5,
      grass: 2,
      ice: 0.5,
      ground: 2,
      flying: 2,
      dragon: 2,
      steel: 0.5,
    },
    fighting: {
      normal: 2,
      ice: 2,
      poison: 0.5,
      flying: 0.5,
      psychic: 0.5,
      bug: 0.5,
      rock: 2,
      ghost: 0,
      dark: 2,
      steel: 2,
      fairy: 0.5,
    },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
    ground: {
      fire: 2,
      grass: 0.5,
      electric: 2,
      poison: 2,
      flying: 0,
      bug: 0.5,
      rock: 2,
      steel: 2,
    },
    flying: { grass: 2, electric: 0.5, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: {
      fire: 0.5,
      grass: 2,
      fighting: 0.5,
      poison: 0.5,
      flying: 0.5,
      psychic: 2,
      ghost: 0.5,
      dark: 2,
      steel: 0.5,
      fairy: 0.5,
    },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
    fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
  }
