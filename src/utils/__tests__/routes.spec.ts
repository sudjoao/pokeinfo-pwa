import { describe, expect, it } from 'vitest'
import { GAME_ROUTES } from '@/data/routes'
import { BDSP_ROUTES } from '@/data/routes-bdsp'
import { ROUTE_GAMES } from '@/data/routeGames'

describe('ROUTE_GAMES', () => {
  it('lista exatamente os jogos com rotas nos dois arquivos de dados', () => {
    const withRoutes = Object.entries({ ...GAME_ROUTES, ...BDSP_ROUTES })
      .filter(([, routes]) => routes.length > 0)
      .map(([slug]) => slug)
    expect([...ROUTE_GAMES].sort()).toEqual(withRoutes.sort())
  })
})
