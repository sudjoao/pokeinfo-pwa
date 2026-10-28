import { describe, expect, it } from 'vitest'
import { GAME_ROUTES } from '@/data/routes'
import { BDSP_ROUTES } from '@/data/routes-bdsp'
import { ROUTE_SECTIONS } from '@/data/routeOrder'
import { GAMES } from '@/data/games'
import { MAP_SECTIONS, loadRegionMap } from '@/data/maps'
import type { MapPoint, RegionMap } from '@/data/maps/types'
import {
  areaPath,
  existsInGame,
  linePath,
  mapLabel,
  pathMidpoint,
  routeBadgeText,
  splitLabel,
} from '@/utils/routeMap'

const allRoutes = { ...GAME_ROUTES, ...BDSP_ROUTES }
const gameSlugs = new Set(GAMES.map((game) => game.slug))

/** Jogos que usam o mapa da seção (ex.: "kanto" → RB, Yellow, FRLG, Let's Go e os de Johto). */
function gamesWithSection(key: string): string[] {
  return Object.entries(ROUTE_SECTIONS)
    .filter(([, sections]) => sections.some((section) => section.key === key))
    .map(([slug]) => slug)
}

const maps = new Map<string, RegionMap>()
for (const key of MAP_SECTIONS) maps.set(key, await loadRegionMap(key))

describe('routeBadgeText', () => {
  it('pega o número do fim do slug', () => {
    expect(routeBadgeText('kanto-route-1')).toBe('1')
    expect(routeBadgeText('kanto-sea-route-19')).toBe('19')
    expect(routeBadgeText('galar-route-10')).toBe('10')
    expect(routeBadgeText('kanto-underground-path')).toBeNull()
    expect(routeBadgeText('kanto-victory-road-2')).toBeNull()
  })
})

describe('mapLabel e splitLabel', () => {
  it('tira o prefixo da região, que no mapa dela sobra', () => {
    expect(mapLabel('kanto-safari-zone')).toBe('Safari Zone')
    expect(mapLabel('kanto-victory-road-2')).toBe('Victory Road 2')
    expect(mapLabel('pallet-town')).toBe('Pallet Town')
    expect(mapLabel('resort-area')).toBe('Resort Area')
    expect(mapLabel('galar-mine-no-2')).toBe('Galar Mine No 2')
    expect(mapLabel('verdant-cavern--trial-site')).toBe('Verdant Cavern Trial Site')
  })

  it('quebra nomes longos em duas linhas parecidas', () => {
    expect(splitLabel('Pallet Town')).toEqual(['Pallet Town'])
    expect(splitLabel('Pokemon Mansion')).toEqual(['Pokemon', 'Mansion'])
    expect(splitLabel('Altar of the Sunne')).toEqual(['Altar of', 'the Sunne'])
  })
})

describe('geometria', () => {
  it('pathMidpoint fica na metade do comprimento, mesmo com curva', () => {
    const path: MapPoint[] = [
      [0, 0],
      [10, 0],
      [10, 30],
    ]
    expect(pathMidpoint(path)).toEqual([10, 10])
  })

  it('linePath e areaPath montam caminhos SVG fechados quando é área', () => {
    expect(
      linePath([
        [0, 0],
        [5, 5],
      ]),
    ).toBe('M0 0 L5 5')
    const smooth = areaPath([
      [0, 0],
      [10, 0],
      [10, 10],
    ])
    expect(smooth.startsWith('M0 0 C')).toBe(true)
    expect(smooth.endsWith('Z')).toBe(true)
  })

  it('existsInGame: sem `only`, vale para todos', () => {
    expect(existsInGame({}, 'red-blue')).toBe(true)
    expect(existsInGame({ only: ['yellow'] }, 'red-blue')).toBe(false)
  })
})

describe.each(MAP_SECTIONS)('mapa %s', (key) => {
  const map = maps.get(key)!
  const games = gamesWithSection(key)

  it('a seção existe em algum jogo', () => {
    expect(games.length).toBeGreaterThan(0)
  })

  it.each(games)('%s: todo local com Pokémon da seção aparece no mapa', (slug) => {
    const withData = new Set(allRoutes[slug]!.map((route) => route.location))
    const sectionLocations = ROUTE_SECTIONS[slug]!.filter((s) => s.key === key).flatMap(
      (s) => s.locations,
    )
    const drawn = new Set<string>(map.offMap ?? [])
    for (const place of map.places) if (existsInGame(place, slug)) drawn.add(place.location)
    for (const route of map.routes) {
      if (route.location && existsInGame(route, slug)) drawn.add(route.location)
    }
    const missing = sectionLocations.filter((l) => withData.has(l) && !drawn.has(l))
    expect(missing).toEqual([])
  })

  it.each(games)('%s: nenhum local desenhado duas vezes', (slug) => {
    const locations = [
      ...map.places.filter((place) => existsInGame(place, slug)).map((place) => place.location),
      ...map.routes
        .filter((route) => route.location && existsInGame(route, slug))
        .map((route) => route.location!),
    ]
    const repeated = locations.filter((location, index) => locations.indexOf(location) !== index)
    expect(repeated).toEqual([])
  })

  it('`only` só cita jogos que usam este mapa', () => {
    const items = [...map.places, ...map.routes, ...map.areas, ...(map.captions ?? [])]
    const cited = items.flatMap((item) => item.only ?? [])
    expect(cited.filter((slug) => !gameSlugs.has(slug) || !games.includes(slug))).toEqual([])
  })

  it('pontos, rotas e placas ficam dentro do desenho', () => {
    const inside = ([x, y]: MapPoint) => x >= 0 && y >= 0 && x <= map.width && y <= map.height
    const outside = [
      ...map.places.filter((place) => !inside(place.at)).map((place) => place.location),
      ...map.routes
        .filter((route) => !route.path.every(inside) || (route.badge && !inside(route.badge)))
        .map((route) => route.location ?? JSON.stringify(route.path)),
    ]
    expect(outside).toEqual([])
  })

  it('rotas têm pelo menos dois pontos e áreas pelo menos três', () => {
    expect(map.routes.filter((route) => route.path.length < 2)).toEqual([])
    expect(map.areas.filter((area) => area.points.length < 3)).toEqual([])
  })

  it('lugares não ficam empilhados (a não ser em jogos diferentes)', () => {
    const clashes: string[] = []
    for (const slug of games) {
      const places = map.places.filter((place) => existsInGame(place, slug))
      places.forEach((a, i) =>
        places.slice(i + 1).forEach((b) => {
          if (Math.hypot(a.at[0] - b.at[0], a.at[1] - b.at[1]) < 16) {
            clashes.push(`${slug}: ${a.location} × ${b.location}`)
          }
        }),
      )
    }
    expect([...new Set(clashes)]).toEqual([])
  })
})
