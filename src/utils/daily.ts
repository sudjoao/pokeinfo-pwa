/**
 * "Pokémon do dia": a mesma resposta para todo mundo no mesmo dia, sem servidor. O dia (data
 * local) escolhe uma posição numa permutação fixa das espécies 1–1025, embaralhada uma vez por um
 * gerador com semente fixa: a resposta só se repete depois de 1025 dias (~2 anos e 9 meses).
 */

/** Espécies sorteáveis (a Pokédex Nacional atual). */
export const DAILY_SPECIES = 1025
/** Palpites por partida. */
export const DAILY_MAX_GUESSES = 8
/** Dia 1 do jogo (data de lançamento); dias anteriores contam como o 1. */
const EPOCH = Date.UTC(2026, 9, 23)
const SEED = 0x9e3779b9
const DAY_MS = 24 * 60 * 60 * 1000

/** Data local no formato "2026-10-24" (o dia vira à meia-noite do aparelho). */
export function dayKey(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Número do desafio: 1 no lançamento, +1 por dia. */
export function dayNumber(key: string): number {
  const [year, month, day] = key.split('-').map(Number)
  const days = Math.round((Date.UTC(year!, month! - 1, day!) - EPOCH) / DAY_MS)
  return Math.max(1, days + 1)
}

/** Gerador pseudoaleatório pequeno e determinístico (mulberry32). */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let order: number[] | null = null

/** Espécies 1–1025 embaralhadas sempre do mesmo jeito (Fisher–Yates com semente fixa). */
export function dailyOrder(): readonly number[] {
  if (order) return order
  const random = mulberry32(SEED)
  const list = Array.from({ length: DAILY_SPECIES }, (_, i) => i + 1)
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[list[i], list[j]] = [list[j]!, list[i]!]
  }
  order = list
  return order
}

export function dailyAnswer(key: string): number {
  const list = dailyOrder()
  return list[(dayNumber(key) - 1) % list.length]!
}

/** O que o jogo compara entre o palpite e a resposta. */
export interface DailyFacts {
  id: number
  generation: number
  types: readonly [string, string | null]
  /** Decímetros e hectogramas (como na PokéAPI), para comparar sem arredondar. */
  height: number
  weight: number
  total: number
}

export type Direction = 'equal' | 'higher' | 'lower'
export type TypeClue = 'correct' | 'swapped' | 'wrong'

export interface DailyClues {
  generation: Direction
  type1: TypeClue
  type2: TypeClue
  height: Direction
  weight: Direction
  total: Direction
}

/** "higher" = a resposta é maior que o palpite (a seta aponta para onde ir). */
function direction(guess: number, answer: number): Direction {
  if (guess === answer) return 'equal'
  return answer > guess ? 'higher' : 'lower'
}

function typeClue(guess: string | null, answer: string | null, other: string | null): TypeClue {
  if (guess === answer) return 'correct'
  if (guess !== null && guess === other) return 'swapped'
  return 'wrong'
}

export function compareFacts(guess: DailyFacts, answer: DailyFacts): DailyClues {
  return {
    generation: direction(guess.generation, answer.generation),
    type1: typeClue(guess.types[0], answer.types[0], answer.types[1]),
    type2: typeClue(guess.types[1], answer.types[1], answer.types[0]),
    height: direction(guess.height, answer.height),
    weight: direction(guess.weight, answer.weight),
    total: direction(guess.total, answer.total),
  }
}

const DIRECTION_EMOJI: Record<Direction, string> = { equal: '🟩', higher: '🔼', lower: '🔽' }
const TYPE_EMOJI: Record<TypeClue, string> = { correct: '🟩', swapped: '🟨', wrong: '🟥' }

/** Uma linha de emojis por palpite (sem revelar nomes), no estilo dos jogos diários. */
export function emojiGrid(clues: readonly DailyClues[]): string {
  return clues
    .map((c) =>
      [
        DIRECTION_EMOJI[c.generation],
        TYPE_EMOJI[c.type1],
        TYPE_EMOJI[c.type2],
        DIRECTION_EMOJI[c.height],
        DIRECTION_EMOJI[c.weight],
        DIRECTION_EMOJI[c.total],
      ].join(''),
    )
    .join('\n')
}

export interface DailyStats {
  played: number
  won: number
  streak: number
  best: number
  /** Dia da última vitória, para a sequência só continuar em dias seguidos. */
  lastWon: string | null
  /** Vitórias por número de palpites (índice 0 = acertou no 1º). */
  distribution: number[]
}

export const EMPTY_STATS: DailyStats = {
  played: 0,
  won: 0,
  streak: 0,
  best: 0,
  lastWon: null,
  distribution: Array.from({ length: DAILY_MAX_GUESSES }, () => 0),
}

/** Dia anterior a `key` ("2026-10-24" -> "2026-10-23"). */
export function previousDay(key: string): string {
  const [year, month, day] = key.split('-').map(Number)
  return dayKey(new Date(year!, month! - 1, day! - 1))
}

/** Estatísticas depois de terminar o desafio de `key` (vitória com `guesses` palpites ou derrota). */
export function recordResult(
  stats: DailyStats,
  key: string,
  won: boolean,
  guesses: number,
): DailyStats {
  const distribution = [...stats.distribution]
  if (won) distribution[guesses - 1] = (distribution[guesses - 1] ?? 0) + 1
  const streak = won ? (stats.lastWon === previousDay(key) ? stats.streak + 1 : 1) : 0
  return {
    played: stats.played + 1,
    won: stats.won + (won ? 1 : 0),
    streak,
    best: Math.max(stats.best, streak),
    lastWon: won ? key : stats.lastWon,
    distribution,
  }
}

/** Partida do dia em andamento (ou já terminada): os ids chutados, em ordem. */
export interface DailyGame {
  day: string
  guesses: number[]
  done: boolean
}

export interface PersistedDaily {
  stats: DailyStats
  game: DailyGame | null
}

function isStats(value: unknown): value is DailyStats {
  const stats = value as DailyStats
  return (
    typeof stats?.played === 'number' &&
    typeof stats.won === 'number' &&
    Array.isArray(stats.distribution)
  )
}

/** Lê o que veio do aparelho ou de um backup, descartando o que não tem o formato esperado. */
export function parseDaily(value: unknown): PersistedDaily | null {
  const data = value as Partial<PersistedDaily> | null
  if (!data || !isStats(data.stats)) return null
  const game = data.game
  const validGame =
    game && typeof game.day === 'string' && Array.isArray(game.guesses) ? game : null
  return {
    stats: { ...EMPTY_STATS, ...data.stats },
    game: validGame
      ? { day: validGame.day, guesses: validGame.guesses, done: !!validGame.done }
      : null,
  }
}
