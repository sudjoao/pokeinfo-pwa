import type { StatName } from '@/types/pokemon'

/** Efeito da natureza no stat: 110 (sobe), 90 (desce) ou 100, em centésimos, como nos jogos. */
export type NatureEffect = 110 | 100 | 90

/**
 * Stat real (fórmula da 3ª geração em diante). HP não tem natureza; Shedinja tem sempre 1.
 * A natureza é aplicada com divisão inteira (×110/100), igual aos jogos, sem erro de ponto
 * flutuante do ×1,1.
 */
export function statValue(
  name: StatName,
  base: number,
  level: number,
  iv: number,
  ev: number,
  nature: NatureEffect = 100,
): number {
  const core = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100)
  if (name === 'hp') return base === 1 ? 1 : core + level + 10
  return Math.floor(((core + 5) * nature) / 100)
}

/**
 * Faixa do stat num nível. Mínimo: 0 IV, 0 EV, natureza que reduz; máximo: 31 IV, 252 EV,
 * natureza que aumenta.
 */
export function statRange(
  name: StatName,
  base: number,
  level: number,
): { min: number; max: number } {
  return {
    min: statValue(name, base, level, 0, 0, 90),
    max: statValue(name, base, level, 31, 252, 110),
  }
}

/** IVs (0–31) que dão exatamente o stat informado; vazio quando nenhum dá (dado inconsistente). */
export function possibleIvs(
  name: StatName,
  base: number,
  level: number,
  ev: number,
  nature: NatureEffect,
  actual: number,
): number[] {
  const ivs: number[] = []
  for (let iv = 0; iv <= 31; iv++) {
    if (statValue(name, base, level, iv, ev, nature) === actual) ivs.push(iv)
  }
  return ivs
}

/**
 * Aplica a característica ("Loves to eat"): o stat dela tem o maior IV, e esse IV deixa o resto
 * `mod5` na divisão por 5. Os outros stats não podem passar do maior IV possível do stat dela.
 * Empates entre IVs máximos dependem da personalidade do Pokémon e não são tratados.
 */
export function applyCharacteristic(
  ivs: Readonly<Record<StatName, number[]>>,
  stat: StatName,
  mod5: number,
): Record<StatName, number[]> {
  const result = { ...ivs } as Record<StatName, number[]>
  result[stat] = ivs[stat].filter((iv) => iv % 5 === mod5)
  const highest = Math.max(-1, ...result[stat])
  for (const name of Object.keys(result) as StatName[]) {
    if (name !== stat) result[name] = result[name].filter((iv) => iv <= highest)
  }
  return result
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
