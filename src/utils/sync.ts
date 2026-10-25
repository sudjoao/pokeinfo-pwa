import type { PersistedGameSet } from '@/stores/gameSet'
import type { PersistedHunts, ShinyHunt } from '@/stores/shiny'
import type { BackupData } from './backup'
import { decodeBitset, encodeBitset } from './bitset'
import type { PersistedDaily } from './daily'

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

/** Forma canônica: bitsets reencodados, jogos vazios removidos (para comparar dois lados). */
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
    hunts: { ...data.hunts },
    ...(data.daily ? { daily: data.daily } : {}),
  }
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
    !canonical.daily?.stats.played
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
    // Os dois lados contaram encontros: fica o contador maior (a caçada não anda para trás).
    const hunt = pick<ShinyHunt>(base[key], local[key], remote[key], (l, r) =>
      r.count > l.count ? r : l,
    )
    if (hunt) result[key] = hunt
  }
  return result
}

function mergeDaily(
  base: PersistedDaily | undefined,
  local: PersistedDaily | undefined,
  remote: PersistedDaily | undefined,
): PersistedDaily | undefined {
  // Estatísticas não dá para somar sem duplicar dias: fica quem jogou mais vezes.
  return pick(base, local, remote, (l, r) => (r.stats.played > l.stats.played ? r : l))
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
  return {
    caught: mergeGameSets(from.caught, local.caught, remote.caught),
    shiny: mergeGameSets(from.shiny, local.shiny, remote.shiny),
    favorites: encodeBitset(favorites),
    hunts: mergeHunts(from.hunts, local.hunts, remote.hunts),
    ...(daily ? { daily } : {}),
  }
}
