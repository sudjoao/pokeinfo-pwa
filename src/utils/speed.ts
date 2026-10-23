import { statValue } from './stats'

/** Velocidade num nível nos 4 cenários de sempre (como nas tabelas de speed tiers do Smogon). */
export interface SpeedValues {
  /** 0 IV, 0 EV, natureza que reduz. */
  min: number
  /** 31 IV, 0 EV, natureza neutra. */
  neutral: number
  /** 31 IV, 252 EV, natureza neutra. */
  max: number
  /** 31 IV, 252 EV, natureza que aumenta (Jolly, Timid…). */
  maxPlus: number
}

export interface SpeedModifiers {
  scarf: boolean
  tailwind: boolean
  /** Estágios de Velocidade (−6 a +6): +1 = ×1,5, −1 = ×2/3. */
  stage: number
}

export const NO_MODIFIERS: SpeedModifiers = { scarf: false, tailwind: false, stage: 0 }

export function stageMultiplier(stage: number): number {
  const s = Math.max(-6, Math.min(6, Math.round(stage)))
  return s >= 0 ? (2 + s) / 2 : 2 / (2 - s)
}

export function speedMultiplier(modifiers: SpeedModifiers): number {
  return (
    (modifiers.scarf ? 1.5 : 1) * (modifiers.tailwind ? 2 : 1) * stageMultiplier(modifiers.stage)
  )
}

export function speedValues(
  base: number,
  level: number,
  modifiers: SpeedModifiers = NO_MODIFIERS,
): SpeedValues {
  const multiplier = speedMultiplier(modifiers)
  const apply = (value: number) => Math.floor(value * multiplier)
  return {
    min: apply(statValue('speed', base, level, 0, 0, 90)),
    neutral: apply(statValue('speed', base, level, 31, 0, 100)),
    max: apply(statValue('speed', base, level, 31, 252, 100)),
    maxPlus: apply(statValue('speed', base, level, 31, 252, 110)),
  }
}
