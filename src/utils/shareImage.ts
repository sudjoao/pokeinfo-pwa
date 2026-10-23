import type { PokemonStat, PokemonType } from '@/types/pokemon'
import {
  artworkSrc,
  formatDexNumber,
  formatPokemonName,
  TYPE_COLORS,
  TYPE_TEXT_COLORS,
} from './pokemon'

/**
 * Imagens PNG para compartilhar (time e Pokémon), desenhadas num canvas 2D sem bibliotecas.
 * O artwork vem do wsrv.nl com CORS (o mesmo do app), então o canvas não fica "sujo" e pode
 * virar arquivo. Tamanho 1200×630, o formato de prévia de link das redes.
 */

const WIDTH = 1200
const HEIGHT = 630
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
const BRAND = '#dc2626'

export interface ShareImageLabels {
  title: string
  subtitle?: string
  /** Rótulo de cada tipo no idioma atual. */
  type: (type: PokemonType) => string
  /** Rótulo curto de cada stat ("HP", "Atq"…), só na imagem do Pokémon. */
  stat?: (name: string) => string
  footer: string
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    // Sem artwork a imagem sai mesmo assim (só o espaço vazio), em vez de falhar inteira.
    image.onerror = () => resolve(null)
    image.src = src
  })
}

function canvas(): { element: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const element = document.createElement('canvas')
  element.width = WIDTH
  element.height = HEIGHT
  const ctx = element.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D indisponível')
  return { element, ctx }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Chip de tipo; devolve a largura usada. */
function typeChip(
  ctx: CanvasRenderingContext2D,
  type: PokemonType,
  label: string,
  x: number,
  y: number,
  size = 22,
): number {
  ctx.font = `600 ${size}px ${FONT}`
  const width = ctx.measureText(label).width + size * 1.2
  const height = size * 1.6
  roundRect(ctx, x, y, width, height, height / 2)
  ctx.fillStyle = TYPE_COLORS[type]
  ctx.fill()
  ctx.fillStyle = TYPE_TEXT_COLORS[type] ?? '#fff'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, x + size * 0.6, y + height / 2 + 1)
  return width
}

function header(ctx: CanvasRenderingContext2D, labels: ShareImageLabels): void {
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, WIDTH, HEIGHT)
  ctx.fillStyle = BRAND
  ctx.fillRect(0, 0, WIDTH, 96)
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'middle'
  ctx.font = `700 40px ${FONT}`
  ctx.fillText(labels.title, 48, 48)
  if (labels.subtitle) {
    ctx.font = `500 26px ${FONT}`
    const width = ctx.measureText(labels.subtitle).width
    ctx.fillText(labels.subtitle, WIDTH - 48 - width, 50)
  }
  ctx.fillStyle = '#64748b'
  ctx.font = `500 22px ${FONT}`
  ctx.fillText(labels.footer, 48, HEIGHT - 32)
}

function toBlob(element: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    element.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG falhou'))), 'image/png'),
  )
}

export interface ShareMember {
  id: number
  name: string
  types: readonly PokemonType[]
}

/** Até 6 membros em 3 colunas × 2 linhas: artwork, nome e tipos. */
export async function teamImage(
  members: readonly ShareMember[],
  labels: ShareImageLabels,
): Promise<Blob> {
  const { element, ctx } = canvas()
  header(ctx, labels)
  const images = await Promise.all(members.map((m) => loadImage(artworkSrc(m.id, 200))))
  const cardW = 352
  const cardH = 220
  const gap = 24
  const left = (WIDTH - (cardW * 3 + gap * 2)) / 2
  members.slice(0, 6).forEach((member, index) => {
    const x = left + (index % 3) * (cardW + gap)
    const y = 124 + Math.floor(index / 3) * (cardH + gap)
    roundRect(ctx, x, y, cardW, cardH, 24)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 2
    ctx.stroke()
    const image = images[index]
    if (image) ctx.drawImage(image, x + 16, y + 20, 180, 180)
    ctx.fillStyle = '#0f172a'
    ctx.textBaseline = 'alphabetic'
    ctx.font = `700 26px ${FONT}`
    const name = formatPokemonName(member.name)
    ctx.fillText(name.length > 12 ? `${name.slice(0, 11)}…` : name, x + 196, y + 80)
    member.types.forEach((type, i) =>
      typeChip(ctx, type, labels.type(type), x + 196, y + 100 + i * 44, 18),
    )
  })
  return toBlob(element)
}

export interface SharePokemon {
  id: number
  name: string
  types: readonly PokemonType[]
  stats: readonly PokemonStat[]
}

/** Artwork à esquerda; número, nome, tipos e barras de stats à direita. */
export async function pokemonImage(pokemon: SharePokemon, labels: ShareImageLabels): Promise<Blob> {
  const { element, ctx } = canvas()
  header(ctx, labels)
  const image = await loadImage(artworkSrc(pokemon.id, 240))
  roundRect(ctx, 48, 124, 440, 440, 32)
  ctx.fillStyle = `${TYPE_COLORS[pokemon.types[0] ?? 'normal']}33`
  ctx.fill()
  if (image) ctx.drawImage(image, 68, 144, 400, 400)

  const x = 536
  ctx.fillStyle = '#64748b'
  ctx.textBaseline = 'alphabetic'
  ctx.font = `600 26px ${FONT}`
  ctx.fillText(formatDexNumber(pokemon.id), x, 170)
  ctx.fillStyle = '#0f172a'
  ctx.font = `800 56px ${FONT}`
  ctx.fillText(formatPokemonName(pokemon.name), x, 230)
  let chipX = x
  for (const type of pokemon.types)
    chipX += typeChip(ctx, type, labels.type(type), chipX, 252, 22) + 12

  const barX = x + 110
  const barW = WIDTH - 48 - barX - 60
  pokemon.stats.forEach((stat, index) => {
    const y = 336 + index * 38
    ctx.fillStyle = '#475569'
    ctx.font = `600 22px ${FONT}`
    ctx.fillText(labels.stat?.(stat.name) ?? stat.name, x, y + 20)
    roundRect(ctx, barX, y + 4, barW, 18, 9)
    ctx.fillStyle = '#e2e8f0'
    ctx.fill()
    roundRect(ctx, barX, y + 4, Math.max(18, (barW * Math.min(stat.value, 200)) / 200), 18, 9)
    ctx.fillStyle = BRAND
    ctx.fill()
    ctx.fillStyle = '#0f172a'
    ctx.fillText(String(stat.value), barX + barW + 12, y + 20)
  })
  return toBlob(element)
}
