/**
 * Tempo de exibição de um aviso (snackbar). Textos curtos somem em 4 s; os longos (como o link
 * ou o texto cru mostrados quando a cópia falha) ficam até a pessoa fechar, para dar tempo de ler.
 */
export function noticeTimeout(text: string | null): number {
  return text && text.length > 60 ? -1 : 4000
}
