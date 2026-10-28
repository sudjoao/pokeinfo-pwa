import type { MapPoint, RegionMap } from '@/data/maps/types'
import { formatAreaName } from './encounters'

/** Número da placa de uma rota ("kanto-sea-route-19" → "19"); null quando o slug não tem número. */
export function routeBadgeText(location: string): string | null {
  return /(?:^|-)route-(\d+)$/.exec(location)?.[1] ?? null
}

/**
 * Prefixo de região nos slugs da PokéAPI ("kanto-safari-zone"): no mapa da região, sobra. Fica
 * quando faz parte do nome próprio ("Galar Mine", que sem ele viraria só "Mine").
 */
const REGION_PREFIX = /^(?:kanto|johto|hoenn|sinnoh|unova|kalos|alola|galar)-(?=.)(?!mine\b)/

/** Nome curto para o rótulo no mapa ("kanto-victory-road-2" → "Victory Road 2"). */
export function mapLabel(location: string): string {
  // "verdant-cavern--trial-site": o hífen duplo viraria um espaço duplo (e uma linha vazia).
  const name = formatAreaName(location.replace(REGION_PREFIX, '').replace(/-{2,}/g, '-'))
  // `formatAreaName` tira o "-area" das áreas da API; aqui o slug é do local ("resort-area").
  return location.endsWith('-area') ? `${name} Area` : name
}

/** Acima disso o nome quebra em duas linhas, para não cobrir os vizinhos. */
const MAX_LINE = 13

/** Quebra o nome em até duas linhas, no espaço que deixa as duas mais parecidas. */
export function splitLabel(name: string): string[] {
  if (name.length <= MAX_LINE || !name.includes(' ')) return [name]
  let best = -1
  for (let i = name.indexOf(' '); i !== -1; i = name.indexOf(' ', i + 1)) {
    if (best === -1 || Math.abs(name.length / 2 - i) < Math.abs(name.length / 2 - best)) best = i
  }
  return [name.slice(0, best), name.slice(best + 1)]
}

/** Linha reta entre os pontos (as curvas das estradas ficam nos próprios pontos). */
export function linePath(points: readonly MapPoint[]): string {
  return points.map(([x, y], index) => `${index ? 'L' : 'M'}${round(x)} ${round(y)}`).join(' ')
}

/**
 * Contorno fechado e suave passando por todos os pontos (Catmull-Rom convertido em Bézier
 * cúbica), para a costa e o relevo não parecerem polígonos. Sem `smooth`, fica com as quinas.
 */
export function areaPath(points: readonly MapPoint[], smooth = true): string {
  if (points.length < 3 || !smooth) return `${linePath(points)} Z`
  const n = points.length
  const at = (index: number) => points[(index + n) % n]!
  let d = `M${round(at(0)[0])} ${round(at(0)[1])}`
  for (let i = 0; i < n; i++) {
    const [x0, y0] = at(i - 1)
    const [x1, y1] = at(i)
    const [x2, y2] = at(i + 1)
    const [x3, y3] = at(i + 2)
    const c1x = x1 + (x2 - x0) / 6
    const c1y = y1 + (y2 - y0) / 6
    const c2x = x2 - (x3 - x1) / 6
    const c2y = y2 - (y3 - y1) / 6
    d += ` C${round(c1x)} ${round(c1y)} ${round(c2x)} ${round(c2y)} ${round(x2)} ${round(y2)}`
  }
  return `${d} Z`
}

/** Ponto na metade do comprimento do caminho (lugar padrão da placa da rota). */
export function pathMidpoint(points: readonly MapPoint[]): MapPoint {
  if (points.length < 2) return points[0] ?? [0, 0]
  const lengths = points.slice(1).map((point, i) => distance(points[i]!, point))
  let remaining = lengths.reduce((sum, length) => sum + length, 0) / 2
  for (let i = 0; i < lengths.length; i++) {
    const length = lengths[i]!
    if (remaining <= length && length > 0) {
      const [x0, y0] = points[i]!
      const [x1, y1] = points[i + 1]!
      const ratio = remaining / length
      return [x0 + (x1 - x0) * ratio, y0 + (y1 - y0) * ratio]
    }
    remaining -= length
  }
  return points[points.length - 1]!
}

/** O item existe no jogo: sem `only`, existe em todos os jogos que usam o mapa. */
export function existsInGame(item: { only?: readonly string[] }, gameSlug: string): boolean {
  return !item.only || item.only.includes(gameSlug)
}

/** Todos os locais que o mapa mostra (pontos, rotas com placa e botões fora do desenho). */
export function mapLocations(map: RegionMap): Set<string> {
  const locations = new Set<string>(map.offMap ?? [])
  for (const place of map.places) locations.add(place.location)
  for (const route of map.routes) if (route.location) locations.add(route.location)
  return locations
}

function distance([x0, y0]: MapPoint, [x1, y1]: MapPoint): number {
  return Math.hypot(x1 - x0, y1 - y0)
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}
