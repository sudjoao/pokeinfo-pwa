import type { MapArea, MapAreaKind, MapPoint, RegionMap } from '@/data/maps/types'
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
  let d = `M${round(points[0]![0])} ${round(points[0]![1])}`
  for (const [, [c1x, c1y], [c2x, c2y], [x, y]] of curveSegments(points)) {
    d += ` C${round(c1x)} ${round(c1y)} ${round(c2x)} ${round(c2y)} ${round(x)} ${round(y)}`
  }
  return `${d} Z`
}

/** Trechos de Bézier cúbica (início, controle 1, controle 2, fim) da Catmull-Rom fechada. */
function curveSegments(points: readonly MapPoint[]): [MapPoint, MapPoint, MapPoint, MapPoint][] {
  const n = points.length
  const at = (index: number) => points[(index + n) % n]!
  return points.map((_, i) => {
    const [x0, y0] = at(i - 1)
    const [x1, y1] = at(i)
    const [x2, y2] = at(i + 1)
    const [x3, y3] = at(i + 2)
    return [
      [x1, y1],
      [x1 + (x2 - x0) / 6, y1 + (y2 - y0) / 6],
      [x2 - (x3 - x1) / 6, y2 - (y3 - y1) / 6],
      [x2, y2],
    ]
  })
}

/** Pontos por trecho de curva ao transformar o contorno suave num polígono. */
const CURVE_SAMPLES = 8

/**
 * O mesmo contorno de `areaPath`, como polígono: as curvas viram `CURVE_SAMPLES` pontos cada.
 * Serve para saber o que fica dentro da mancha sem depender do canvas do navegador.
 */
export function areaPolygon(points: readonly MapPoint[], smooth = true): MapPoint[] {
  if (points.length < 3 || !smooth) return [...points]
  const polygon: MapPoint[] = []
  for (const [[x1, y1], [c1x, c1y], [c2x, c2y], [x2, y2]] of curveSegments(points)) {
    for (let s = 0; s < CURVE_SAMPLES; s++) {
      const t = s / CURVE_SAMPLES
      const u = 1 - t
      polygon.push([
        u * u * u * x1 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x2,
        u * u * u * y1 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y2,
      ])
    }
  }
  return polygon
}

/** Tipos de bloco do estilo clássico: as manchas do mapa, mais a água rasa em volta da terra. */
export type PixelTileKind = Exclude<MapAreaKind, 'water'> | 'shallows'

/**
 * Terreno do estilo clássico: as manchas viram blocos de `cell` unidades, como no mapa de bolso
 * dos jogos. Cada bloco fica com a última mancha que cobre o centro dele (a mesma ordem de
 * pintura do estilo esquemático); `water` (lagos) volta a ser mar, e o mar que encosta na terra
 * vira água rasa. Devolve um caminho SVG por tipo, com os blocos de cada linha emendados.
 */
export function pixelTerrain(
  map: Pick<RegionMap, 'width' | 'height' | 'areas'>,
  gameSlug: string,
  cell: number,
): Partial<Record<PixelTileKind, string>> {
  const cols = Math.ceil(map.width / cell)
  const rows = Math.ceil(map.height / cell)
  const areas = map.areas.filter((area) => existsInGame(area, gameSlug))
  const kinds: (MapAreaKind | null)[] = [null, ...new Set(areas.map((area) => area.kind))]
  const grid = new Uint8Array(cols * rows)
  for (const area of areas) fillArea(grid, cols, rows, cell, area, kinds.indexOf(area.kind))

  const isLand = (col: number, row: number) => {
    if (col < 0 || row < 0 || col >= cols || row >= rows) return false
    const kind = kinds[grid[row * cols + col]!]
    return !!kind && kind !== 'water'
  }
  const tileAt = (col: number, row: number): PixelTileKind | null => {
    if (isLand(col, row)) return kinds[grid[row * cols + col]!] as PixelTileKind
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) if (isLand(col + dx, row + dy)) return 'shallows'
    return null
  }

  const paths: Partial<Record<PixelTileKind, string>> = {}
  for (let row = 0; row < rows; row++) {
    let start = 0
    let current = tileAt(0, row)
    for (let col = 1; col <= cols; col++) {
      const kind = col < cols ? tileAt(col, row) : null
      if (kind === current) continue
      if (current) {
        const run = `M${start * cell} ${row * cell}h${(col - start) * cell}v${cell}h${(start - col) * cell}z`
        paths[current] = (paths[current] ?? '') + run
      }
      start = col
      current = kind
    }
  }
  return paths
}

/** Marca na grade os blocos cujo centro cai dentro da mancha (varredura por linha, par-ímpar). */
function fillArea(
  grid: Uint8Array,
  cols: number,
  rows: number,
  cell: number,
  area: MapArea,
  value: number,
): void {
  const polygon = areaPolygon(area.points, area.smooth)
  for (let row = 0; row < rows; row++) {
    const y = (row + 0.5) * cell
    const crossings: number[] = []
    for (let i = 0; i < polygon.length; i++) {
      const [x0, y0] = polygon[i]!
      const [x1, y1] = polygon[(i + 1) % polygon.length]!
      if (y0 <= y !== y1 <= y) crossings.push(x0 + ((y - y0) / (y1 - y0)) * (x1 - x0))
    }
    crossings.sort((a, b) => a - b)
    for (let i = 0; i + 1 < crossings.length; i += 2) {
      const first = Math.max(0, Math.ceil(crossings[i]! / cell - 0.5))
      const last = Math.min(cols - 1, Math.floor(crossings[i + 1]! / cell - 0.5))
      for (let col = first; col <= last; col++) grid[row * cols + col] = value
    }
  }
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
