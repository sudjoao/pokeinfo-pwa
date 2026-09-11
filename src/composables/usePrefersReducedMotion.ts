/** Lido sob demanda (não reativo) para pular animações via JS sem depender do @vueuse/core inteiro. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
