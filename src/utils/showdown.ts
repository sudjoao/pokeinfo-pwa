import type { PokemonIndexEntry } from '@/types/pokemon'

/** Nomes que o Showdown escreve de um jeito que o slug da PokéAPI não deduz. */
const SPECIAL_NAMES: Record<string, string> = {
  'mr-mime': 'Mr. Mime',
  'mr-mime-galar': 'Mr. Mime-Galar',
  'mr-rime': 'Mr. Rime',
  'mime-jr': 'Mime Jr.',
  'type-null': 'Type: Null',
  farfetchd: "Farfetch'd",
  'farfetchd-galar': "Farfetch'd-Galar",
  sirfetchd: "Sirfetch'd",
  'nidoran-f': 'Nidoran-F',
  'nidoran-m': 'Nidoran-M',
  flabebe: 'Flabébé',
  'ho-oh': 'Ho-Oh',
  'porygon-z': 'Porygon-Z',
  'jangmo-o': 'Jangmo-o',
  'hakamo-o': 'Hakamo-o',
  'kommo-o': 'Kommo-o',
}

/** "raichu-alola" -> "Raichu-Alola" (como o Pokémon Showdown escreve as formas). */
export function showdownName(slug: string): string {
  const special = SPECIAL_NAMES[slug]
  if (special) return special
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-')
}

/** Time no formato de importação do Showdown: um Pokémon por bloco (só a espécie). */
export function exportShowdown(team: readonly PokemonIndexEntry[]): string {
  return team.map((member) => `${showdownName(member.name)}\n`).join('\n')
}

/** "Mr. Mime-Galar" -> "mr-mime-galar"; "Farfetch’d" -> "farfetchd". */
export function slugFromShowdown(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’.:]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Espécie da primeira linha de um bloco do Showdown:
 * "Apelido (Garchomp) (M) @ Choice Scarf" -> "Garchomp"; "Rotom-Wash @ Leftovers" -> "Rotom-Wash".
 */
export function speciesFromLine(line: string): string | null {
  const head = line.split('@')[0]!.trim()
  if (!head) return null
  const groups = [...head.matchAll(/\(([^)]+)\)/g)].map((match) => match[1]!.trim())
  const species = groups.find((group) => group !== 'M' && group !== 'F')
  return species ?? head.replace(/\((M|F)\)/g, '').trim()
}

/**
 * Lê um time colado do Showdown e devolve os ids encontrados no índice (até `max`), mais os nomes
 * que não foram reconhecidos. Formas que o índice não tem caem para a espécie base.
 */
export function importShowdown(
  text: string,
  index: readonly PokemonIndexEntry[],
  max = 6,
): { ids: number[]; unknown: string[] } {
  const bySlug = new Map(index.map((entry) => [entry.name, entry.id]))
  const ids: number[] = []
  const unknown: string[] = []
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
  for (const block of blocks) {
    const species = speciesFromLine(block.split('\n')[0]!)
    if (!species) continue
    const slug = slugFromShowdown(species)
    const special = Object.entries(SPECIAL_NAMES).find(
      ([, name]) => slugFromShowdown(name) === slug,
    )
    const id = bySlug.get(special?.[0] ?? slug) ?? bySlug.get(slug.split('-')[0]!) ?? undefined
    if (id === undefined) unknown.push(species)
    else if (!ids.includes(id) && ids.length < max) ids.push(id)
  }
  return { ids, unknown }
}
