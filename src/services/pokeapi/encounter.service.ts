import type { EncounterLocation, PokemonEncounters } from '@/types/pokemon'
import { findGameByVersion } from '@/utils/games'
import { fetchJson } from './client'
import type { PokemonEncounterDto } from './dto'

interface Accumulator {
  location: EncounterLocation
  methods: Set<string>
  versions: Set<string>
}

/**
 * Agrupa a resposta crua (uma entrada por área × versão × nível × chance) em uma linha por
 * área dentro de cada jogo da lista `GAMES`. Versões fora da lista (Colosseum, XD, japonesas)
 * são ignoradas, e as DLCs entram no jogo base.
 */
export function toEncounters(dtos: PokemonEncounterDto[]): PokemonEncounters {
  const byGame = new Map<string, Map<string, Accumulator>>()

  for (const dto of dtos) {
    const area = dto.location_area.name
    for (const versionDetail of dto.version_details) {
      const owner = findGameByVersion(versionDetail.version.name)
      if (!owner) continue

      let areas = byGame.get(owner.game.slug)
      if (!areas) {
        areas = new Map()
        byGame.set(owner.game.slug, areas)
      }
      let entry = areas.get(area)
      if (!entry) {
        entry = {
          location: { area, methods: [], minLevel: Infinity, maxLevel: 0, onlyIn: null },
          methods: new Set(),
          versions: new Set(),
        }
        areas.set(area, entry)
      }

      entry.versions.add(owner.version.slug)
      for (const detail of versionDetail.encounter_details) {
        entry.methods.add(detail.method.name)
        entry.location.minLevel = Math.min(entry.location.minLevel, detail.min_level)
        entry.location.maxLevel = Math.max(entry.location.maxLevel, detail.max_level)
      }
    }
  }

  const result: PokemonEncounters = {}
  for (const [gameSlug, areas] of byGame) {
    const game = findGameByVersion([...areas.values()][0]!.versions.values().next().value!)!.game
    result[gameSlug] = [...areas.values()].map(({ location, methods, versions }) => ({
      ...location,
      methods: [...methods],
      minLevel: Number.isFinite(location.minLevel) ? location.minLevel : 0,
      // "Só Sword" quando o jogo tem duas versões e a área só aparece em uma delas.
      onlyIn: game.versions.length > 1 && versions.size === 1 ? [...versions][0]! : null,
    }))
  }
  return result
}

/**
 * Locais onde a forma de Pokémon aparece, já agrupados por jogo. A resposta crua vai de 2 bytes
 * (sem dados) a ~500 KB (Magikarp), mas é repetitiva e chega com 1 a 10 KB comprimidos.
 */
export async function getPokemonEncounters(
  id: number,
  signal?: AbortSignal,
): Promise<PokemonEncounters> {
  const dtos = await fetchJson<PokemonEncounterDto[]>(`/pokemon/${id}/encounters`, signal)
  return toEncounters(dtos)
}
