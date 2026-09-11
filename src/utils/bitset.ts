/**
 * Codificação compacta de um conjunto de números pequenos (ids de espécie, 1..~1025)
 * como vetor de bits em base64. Um jogo inteiro cabe em ~170 caracteres,
 * contra alguns KB de um array de ids ou de um dicionário `{id: 1}`.
 */

/** Serializa o conjunto: o bit `id` fica ligado no byte `id >> 3`. */
export function encodeBitset(ids: ReadonlySet<number>): string {
  let max = -1
  for (const id of ids) if (id > max) max = id
  if (max < 0) return ''

  const bytes = new Uint8Array((max >> 3) + 1)
  for (const id of ids) bytes[id >> 3]! |= 1 << (id & 7)

  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/** Reconstrói o conjunto a partir do texto gerado por `encodeBitset`. */
export function decodeBitset(encoded: string): Set<number> {
  const ids = new Set<number>()
  if (!encoded) return ids

  let binary: string
  try {
    binary = atob(encoded)
  } catch {
    return ids
  }

  for (let i = 0; i < binary.length; i++) {
    const byte = binary.charCodeAt(i)
    if (!byte) continue
    for (let bit = 0; bit < 8; bit++) {
      if (byte & (1 << bit)) ids.add((i << 3) | bit)
    }
  }
  return ids
}
