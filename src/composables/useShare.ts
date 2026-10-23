/**
 * Compartilha um link pela folha nativa (Web Share API, iPhone/Android) ou, sem ela, copia o link.
 * Devolve o que aconteceu para a tela avisar ("link copiado").
 */
export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

export async function shareLink(title: string, url: string): Promise<ShareResult> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, url })
      return 'shared'
    } catch (error) {
      // AbortError = a pessoa fechou a folha de compartilhamento.
      if ((error as DOMException)?.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
