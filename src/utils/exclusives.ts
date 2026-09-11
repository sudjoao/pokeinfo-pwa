import { EXCLUSIVES, type ExclusiveVersion } from '@/data/exclusives'

const EMPTY: readonly ExclusiveVersion[] = []

/** As duas versões de um jogo que têm exclusivos; vazio para jogos de versão única ou sem jogo. */
export function exclusiveVersions(
  gameSlug: string | null | undefined,
): readonly ExclusiveVersion[] {
  return gameSlug ? (EXCLUSIVES[gameSlug]?.versions ?? EMPTY) : EMPTY
}

/** Versão do jogo com o slug informado (ex.: "sword"), ou null se o jogo não a tem. */
export function findExclusiveVersion(
  gameSlug: string | null | undefined,
  versionSlug: string | null | undefined,
): ExclusiveVersion | null {
  if (!versionSlug) return null
  return exclusiveVersions(gameSlug).find((version) => version.slug === versionSlug) ?? null
}

/** Mapa "espécie -> versão exclusiva" por jogo, montado uma vez a partir das listas. */
const lookups = new Map<string, Map<number, ExclusiveVersion>>()

function lookupFor(gameSlug: string): Map<number, ExclusiveVersion> {
  let lookup = lookups.get(gameSlug)
  if (!lookup) {
    lookup = new Map()
    for (const version of exclusiveVersions(gameSlug)) {
      for (const speciesId of version.species) lookup.set(speciesId, version)
    }
    lookups.set(gameSlug, lookup)
  }
  return lookup
}

/** Versão em que a espécie é exclusiva dentro do jogo, ou null quando ela existe nas duas. */
export function exclusiveVersionOf(
  gameSlug: string | null | undefined,
  speciesId: number,
): ExclusiveVersion | null {
  if (!gameSlug) return null
  return lookupFor(gameSlug).get(speciesId) ?? null
}
