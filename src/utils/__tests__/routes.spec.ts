import { describe, expect, it } from 'vitest'
import { GAME_ROUTES } from '@/data/routes'
import { BDSP_ROUTES } from '@/data/routes-bdsp'
import { ROUTE_GAMES } from '@/data/routeGames'
import { ROUTE_SECTIONS } from '@/data/routeOrder'
import { GAMES } from '@/data/games'
import { routeSectionsForGame } from '@/utils/routes'

describe('ROUTE_GAMES', () => {
  it('lista exatamente os jogos com rotas nos dois arquivos de dados', () => {
    const withRoutes = Object.entries({ ...GAME_ROUTES, ...BDSP_ROUTES })
      .filter(([, routes]) => routes.length > 0)
      .map(([slug]) => slug)
    expect([...ROUTE_GAMES].sort()).toEqual(withRoutes.sort())
  })
})

describe('ROUTE_SECTIONS', () => {
  const allRoutes = { ...GAME_ROUTES, ...BDSP_ROUTES }

  it.each(Object.keys(allRoutes))('%s: todo local com dado está na ordem do jogo', (slug) => {
    const ordered = new Set((ROUTE_SECTIONS[slug] ?? []).flatMap((s) => s.locations))
    const missing = allRoutes[slug]!.map((r) => r.location).filter((l) => !ordered.has(l))
    expect(missing).toEqual([])
  })

  it.each(Object.keys(ROUTE_SECTIONS))('%s: nenhum local repetido entre as seções', (slug) => {
    const locations = ROUTE_SECTIONS[slug]!.flatMap((s) => s.locations)
    expect(locations.length).toBe(new Set(locations).size)
  })
})

describe('routeSectionsForGame', () => {
  const game = (slug: string) => GAMES.find((g) => g.slug === slug)!

  it('Red/Blue segue a história: Pallet Town, Route 1, Viridian…', () => {
    const sections = routeSectionsForGame(game('red-blue'))
    expect(sections.map((s) => s.key)).toEqual(['kanto'])
    const locations = sections[0]!.routes.map((r) => r.location)
    expect(locations.slice(0, 6)).toEqual([
      'pallet-town',
      'kanto-route-1',
      'viridian-city',
      'kanto-route-22',
      'kanto-route-2',
      'viridian-forest',
    ])
    expect(locations.indexOf('viridian-forest')).toBeLessThan(locations.indexOf('mt-moon'))
  })

  it('HGSS separa Johto, Kanto e os encontros fora do mapa', () => {
    const sections = routeSectionsForGame(game('heartgold-soulsilver'))
    expect(sections.map((s) => s.key)).toEqual(['johto', 'kanto', 'other'])
    expect(sections[0]!.routes[0]!.location).toBe('new-bark-town')
  })

  it('Black 2/White 2 começa em Aspertia', () => {
    expect(routeSectionsForGame(game('black-2-white-2'))[0]!.routes[0]!.location).toBe(
      'aspertia-city',
    )
  })
})
