/** Análise do time de um treinador da liga (aba "Líderes"); os dados vêm de `utils/league.ts`. */
import type { PokemonType } from '@/types/pokemon'
import type { TrainerCondition, TrainerPokemon } from '@/types/trainers'
import { moveInfo, type MoveCategory } from './moves'
import { attackMultiplier, battleTypes } from './typeChart'

/** Maior nível do time: o "teto" para chegar preparado. */
export function maxLevel(pokemon: readonly TrainerPokemon[]): number {
  return Math.max(0, ...pokemon.map((member) => member.level))
}

/** Tipos que até a 3ª geração eram físicos (antes da divisão por golpe, na 4ª). */
const PHYSICAL_TYPES: ReadonlySet<PokemonType> = new Set([
  'normal',
  'fighting',
  'flying',
  'poison',
  'ground',
  'rock',
  'bug',
  'ghost',
  'steel',
])

/** Categoria do golpe no jogo: até a 3ª geração ela vinha do tipo, não do golpe. */
export function categoryInGeneration(
  category: MoveCategory,
  type: PokemonType,
  generation: number,
): MoveCategory {
  if (category === 'status' || generation >= 4) return category
  return PHYSICAL_TYPES.has(type) ? 'physical' : 'special'
}

/** Um tipo de ataque e quantos membros do time ele acerta com vantagem. */
export interface TypeCount {
  type: PokemonType
  count: number
}

/**
 * Tipos de ataque que acertam com vantagem mais membros do time do treinador do que os que
 * resistem, do mais útil para o menos. É a pergunta "com o que eu entro?": um tipo que acerta
 * metade do time e não é resistido por ninguém vale mais que um que acerta todos e três resistem.
 */
export function teamWeaknesses(
  members: readonly (readonly PokemonType[])[],
  generation: number,
  limit = 4,
): TypeCount[] {
  return battleTypes(generation)
    .map((type) => {
      const multipliers = members.map((types) => attackMultiplier(type, types, generation))
      const weak = multipliers.filter((m) => m > 1).length
      const resisted = multipliers.filter((m) => m < 1).length
      return { type, count: weak, score: weak - resisted }
    })
    .filter((entry) => entry.count > 0 && entry.score > 0)
    .sort((a, b) => b.score - a.score || b.count - a.count)
    .slice(0, limit)
    .map(({ type, count }) => ({ type, count }))
}

/**
 * Tipos dos golpes de dano do time (sem os de status), dos mais usados para os menos: o que o
 * seu time vai tomar. Conta Pokémon, não golpes (dois golpes de Fogo no mesmo Pokémon contam um).
 */
export function attackingTypes(
  pokemon: readonly TrainerPokemon[],
  versionGroup: string,
  limit = 5,
): TypeCount[] {
  const counts = new Map<PokemonType, number>()
  for (const member of pokemon) {
    const types = new Set<PokemonType>()
    for (const slug of member.moves) {
      const info = moveInfo(slug, versionGroup)
      if (info && info.category !== 'status' && info.type !== 'unknown') types.add(info.type)
    }
    for (const type of types) counts.set(type, (counts.get(type) ?? 0) + 1)
  }
  return [...counts]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

/** Duas condições iguais (para escolher o time que bate com a variação selecionada). */
export function sameCondition(a: TrainerCondition | undefined, b: TrainerCondition | undefined) {
  return a?.version === b?.version && a?.starter === b?.starter && a?.rivalEevee === b?.rivalEevee
}
