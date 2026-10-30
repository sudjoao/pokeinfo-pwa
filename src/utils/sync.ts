import type { PersistedGameSet } from '@/stores/gameSet'
import type { PersistedHunts, ShinyHunt } from '@/stores/shiny'
import type { BackupData, PersistedTeams } from './backup'
import { decodeBitset, encodeBitset } from './bitset'
import { copyDaily, type DailyGame, type DailyStats, type PersistedDaily } from './daily'

/**
 * Mescla da coleção entre o aparelho e a conta. É uma mescla de 3 vias: além das duas versões, usa
 * a `base` (o que os dois lados tinham na última sincronização deste aparelho) para saber quem
 * mudou o quê. Assim um Pokémon marcado no iPhone sem internet e outro desmarcado no Mac entram os
 * dois, em vez de um lado sobrescrever o outro.
 *
 * Sem base (primeira sincronização), a base vazia faz tudo virar "acrescentado": o resultado é a
 * soma dos dois lados, como o "Somar" do backup.
 */

export const EMPTY_DATA: BackupData = { caught: {}, shiny: {}, favorites: '', hunts: {} }

/** JSON com as chaves em ordem: a mesma coleção sempre vira o mesmo texto. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : item,
  )
}

function same(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b)
}

/**
 * Forma canônica: bitsets reencodados, jogos vazios removidos (para comparar dois lados). É também
 * uma cópia profunda: guardada como base, não muda junto com os stores (a partida do dia, por
 * exemplo, é alterada no lugar a cada palpite).
 */
export function canonicalData(data: BackupData): BackupData {
  const sets = (sets: PersistedGameSet): PersistedGameSet => {
    const result: PersistedGameSet = {}
    for (const [game, encoded] of Object.entries(sets)) {
      const ids = decodeBitset(encoded)
      if (ids.size) result[game] = encodeBitset(ids)
    }
    return result
  }
  return {
    caught: sets(data.caught),
    shiny: sets(data.shiny),
    favorites: encodeBitset(decodeBitset(data.favorites)),
    hunts: Object.fromEntries(Object.entries(data.hunts).map(([key, hunt]) => [key, { ...hunt }])),
    ...(data.daily ? { daily: copyDaily(data.daily) } : {}),
    ...(hasTeams(data.teams) ? { teams: copyTeams(data.teams!) } : {}),
  }
}

/** Há algum time salvo (um objeto vazio conta como sem times). */
function hasTeams(value: PersistedTeams | undefined): boolean {
  return !!value && Object.values(value).some((ids) => ids.length)
}

function copyTeams(value: PersistedTeams): PersistedTeams {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, ids]) => ids.length)
      .map(([game, ids]) => [game, [...ids]]),
  )
}

export function sameData(a: BackupData, b: BackupData): boolean {
  return same(canonicalData(a), canonicalData(b))
}

export function isEmptyData(data: BackupData): boolean {
  const canonical = canonicalData(data)
  return (
    !Object.keys(canonical.caught).length &&
    !Object.keys(canonical.shiny).length &&
    !canonical.favorites &&
    !Object.keys(canonical.hunts).length &&
    !canonical.daily?.stats.played &&
    !canonical.teams
  )
}

/** Um id fica se os dois lados têm, ou se só um tem e ele foi acrescentado desde a base. */
export function mergeSet(
  base: ReadonlySet<number>,
  local: ReadonlySet<number>,
  remote: ReadonlySet<number>,
): Set<number> {
  const result = new Set<number>()
  for (const id of new Set([...local, ...remote])) {
    if ((local.has(id) && remote.has(id)) || !base.has(id)) result.add(id)
  }
  return result
}

function mergeGameSets(
  base: PersistedGameSet,
  local: PersistedGameSet,
  remote: PersistedGameSet,
): PersistedGameSet {
  const result: PersistedGameSet = {}
  for (const game of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    const ids = mergeSet(
      decodeBitset(base[game] ?? ''),
      decodeBitset(local[game] ?? ''),
      decodeBitset(remote[game] ?? ''),
    )
    if (ids.size) result[game] = encodeBitset(ids)
  }
  return result
}

/**
 * Escolha de 3 vias para um valor: fica o lado que mudou desde a base. Se os dois mudaram,
 * `conflict` decide; se um dos dois apagou e o outro editou, fica a edição (não perder dado).
 */
