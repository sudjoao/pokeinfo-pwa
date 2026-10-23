import { BATTLE_TYPES, TYPE_CHART } from '@/data/typeChart'
import { PAST_TYPES, TYPE_CHART_PAST } from '@/data/generated/typesPast'
import type { PokemonType } from '@/types/pokemon'

/** Geração da tabela atual; também o padrão quando não há jogo selecionado. */
export const LATEST_GENERATION = 9

/** Tipos que existem em batalha na geração: Sombrio e Aço chegam na 2ª, Fada na 6ª. */
export function battleTypes(generation = LATEST_GENERATION): readonly PokemonType[] {
  return BATTLE_TYPES.filter((type) => {
    if (type === 'fairy') return generation >= 6
    if (type === 'dark' || type === 'steel') return generation >= 2
    return true
  })
}

/**
 * Multiplicador de um tipo contra outro na geração. As exceções antigas (ex.: Fantasma não afetava
 * Psíquico na 1ª geração) valem até a geração indicada; vale a mais antiga que ainda cobre `generation`.
 */
function singleMultiplier(
  attacking: PokemonType,
  defending: PokemonType,
  generation: number,
): number {
  let override: number | undefined
  let overrideUntil = Infinity
  for (const [until, attacker, defender, multiplier] of TYPE_CHART_PAST) {
    if (
      attacker === attacking &&
      defender === defending &&
      generation <= until &&
      until < overrideUntil
    ) {
      override = multiplier
      overrideUntil = until
    }
  }
  return override ?? TYPE_CHART[attacking]?.[defending] ?? 1
}

/** Multiplicador de um golpe do tipo `attacking` contra um Pokémon com os tipos `defending`. */
export function attackMultiplier(
  attacking: PokemonType,
  defending: readonly PokemonType[],
  generation = LATEST_GENERATION,
): number {
  let multiplier = 1
  for (const type of defending) multiplier *= singleMultiplier(attacking, type, generation)
  return multiplier
}

/**
 * Tipos do Pokémon na geração: alguns mudaram (Clefairy era Normal até a 5ª, Magnemite era só
 * Elétrico na 1ª). Sem registro antigo, valem os tipos atuais.
 */
export function typesInGeneration(
  pokemonId: number,
  current: readonly PokemonType[],
  generation = LATEST_GENERATION,
): readonly PokemonType[] {
  for (const [until, types] of PAST_TYPES[pokemonId] ?? []) {
    if (generation <= until) return types
  }
  return current
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

/** Tabela defensiva do time: uma linha por tipo de ataque que existe na geração. */
export function analyzeDefense(
  team: readonly Typed[],
  generation = LATEST_GENERATION,
): DefenseRow[] {
  return battleTypes(generation).map((type) => {
    const multipliers = team.map((member) => attackMultiplier(type, member.types, generation))
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
export function analyzeCoverage(
  team: readonly Typed[],
  generation = LATEST_GENERATION,
): CoverageRow[] {
  return battleTypes(generation).map((defending) => ({
    type: defending,
    coveredBy: team.flatMap((member, index) =>
      member.types.some((attacking) => attackMultiplier(attacking, [defending], generation) > 1)
        ? [index]
        : [],
    ),
  }))
}

/** Tipos que nenhum membro acerta de forma super efetiva. */
export function coverageGaps(rows: readonly CoverageRow[]): CoverageRow[] {
  return rows.filter((row) => row.coveredBy.length === 0)
}

/** Um candidato a entrar no time: resiste (ou é imune) a estas fraquezas do time. */
export interface CounterSuggestion {
  id: number
  name: string
  covers: PokemonType[]
}

/**
 * Sugestões para as fraquezas do time: quem da lista (a Pokédex/filtros atuais) resiste a mais
 * tipos que ameaçam o time, sem ser fraco a nenhum deles. Empate: a ordem da lista.
 */
export function suggestCounters(
  candidates: readonly { id: number; name: string }[],
  threats: readonly PokemonType[],
  typesOf: (id: number) => readonly PokemonType[] | undefined,
  exclude: ReadonlySet<number>,
  generation = LATEST_GENERATION,
  limit = 6,
): CounterSuggestion[] {
  if (!threats.length) return []
  const result: CounterSuggestion[] = []
  for (const candidate of candidates) {
    if (exclude.has(candidate.id)) continue
    const own = typesOf(candidate.id)
    if (!own) continue
    const types = typesInGeneration(candidate.id, own, generation)
    const multipliers = threats.map((threat) => attackMultiplier(threat, types, generation))
    if (multipliers.some((m) => m > 1)) continue
    const covers = threats.filter((_, index) => multipliers[index]! < 1)
    if (covers.length) result.push({ id: candidate.id, name: candidate.name, covers })
  }
  return result.sort((a, b) => b.covers.length - a.covers.length).slice(0, limit)
}
