/**
 * Normalização das buscas por nome de Pokémon. Os nomes do índice são os slugs da PokéAPI
 * ("mr-mime", "flabebe", "ho-oh"), mas a pessoa digita como vê na tela ("Mr Mime", "Flabébé",
 * "Ho Oh", "mr. mime", "farfetch'd"): a comparação é feita com os dois lados nesta forma.
 */

/** Minúsculas, sem acentos, e espaço/ponto/apóstrofo/dois-pontos virando hífen ("mr. mime" -> "mr-mime"). */
export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[\s.'’:_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Busca numérica: "25", "#25", "nº 025", "no. 25" e "n° 25" viram 25. Devolve null quando a busca
 * não é um número.
 */
export function searchNumber(text: string): number | null {
  const match = /^(?:#|n[oº°]\.?\s*)?(\d{1,4})$/i.exec(text.trim())
  return match ? Number(match[1]) : null
}

/** O slug `name` contém a busca já normalizada? Ignora hífens quando a busca os omite ("hooh"). */
export function nameMatches(name: string, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true
  if (name.includes(normalizedQuery)) return true
  return !normalizedQuery.includes('-') && name.replaceAll('-', '').includes(normalizedQuery)
}
