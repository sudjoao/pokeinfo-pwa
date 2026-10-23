import { fetchJson } from './client'
import type { FlavorTextEntry, NameEntry, NamedApiResource } from './dto'

interface VocabularyDto {
  names: NameEntry[]
}

interface AbilityDto extends VocabularyDto {
  effect_entries: { short_effect: string; effect: string; language: NamedApiResource }[]
  flavor_text_entries: (Omit<FlavorTextEntry, 'version'> & { version_group: NamedApiResource })[]
}

/** Descrição de uma habilidade: efeito curto em inglês e o texto mais recente do jogo em espanhol. */
export interface AbilityDescription {
  nameEs: string | null
  effect: string | null
  effectEs: string | null
}

const clean = (text: string) => text.replace(/\s+/g, ' ').trim()

/** Descrição da habilidade (uma requisição pequena; o service worker guarda em `pokeapi-vocabulary`). */
export async function getAbilityDescription(slug: string): Promise<AbilityDescription> {
  const dto = await fetchJson<AbilityDto>(`/ability/${slug}`)
  const effect = dto.effect_entries.find((entry) => entry.language.name === 'en')
  const flavorEn = dto.flavor_text_entries.filter((entry) => entry.language.name === 'en').at(-1)
  const flavorEs = dto.flavor_text_entries.filter((entry) => entry.language.name === 'es').at(-1)
  return {
    nameEs: pickEsName(dto),
    effect: effect ? clean(effect.short_effect) : flavorEn ? clean(flavorEn.flavor_text) : null,
    effectEs: flavorEs ? clean(flavorEs.flavor_text) : null,
  }
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
