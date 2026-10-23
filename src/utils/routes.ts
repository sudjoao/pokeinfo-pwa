import { GAME_ROUTES, type GameRoute } from '@/data/routes'
import { BDSP_ROUTES, type StaticGameRoute } from '@/data/routes-bdsp'
import { ROUTE_SECTIONS } from '@/data/routeOrder'
import type { Game } from '@/data/games'
import type { EncounterDetailDto, LocationAreaDto } from '@/services/pokeapi/dto'
import type { ConditionVariant, RouteEncounterMethod, RoutePokemon } from '@/types/pokemon'
import { conditionDomain, methodVariants, type ConditionDomain } from './encounterConditions'
import { findGameByVersion } from './games'
import { idFromResourceUrl } from './pokemon'

/** Teto de exibição: covis de Dynamax somam `chance` por raridade e podem passar de 100. */
const MAX_CHANCE = 100

export type AnyGameRoute = GameRoute | StaticGameRoute

/** Rota sem endpoint ao vivo (ex.: BDSP, cujos pokémon já vêm prontos da Bulbapedia). */
export function isStaticRoute(route: AnyGameRoute): route is StaticGameRoute {
  return 'pokemon' in route
}

interface Accumulator {
  id: number
  name: string
  minLevel: number
  maxLevel: number
  /**
   * Variantes por método e por condições (chave `conditions.join('+')`); entre áreas e versões
   * fica o maior valor de cada uma (não soma entre elas).
   */
  methods: Map<string, Map<string, ConditionVariant>>
  versions: Set<string>
}

/**
 * Rotas curadas do jogo: da PokéAPI (`data/routes.ts`, a maioria) ou pré-computadas de outra
 * fonte quando a PokéAPI não tem o dado (`data/routes-bdsp.ts`). Vazio quando não há nenhuma.
 */
export function routesForGame(game: Game): readonly AnyGameRoute[] {
  return GAME_ROUTES[game.slug] ?? BDSP_ROUTES[game.slug] ?? []
}

export interface RouteListSection {
  /** Sufixo da chave i18n `routes.section.*`. */
  key: string
  routes: AnyGameRoute[]
}

const sectionsCache = new Map<string, RouteListSection[]>()

/**
 * Rotas do jogo na ordem da história, divididas em seções (região, ilhas, DLC; ver
 * `data/routeOrder.ts`). Seções sem nenhum local do jogo ficam de fora. Um local que ainda não
 * esteja na ordem vai para o fim, em ordem natural, para nunca sumir da lista.
 */
export function routeSectionsForGame(game: Game): readonly RouteListSection[] {
  const cached = sectionsCache.get(game.slug)
  if (cached) return cached

  const remaining = new Map(routesForGame(game).map((route) => [route.location, route]))
  const sections: RouteListSection[] = []
  for (const { key, locations } of ROUTE_SECTIONS[game.slug] ?? []) {
    const routes: AnyGameRoute[] = []
    for (const location of locations) {
      const route = remaining.get(location)
      if (!route) continue
      routes.push(route)
      remaining.delete(location)
    }
    if (routes.length) sections.push({ key, routes })
  }
  if (remaining.size) {
    const rest = [...remaining.values()].sort((a, b) =>
      a.location.localeCompare(b.location, 'en', { numeric: true }),
    )
    const last = sections[sections.length - 1]
    if (last?.key === 'other') last.routes.push(...rest)
    else sections.push({ key: 'other', routes: rest })
  }

  sectionsCache.set(game.slug, sections)
  return sections
}

/**
 * Pokémon de uma rota, somando as áreas do local (andares de caverna, covis de raid) e
 * filtrando só as versões do jogo selecionado. Ordenados da maior chance pra menor.
 */
export function toRoutePokemon(dtos: readonly LocationAreaDto[], game: Game): RoutePokemon[] {
  const byPokemon = new Map<string, Accumulator>()

  for (const dto of dtos) {
    const domains = areaDomains(dto)
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

        const detailsByMethod = new Map<string, EncounterDetailDto[]>()
        for (const detail of versionDetail.encounter_details) {
          entry.minLevel = Math.min(entry.minLevel, detail.min_level)
          entry.maxLevel = Math.max(entry.maxLevel, detail.max_level)
          const list = detailsByMethod.get(detail.method.name) ?? []
          list.push(detail)
          detailsByMethod.set(detail.method.name, list)
        }
        const domain = domains.get(versionDetail.version.name) ?? new Map()
        for (const [method, details] of detailsByMethod) {
          const merged = entry.methods.get(method) ?? new Map<string, ConditionVariant>()
          for (const variant of methodVariants(details, domain)) {
            const key = variant.conditions.join('+')
            const chance = Math.min(variant.chance, MAX_CHANCE)
            if (chance > (merged.get(key)?.chance ?? -1)) merged.set(key, { ...variant, chance })
          }
          entry.methods.set(method, merged)
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
        .map(([slug, variants]) => toMethod(slug, [...variants.values()]))
        .sort((a, b) => b.chance - a.chance),
      onlyIn:
        game.versions.length > 1 && entry.versions.size === 1 ? [...entry.versions][0]! : null,
    }))
    .sort((a, b) => (b.methods[0]?.chance ?? 0) - (a.methods[0]?.chance ?? 0) || a.id - b.id)
}

/** Valores de hora/estação/dia vistos na área, por versão (ver `conditionDomain`). */
function areaDomains(dto: LocationAreaDto): Map<string, ConditionDomain> {
  const detailsByVersion = new Map<string, EncounterDetailDto[]>()
  for (const encounter of dto.pokemon_encounters) {
    for (const versionDetail of encounter.version_details) {
      const list = detailsByVersion.get(versionDetail.version.name) ?? []
      list.push(...versionDetail.encounter_details)
      detailsByVersion.set(versionDetail.version.name, list)
    }
  }
  return new Map(
    [...detailsByVersion].map(([version, details]) => [version, conditionDomain(details)]),
  )
}

/**
 * Sem condição nenhuma, só a chance (o chip de sempre); com condições, as variantes com a que
 * vale sempre primeiro. Sem variante (chance 0 em todo detalhe), o método aparece com 0%.
 */
function toMethod(slug: string, variants: ConditionVariant[]): RouteEncounterMethod {
  const chance = Math.max(0, ...variants.map((v) => v.chance))
  if (variants.every((v) => !v.conditions.length)) return { slug, chance }
  const sorted = [...variants].sort(
    (a, b) => Number(!!a.conditions.length) - Number(!!b.conditions.length) || b.chance - a.chance,
  )
  return { slug, chance, variants: sorted }
}
