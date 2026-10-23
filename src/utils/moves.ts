import { MOVE_CHANGES, MOVES, VERSION_GROUPS } from '@/data/generated/moves'
import { POKEMON_TYPES, type PokemonMoveLearn, type PokemonType } from '@/types/pokemon'
import { formatPokemonName } from './pokemon'

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

/** Sem diferenciar maiúsculas nem acentos ("acrobacias" acha "Acróbata"). */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export type MoveSort = 'name' | 'power' | 'accuracy' | 'pp'

export interface MoveListFilter {
  query: string
  type: PokemonType | null
  category: MoveCategory | null
  sort: MoveSort
  /** Ordem decrescente (padrão nos números: mais forte primeiro). */
  desc: boolean
}

/** Nome do golpe no idioma atual (só o espanhol vem traduzido; o resto fica em inglês). */
export function moveName(info: Pick<MoveInfo, 'slug' | 'nameEs'>, locale: string): string {
  return (locale === 'es' && info.nameEs) || formatPokemonName(info.slug)
}

/**
 * Golpes que nenhum Pokémon aprende: Z-moves (uma variante física e outra especial com o mesmo
 * nome, PP 1) e golpes Max/G-Max (criados pelo Dynamax). Sketch é o único golpe normal com PP 1.
 */
function isBattleOnlyMove(slug: string, pp: number): boolean {
  return slug.includes('--') || /^(g-)?max-/.test(slug) || (pp === 1 && slug !== 'sketch')
}

/**
 * Golpes de um jogo com os valores dele. Com `available` (golpes do learnset do jogo), só os que
 * existem nele; sem, todos os aprendíveis com os valores atuais. Golpes sem tipo da série principal (os "shadow"
 * de Colosseum/XD) ficam de fora.
 */
export function moveList(
  versionGroup: string | null,
  available?: ReadonlySet<string> | null,
): MoveInfo[] {
  return Object.entries(MOVES).flatMap(([slug, row]) => {
    if (available ? !available.has(slug) : isBattleOnlyMove(slug, row[4])) return []
    const info = moveInfo(slug, versionGroup)
    return info && info.type !== 'unknown' ? [info] : []
  })
}

export function filterMoves(
  moves: readonly MoveInfo[],
  filter: MoveListFilter,
  locale: string,
): MoveInfo[] {
  const term = normalize(filter.query.trim())
  const list = moves.filter(
    (move) =>
      (!filter.type || move.type === filter.type) &&
      (!filter.category || move.category === filter.category) &&
      (!term ||
        normalize(moveName(move, locale)).includes(term) ||
        normalize(move.slug.replace(/-/g, ' ')).includes(term)),
  )
  const byName = (a: MoveInfo, b: MoveInfo) =>
    moveName(a, locale).localeCompare(moveName(b, locale), locale)
  const value = (move: MoveInfo) => (filter.sort === 'name' ? 0 : (move[filter.sort] ?? -1))
  const direction = filter.desc ? -1 : 1
  return list.sort((a, b) =>
    filter.sort === 'name'
      ? direction * byName(a, b)
      : direction * (value(a) - value(b)) || byName(a, b),
  )
}

/** Versão de cada mudança do golpe: valores que valiam antes do grupo de versões `before`. */
export interface MoveHistoryEntry {
  /** Slug do grupo de versões em que o golpe passou a ter o valor seguinte. */
  before: string
  power: number | null
  accuracy: number | null
  pp: number | null
  type: PokemonType | null
}

export function moveHistory(slug: string): MoveHistoryEntry[] {
  const groupByOrder = new Map(Object.entries(VERSION_GROUPS).map(([vg, [order]]) => [order, vg]))
  return (MOVE_CHANGES[slug] ?? []).flatMap(([order, power, accuracy, pp, type]) => {
    const before = groupByOrder.get(order)
    if (!before) return []
    return [
      {
        before,
        power,
        accuracy,
        pp,
        type: type === null ? null : (POKEMON_TYPES[type] ?? null),
      },
    ]
  })
}
