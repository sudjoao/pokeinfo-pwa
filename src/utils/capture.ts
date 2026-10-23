/**
 * Chance de captura por arremesso, pelas fórmulas da Bulbapedia ("Catch rate"):
 *
 *   a = ((3 × HPmáx − 2 × HPatual) × taxa × bola) / (3 × HPmáx) × status
 *
 * Com a ≥ 255 a captura é certa; senão há checagens de balanço com chance b/65536 cada:
 * - Gen 3–4: b = 1048560 / √√(16711680 / a), com raízes inteiras, e 4 checagens;
 * - Gen 5:   b = 65536 / (255 / a)^(3/16), 3 checagens;
 * - Gen 6+:  o mesmo b, 4 checagens.
 *
 * Fica de fora (avisado na tela): captura crítica, grama escura (Gen 5), bônus de nível baixo e de
 * dificuldade (Gen 8/9), Poké Balls de Apricorn e o arredondamento a 1/4096 das Gens 5+.
 */

export type CaptureStatus = 'none' | 'sleep' | 'freeze' | 'paralysis' | 'poison' | 'burn'

export const CAPTURE_STATUSES: readonly CaptureStatus[] = [
  'none',
  'sleep',
  'freeze',
  'paralysis',
  'poison',
  'burn',
]

export function statusMultiplier(status: CaptureStatus, generation: number): number {
  if (status === 'sleep' || status === 'freeze') return generation >= 5 ? 2.5 : 2
  if (status === 'none') return 1
  return 1.5
}

/** Situação do arremesso que muda o multiplicador de algumas bolas. */
export interface CaptureSituation {
  generation: number
  /** Tipos do Pokémon selvagem (Net Ball). */
  types: readonly string[]
  level: number
  /** Turnos já passados na batalha (Timer Ball; 0 = primeiro turno, para a Quick Ball). */
  turns: number
  /** Noite ou caverna (Dusk Ball). */
  dark: boolean
  /** Na água: surfando, pescando ou mergulhando (Dive Ball). */
  water: boolean
  /** Já capturado neste jogo (Repeat Ball). */
  caught: boolean
}

export interface BallDefinition {
  slug: string
  /** Primeira geração em que existe. */
  since: number
  /** Condição usada pela bola (para a tela mostrar o controle certo). */
  uses?: 'types' | 'level' | 'turns' | 'dark' | 'water' | 'caught'
  multiplier: (situation: CaptureSituation) => number
}

const MASTER = Number.POSITIVE_INFINITY

export const BALLS: readonly BallDefinition[] = [
  { slug: 'poke-ball', since: 1, multiplier: () => 1 },
  { slug: 'great-ball', since: 1, multiplier: () => 1.5 },
  { slug: 'ultra-ball', since: 1, multiplier: () => 2 },
  { slug: 'master-ball', since: 1, multiplier: () => MASTER },
  {
    slug: 'net-ball',
    since: 3,
    uses: 'types',
    multiplier: (s) =>
      s.types.includes('water') || s.types.includes('bug') ? (s.generation >= 7 ? 3.5 : 3) : 1,
  },
  { slug: 'dive-ball', since: 3, uses: 'water', multiplier: (s) => (s.water ? 3.5 : 1) },
  {
    slug: 'nest-ball',
    since: 3,
    uses: 'level',
    multiplier: (s) =>
      s.generation >= 5
        ? s.level < 30
          ? (41 - s.level) / 10
          : 1
        : Math.max(1, (40 - s.level) / 10),
  },
  {
    slug: 'repeat-ball',
    since: 3,
    uses: 'caught',
    multiplier: (s) => (s.caught ? (s.generation >= 7 ? 3.5 : 3) : 1),
  },
  {
    slug: 'timer-ball',
    since: 3,
    uses: 'turns',
    multiplier: (s) =>
      s.generation >= 5
        ? Math.min(4, 1 + (s.turns * 1229) / 4096)
        : Math.min(4, (s.turns + 10) / 10),
  },
  {
    slug: 'quick-ball',
    since: 4,
    uses: 'turns',
    multiplier: (s) => (s.turns === 0 ? (s.generation >= 5 ? 5 : 4) : 1),
  },
  {
    slug: 'dusk-ball',
    since: 4,
    uses: 'dark',
    multiplier: (s) => (s.dark ? (s.generation >= 7 ? 3 : 3.5) : 1),
  },
  { slug: 'premier-ball', since: 3, multiplier: () => 1 },
  { slug: 'luxury-ball', since: 3, multiplier: () => 1 },
  { slug: 'heal-ball', since: 4, multiplier: () => 1 },
]

export function ballsInGeneration(generation: number): BallDefinition[] {
  return BALLS.filter((ball) => ball.since <= Math.max(generation, 3))
}

export interface CaptureInput {
  captureRate: number
  /** HP restante em fração do máximo (0 < hp ≤ 1). */
  hp: number
  ball: number
  status: CaptureStatus
  generation: number
}

/** Chance (0–1) de capturar num arremesso. */
export function captureProbability(input: CaptureInput): number {
  if (input.ball === MASTER) return 1
  // HP máximo fixo grande: o resultado depende só da fração (as divisões inteiras somem).
  const max = 3000
  const current = Math.max(1, Math.round(max * Math.min(1, Math.max(0, input.hp))))
  const a =
    (((3 * max - 2 * current) * input.captureRate * input.ball) / (3 * max)) *
    statusMultiplier(input.status, input.generation)
  if (a >= 255) return 1
  if (a <= 0) return 0
  if (input.generation <= 4) {
    const b = Math.floor(
      1048560 / Math.floor(Math.sqrt(Math.floor(Math.sqrt(Math.floor(16711680 / Math.floor(a)))))),
    )
    return Math.min(1, (b / 65536) ** 4)
  }
  const b = Math.floor(65536 / (255 / a) ** (3 / 16))
  return Math.min(1, (b / 65536) ** (input.generation === 5 ? 3 : 4))
}

/** Chance de já ter capturado em até `throws` arremessos. */
export function captureWithin(probability: number, throws: number): number {
  return 1 - (1 - probability) ** throws
}

/** Arremessos para chegar a `target` de chance (Infinity com chance 0). */
export function throwsFor(probability: number, target = 0.9): number {
  if (probability >= 1) return 1
  if (probability <= 0) return Number.POSITIVE_INFINITY
  return Math.ceil(Math.log(1 - target) / Math.log(1 - probability))
}
