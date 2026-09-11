import { fetchJson } from './client'
import type { NameEntry } from './dto'

interface VocabularyDto {
  names: NameEntry[]
}

function pickEsName(dto: VocabularyDto): string | null {
  return dto.names.find((n) => n.language.name === 'es')?.name ?? null
}

/** Nome da habilidade em espanhol, buscado sob demanda (só quando o locale é `es`). */
export async function getAbilityNameEs(slug: string): Promise<string | null> {
  return pickEsName(await fetchJson<VocabularyDto>(`/ability/${slug}`))
}

/** Nome do item em espanhol, buscado sob demanda (só quando o locale é `es`). */
export async function getItemNameEs(slug: string): Promise<string | null> {
  return pickEsName(await fetchJson<VocabularyDto>(`/item/${slug}`))
}

/** Nome do golpe em espanhol, buscado sob demanda (só quando o locale é `es`). */
export async function getMoveNameEs(slug: string): Promise<string | null> {
  return pickEsName(await fetchJson<VocabularyDto>(`/move/${slug}`))
}
