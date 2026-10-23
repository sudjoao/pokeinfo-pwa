import { MOVE_CHANGES, MOVES, VERSION_GROUPS } from '@/data/generated/moves'
import { POKEMON_TYPES, type PokemonMoveLearn, type PokemonType } from '@/types/pokemon'

export type MoveCategory = 'status' | 'physical' | 'special'

const CATEGORIES: readonly MoveCategory[] = ['status', 'physical', 'special']

/** Dados de um golpe num grupo de versões (tipo/poder/precisão/PP podem ter mudado entre gerações). */
export interface MoveInfo {
  slug: string
  type: PokemonType
  category: MoveCategory
  power: number | null
  accuracy: number | null
  pp: number | null
  /** Nome em espanhol (null se a PokéAPI não tiver). */
  nameEs: string | null
}

/** Ordem cronológica de um grupo de versões (desconhecido = depois de todos, ou seja, valores atuais). */
export function versionGroupOrder(versionGroup: string | null | undefined): number {
  return (versionGroup && VERSION_GROUPS[versionGroup]?.[0]) || Number.POSITIVE_INFINITY
}

/**
 * Dados do golpe no grupo de versões. Cada mudança registrada guarda o valor que valia ANTES do
 * grupo em que o golpe mudou; para cada campo vale a primeira mudança posterior ao grupo pedido.
 */
export function moveInfo(slug: string, versionGroup?: string | null): MoveInfo | null {
  const row = MOVES[slug]
  if (!row) return null
  const category = row[1]
  let [type, , power, accuracy, pp] = row
  const order = versionGroupOrder(versionGroup)
  const resolved = { power: false, accuracy: false, pp: false, type: false }
  for (const [changedAt, oldPower, oldAccuracy, oldPp, oldType] of MOVE_CHANGES[slug] ?? []) {
    if (order >= changedAt) continue
    if (!resolved.power && oldPower !== null) [power, resolved.power] = [oldPower, true]
    if (!resolved.accuracy && oldAccuracy !== null)
      [accuracy, resolved.accuracy] = [oldAccuracy, true]
    if (!resolved.pp && oldPp !== null) [pp, resolved.pp] = [oldPp, true]
    if (!resolved.type && oldType !== null) [type, resolved.type] = [oldType, true]
  }
  return {
    slug,
    type: POKEMON_TYPES[type] ?? 'unknown',
    category: CATEGORIES[category] ?? 'status',
    power: power || null,
    accuracy: accuracy || null,
    pp: pp || null,
    nameEs: row[5] || null,
  }
}

/** Grupos de versões em que o Pokémon aprende algum golpe, do mais recente para o mais antigo. */
export function versionGroupsWithMoves(moves: readonly PokemonMoveLearn[]): string[] {
  return [...new Set(moves.map((move) => move.versionGroup))].sort(
    (a, b) => versionGroupOrder(b) - versionGroupOrder(a),
  )
}

/** Métodos exibidos em abas próprias; os demais (ex.: "form-change", "zygarde-cube") vão para "other". */
export const MOVE_METHODS = ['level-up', 'machine', 'egg', 'tutor', 'other'] as const
export type MoveMethodGroup = (typeof MOVE_METHODS)[number]

export function methodGroup(method: string): MoveMethodGroup {
  return (MOVE_METHODS as readonly string[]).includes(method)
    ? (method as MoveMethodGroup)
    : 'other'
}

export interface LearnedMove {
  info: MoveInfo
  /** Nível (só "level-up"). */
  level: number
  method: string
}

/**
 * Golpes de um grupo de versões separados por método. Por nível em ordem de nível; os outros em
 * ordem alfabética. O mesmo golpe aprendido em dois níveis aparece duas vezes (como nos jogos).
 */
export function movesByMethod(
  moves: readonly PokemonMoveLearn[],
  versionGroup: string,
): Record<MoveMethodGroup, LearnedMove[]> {
  const groups: Record<MoveMethodGroup, LearnedMove[]> = {
    'level-up': [],
    machine: [],
    egg: [],
    tutor: [],
    other: [],
  }
  const seen = new Set<string>()
  for (const learn of moves) {
    if (learn.versionGroup !== versionGroup) continue
    const key = `${learn.move}|${learn.method}|${learn.level}`
    if (seen.has(key)) continue
    seen.add(key)
    const info = moveInfo(learn.move, versionGroup)
    if (!info) continue
    groups[methodGroup(learn.method)].push({ info, level: learn.level, method: learn.method })
  }
  groups['level-up'].sort((a, b) => a.level - b.level || a.info.slug.localeCompare(b.info.slug))
  for (const group of ['machine', 'egg', 'tutor', 'other'] as const) {
    groups[group].sort((a, b) => a.info.slug.localeCompare(b.info.slug))
  }
  return groups
}
