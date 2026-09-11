import { BATTLE_TYPES, TYPE_CHART } from '@/data/typeChart'
import type { PokemonType } from '@/types/pokemon'

/** Multiplicador de um golpe do tipo `attacking` contra um Pokémon com os tipos `defending`. */
export function attackMultiplier(
  attacking: PokemonType,
  defending: readonly PokemonType[],
): number {
  let multiplier = 1
  for (const type of defending) multiplier *= TYPE_CHART[attacking]?.[type] ?? 1
  return multiplier
}

/** Rótulo curto do multiplicador para a tabela: "4×", "2×", "½", "¼", "0" ou "" (neutro). */
export function formatMultiplier(multiplier: number): string {
  if (multiplier === 0) return '0'
  if (multiplier === 0.25) return '¼'
  if (multiplier === 0.5) return '½'
  if (multiplier === 1) return ''
  return `${multiplier}×`
}

/** Algo com tipos: um membro do time. */
export interface Typed {
  types: readonly PokemonType[]
}

/** Uma linha da tabela defensiva: quanto um tipo de ataque causa em cada membro do time. */
export interface DefenseRow {
  type: PokemonType
  /** Multiplicador por membro, na ordem do time. */
  multipliers: number[]
  /** Membros que tomam dano super efetivo (2× ou 4×). */
  weak: number
  /** Membros que resistem ou são imunes (½, ¼ ou 0). */
  resistant: number
}

/** Tabela defensiva do time: uma linha por tipo de ataque. */
export function analyzeDefense(team: readonly Typed[]): DefenseRow[] {
  return BATTLE_TYPES.map((type) => {
    const multipliers = team.map((member) => attackMultiplier(type, member.types))
    return {
      type,
      multipliers,
      weak: multipliers.filter((m) => m > 1).length,
      resistant: multipliers.filter((m) => m < 1).length,
    }
  })
}

/**
 * Fraquezas do time: tipos que acertam pelo menos dois membros de forma super efetiva e são
 * resistidos por menos membros do que isso, das mais graves para as mais leves. Um único membro
 * fraco a algo não conta: é normal e não define uma fraqueza do time.
 */
export function teamThreats(rows: readonly DefenseRow[]): DefenseRow[] {
  return rows
    .filter((row) => row.weak >= 2 && row.weak > row.resistant)
    .sort((a, b) => b.weak - b.resistant - (a.weak - a.resistant) || b.weak - a.weak)
}

/** Uma linha da cobertura ofensiva: quem no time acerta o tipo defensor com STAB super efetivo. */
export interface CoverageRow {
  type: PokemonType
  /** Índices (na ordem do time) dos membros com um tipo próprio super efetivo contra `type`. */
  coveredBy: number[]
}

/**
 * Cobertura ofensiva por STAB: considera só os tipos do próprio Pokémon (golpes do mesmo tipo
 * ganham bônus), contra cada tipo defensor isolado. É uma simplificação: não olha os golpes reais.
 */
export function analyzeCoverage(team: readonly Typed[]): CoverageRow[] {
  return BATTLE_TYPES.map((defending) => ({
    type: defending,
    coveredBy: team.flatMap((member, index) =>
      member.types.some((attacking) => attackMultiplier(attacking, [defending]) > 1) ? [index] : [],
    ),
  }))
}

/** Tipos que nenhum membro acerta de forma super efetiva. */
export function coverageGaps(rows: readonly CoverageRow[]): CoverageRow[] {
  return rows.filter((row) => row.coveredBy.length === 0)
}
