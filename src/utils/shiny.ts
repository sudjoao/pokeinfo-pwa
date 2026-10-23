/**
 * Chance de shiny por encontro na série principal (sem eventos, surtos ou sanduíches).
 * Base 1/8192 até a 5ª geração e 1/4096 da 6ª em diante; cada bônus soma tentativas:
 * Shiny Charm +2 (existe desde Black 2 / White 2), Masuda +4 na 4ª e +5 da 5ª em diante.
 * Na 1ª geração não há shiny.
 */
export interface ShinyOdds {
  /** Tentativas por encontro. */
  rolls: number
  /** Denominador da chance base (8192 ou 4096). */
  base: number
  /** Chance por encontro (0..1). */
  chance: number
  /** "1 em N", arredondado. */
  oneIn: number
}

export function hasShinies(generation: number): boolean {
  return generation >= 2
}

export function hasShinyCharm(generation: number): boolean {
  return generation >= 5
}

export function hasMasuda(generation: number): boolean {
  return generation >= 4
}

export function shinyOdds(generation: number, charm: boolean, masuda: boolean): ShinyOdds {
  const base = generation <= 5 ? 8192 : 4096
  const rolls =
    1 +
    (charm && hasShinyCharm(generation) ? 2 : 0) +
    (masuda && hasMasuda(generation) ? (generation >= 5 ? 5 : 4) : 0)
  const chance = 1 - (1 - 1 / base) ** rolls
  return { rolls, base, chance, oneIn: Math.round(1 / chance) }
}

/** Probabilidade de já ter visto ao menos um shiny depois de `encounters` encontros. */
export function chanceByNow(odds: ShinyOdds, encounters: number): number {
  return 1 - (1 - odds.chance) ** encounters
}
