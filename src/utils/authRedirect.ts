/**
 * Caminho para onde voltar depois do login. Só aceita caminhos do próprio app ("/team?t=..."):
 * um valor como "//site.com" ou "https://site.com" faria o login virar um redirecionamento aberto.
 */
export function safeNextPath(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/')) return '/'
  if (value.startsWith('//') || value.startsWith('/\\')) return '/'
  // Caracteres de controle (tab, quebra de linha) são ignorados pelo parser de URL do navegador.
  if ([...value].some((char) => char.charCodeAt(0) < 0x20)) return '/'
  if (value.startsWith('/auth/')) return '/'
  return value
}
