/**
 * Roda quando o navegador estiver ocioso, depois do trabalho da primeira pintura. O Safari não tem
 * requestIdleCallback: lá espera alguns segundos.
 */
export function whenIdle(run: () => void): void {
  if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 10_000 })
  else setTimeout(run, 3000)
}
