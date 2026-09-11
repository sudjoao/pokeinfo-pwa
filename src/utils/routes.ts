import { GAME_ROUTES, type GameRoute } from '@/data/routes'
import type { Game } from '@/data/games'
import type { LocationAreaDto } from '@/services/pokeapi/dto'
import type { RoutePokemon } from '@/types/pokemon'
import { findGameByVersion } from './games'
import { idFromResourceUrl } from './pokemon'

/** Teto de exibição: covis de Dynamax somam `chance` por raridade e podem passar de 100. */
const MAX_CHANCE = 100

interface Accumulator {
  id: number
  name: string
  minLevel: number
  maxLevel: number
  /** Chance por método, já capada; o maior valor entre as áreas somadas (não soma entre elas). */
  methods: Map<string, number>
  versions: Set<string>
}

/** Rotas curadas do jogo (`data/routes.ts`); vazio para jogos sem `hasEncounterData`. */
export function routesForGame(game: Game): readonly GameRoute[] {
  return GAME_ROUTES[game.slug] ?? []
}

/**
 * Pokémon de uma rota, somando as áreas do local (andares de caverna, covis de raid) e
 * filtrando só as versões do jogo selecionado. Ordenados da maior chance pra menor.
 */
export function toRoutePokemon(dtos: readonly LocationAreaDto[], game: Game): RoutePokemon[] {
  const byPokemon = new Map<string, Accumulator>()

  for (const dto of dtos) {
    for (const encounter of dto.pokemon_encounters) {
      for (const versionDetail of encounter.version_details) {
        const owner = findGameByVersion(versionDetail.version.name)
        if (!owner || owner.game.slug !== game.slug) continue

        let entry = byPokemon.get(encounter.pokemon.name)
        if (!entry) {
          entry = {
            id: idFromResourceUrl(encounter.pokemon.url),
            name: encounter.pokemon.name,
            minLevel: Infinity,
            maxLevel: 0,
            methods: new Map(),
            versions: new Set(),
          }
          byPokemon.set(encounter.pokemon.name, entry)
        }

        entry.versions.add(owner.version.slug)

        const chanceByMethod = new Map<string, number>()
        for (const detail of versionDetail.encounter_details) {
          entry.minLevel = Math.min(entry.minLevel, detail.min_level)
          entry.maxLevel = Math.max(entry.maxLevel, detail.max_level)
          chanceByMethod.set(
            detail.method.name,
            (chanceByMethod.get(detail.method.name) ?? 0) + detail.chance,
          )
        }
        for (const [method, chance] of chanceByMethod) {
          entry.methods.set(method, Math.max(entry.methods.get(method) ?? 0, chance))
        }
      }
    }
  }

  return [...byPokemon.values()]
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      minLevel: Number.isFinite(entry.minLevel) ? entry.minLevel : 0,
      maxLevel: entry.maxLevel,
      methods: [...entry.methods]
        .map(([slug, chance]) => ({ slug, chance: Math.min(chance, MAX_CHANCE) }))
        .sort((a, b) => b.chance - a.chance),
      onlyIn:
        game.versions.length > 1 && entry.versions.size === 1 ? [...entry.versions][0]! : null,
    }))
    .sort((a, b) => (b.methods[0]?.chance ?? 0) - (a.methods[0]?.chance ?? 0) || a.id - b.id)
}
