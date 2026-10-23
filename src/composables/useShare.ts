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

/** Compartilha um texto (ex.: o resultado do Pokémon do dia) ou, sem a folha nativa, copia. */
export async function shareText(text: string): Promise<ShareResult> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text })
      return 'shared'
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}

/**
 * Compartilha um arquivo (ex.: a imagem do time) pela folha nativa; onde não dá para mandar
 * arquivos (Firefox, desktop sem Web Share), baixa o arquivo.
 */
export async function shareFile(
  blob: Blob,
  fileName: string,
  title: string,
): Promise<ShareResult | 'downloaded'> {
  const file = new File([blob], fileName, { type: blob.type })
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title })
      return 'shared'
    } catch (error) {
      if ((error as DOMException)?.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return 'downloaded'
  } catch {
    return 'failed'
  }
}