function pick<T>(
  base: T | undefined,
  local: T | undefined,
  remote: T | undefined,
  conflict: (local: T, remote: T) => T,
): T | undefined {
  if (same(local, remote)) return local
  if (same(local, base)) return remote
  if (same(remote, base)) return local
  if (local === undefined) return remote
  if (remote === undefined) return local
  return conflict(local, remote)
}

function mergeHunts(base: PersistedHunts, local: PersistedHunts, remote: PersistedHunts) {
  const result: PersistedHunts = {}
  for (const key of new Set([...Object.keys(local), ...Object.keys(remote)])) {
    const from = base[key]
    // Os dois lados mexeram na caçada: campo a campo. O contador fica o maior (não anda para
    // trás), e Shiny Charm/Masuda ficam com o lado que trocou o valor.
    const hunt = pick<ShinyHunt>(from, local[key], remote[key], (l, r) => ({
      count: Math.max(l.count, r.count),
      charm: from && l.charm === from.charm ? r.charm : l.charm,
      masuda: from && l.masuda === from.masuda ? r.masuda : l.masuda,
      startedAt: [l.startedAt, r.startedAt].filter(Boolean).sort()[0] ?? '',
    }))
    if (hunt) result[key] = hunt
  }
  return result
}

/**
 * Time de cada jogo: fica o lado que mexeu nele desde a base. Os dois mexeram no mesmo jogo: fica o
 * deste aparelho (um time não dá para somar sem passar de 6 nem para saber a ordem).
 */
function mergeTeams(
  base: PersistedTeams | undefined,
  local: PersistedTeams | undefined,
  remote: PersistedTeams | undefined,
): PersistedTeams | undefined {
  const from = base ?? {}
  const mine = local ?? {}
  const theirs = remote ?? {}
  const result: PersistedTeams = {}
  for (const game of new Set([...Object.keys(mine), ...Object.keys(theirs)])) {
    const team = pick<number[]>(from[game], mine[game], theirs[game], (l) => l)
    if (team?.length) result[game] = [...team]
  }
  return Object.keys(result).length ? result : undefined
}

/** Mesma partida do dia: fica a mais adiantada. Dias diferentes: fica a do dia mais recente. */
function laterGame(local: DailyGame, remote: DailyGame): DailyGame {
  if (local.day !== remote.day) return remote.day > local.day ? remote : local
  if (local.done !== remote.done) return local.done ? local : remote
  return remote.guesses.length > local.guesses.length ? remote : local
}

function mergeDaily(
  base: PersistedDaily | undefined,
  local: PersistedDaily | undefined,
  remote: PersistedDaily | undefined,
): PersistedDaily | undefined {
  if (!local || !remote) return local ?? remote
  // Estatísticas e partida separadas: só abrir a tela do dia num aparelho (partida nova, vazia)
  // não pode apagar os palpites feitos no outro. Estatísticas não dá para somar sem duplicar
  // dias: fica quem jogou mais vezes.
  const stats = pick<DailyStats>(base?.stats, local.stats, remote.stats, (l, r) =>
    r.played > l.played ? r : l,
  )!
  const game = pick<DailyGame | null>(base?.game, local.game, remote.game, (l, r) => {
    if (!l || !r) return l ?? r
    return laterGame(l, r)
  })
  return { stats, game: game ?? null }
}

/** Mescla de 3 vias de tudo o que é sincronizado. `base` null = primeira sincronização. */
export function mergeData(
  base: BackupData | null,
  local: BackupData,
  remote: BackupData,
): BackupData {
  const from = base ?? EMPTY_DATA
  const favorites = mergeSet(
    decodeBitset(from.favorites),
    decodeBitset(local.favorites),
    decodeBitset(remote.favorites),
  )
  const daily = mergeDaily(from.daily, local.daily, remote.daily)
  const teams = mergeTeams(from.teams, local.teams, remote.teams)
  return {
    caught: mergeGameSets(from.caught, local.caught, remote.caught),
    shiny: mergeGameSets(from.shiny, local.shiny, remote.shiny),
    favorites: encodeBitset(favorites),
    hunts: mergeHunts(from.hunts, local.hunts, remote.hunts),
    ...(daily ? { daily } : {}),
    ...(teams ? { teams } : {}),
  }
}
