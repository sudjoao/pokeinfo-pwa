import type { StatName } from '@/types/pokemon'

/**
 * Faixa do stat num nível (fórmula da 3ª geração em diante). Mínimo: 0 IV, 0 EV, natureza que
 * reduz; máximo: 31 IV, 252 EV, natureza que aumenta. HP não tem natureza; Shedinja tem sempre 1.
 */
export function statRange(
  name: StatName,
  base: number,
  level: number,
): { min: number; max: number } {
  const core = (iv: number, ev: number) =>
    Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100)
  if (name === 'hp') {
    if (base === 1) return { min: 1, max: 1 }
    return { min: core(0, 0) + level + 10, max: core(31, 252) + level + 10 }
  }
  return {
    min: Math.floor((core(0, 0) + 5) * 0.9),
    max: Math.floor((core(31, 252) + 5) * 1.1),
  }
}

/**
 * Chance aproximada de captura numa tentativa (fórmula da 3ª/4ª geração, sem status): com HP
 * cheio `a = taxa × bola / 3`, com 1 HP `a ≈ taxa × bola`; a chance é `a / 255`, limitada a 100%.
 */
export function captureChance(captureRate: number, hpRatio: 'full' | 'min', ball = 1): number {
  const a = hpRatio === 'full' ? (captureRate * ball) / 3 : captureRate * ball
  return Math.min(1, a / 255)
}

/** Passos para chocar o ovo: ciclos × 257 (a partir da 4ª geração; antes eram 256). */
export function eggSteps(hatchCounter: number): number {
  return hatchCounter * 257
}
