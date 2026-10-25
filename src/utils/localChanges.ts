/**
 * Aviso de que a coleção mudou no aparelho (capturado, favorito, caçada…), para a sincronização
 * com a conta agendar um envio. Os stores chamam `notifyLocalChange` quando gravam; quem aplica
 * dados vindos da conta usa `withoutNotify`, para não reenviar o que acabou de receber.
 */

type Listener = () => void

const listeners = new Set<Listener>()
let muted = 0

export function onLocalChange(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notifyLocalChange(): void {
  if (muted) return
  for (const listener of listeners) listener()
}

export function withoutNotify(action: () => void): void {
  muted++
  try {
    action()
  } finally {
    muted--
  }
}
