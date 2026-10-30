/**
 * Líderes, Elite 4 e campeão de cada jogo, a partir dos arquivos gerados em
 * `data/generated/trainers/` (um por jogo, ver scripts/gen-trainers.mjs). Cada arquivo vira um
 * chunk próprio e só é baixado quando a aba "Líderes" abre aquele jogo. Fica separado de
 * `utils/trainers.ts` (que puxa a tabela de golpes) porque a Home importa `hasLeague`.
 */
import type { LeagueSection } from '@/types/trainers'

type LeagueModule = { LEAGUE: readonly LeagueSection[] }

const loaders = import.meta.glob<LeagueModule>('../data/generated/trainers/*.ts')

/** "../data/generated/trainers/emerald.ts" -> loader */
const loaderByGame = new Map(
  Object.entries(loaders).map(([path, load]) => [path.replace(/^.*\/|\.ts$/g, ''), load]),
)

/** Jogos com a aba "Líderes" (Legends: Arceus e Z-A não têm ginásios). */
export function hasLeague(game: string): boolean {
  return loaderByGame.has(game)
}

const cache = new Map<string, Promise<readonly LeagueSection[]>>()

export function loadLeague(game: string): Promise<readonly LeagueSection[]> {
  const load = loaderByGame.get(game)
  if (!load) return Promise.resolve([])
  let promise = cache.get(game)
  if (!promise) {
    promise = load().then((module) => module.LEAGUE)
    // Falha de rede não fica guardada: a próxima tentativa baixa de novo.
    promise.catch(() => cache.delete(game))
    cache.set(game, promise)
  }
  return promise
}
