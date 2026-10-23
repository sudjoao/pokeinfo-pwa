import { idFromResourceUrl } from '@/utils/pokemon'
import { fetchJson } from './client'
import type { NamedApiResource } from './dto'

/** Só o que a página do item usa de `/item/{slug}`. */
interface ItemDto {
  fling_power: number | null
  fling_effect: NamedApiResource | null
  category: NamedApiResource
  effect_entries: { short_effect: string; language: NamedApiResource }[]
  /** A PokéAPI já chamou o texto de `flavor_text` e hoje chama de `text`. */
  flavor_text_entries: {
    text?: string
    flavor_text?: string
    language: NamedApiResource
    version_group: NamedApiResource
  }[]
  held_by_pokemon: {
    pokemon: NamedApiResource
    version_details: { rarity: number; version: NamedApiResource }[]
  }[]
  sprites: { default: string | null } | null
}

interface BerryDto {
  growth_time: number
  max_harvest: number
  natural_gift_power: number
  size: number
  smoothness: number
  firmness: NamedApiResource
  natural_gift_type: NamedApiResource
  flavors: { potency: number; flavor: NamedApiResource }[]
}

export interface ItemDetail {
  category: string
  sprite: string | null
  /** Efeito curto em inglês (a PokéAPI não tem pt-BR). */
  effect: string | null
  /** Texto do jogo em espanhol por grupo de versões, e o mais recente. */
  effectEs: Record<string, string>
  effectEsLatest: string | null
  /** Texto do jogo em inglês, quando não há efeito curto (muitos itens novos). */
  flavorEn: string | null
  flingPower: number | null
  /** Quem segura na natureza, com a chance (%) por versão. */
  heldBy: { id: number; rarity: Record<string, number> }[]
}

export interface BerryDetail {
  firmness: string
  /** Horas por estágio de crescimento (4ª geração). */
  growthTime: number
  maxHarvest: number
  /** Milímetros. */
  size: number
  naturalGiftType: string
  naturalGiftPower: number
  /** Só os sabores com intensidade > 0. */
  flavors: { flavor: string; potency: number }[]
}

const clean = (text: string) => text.replace(/\s+/g, ' ').trim()

export function toItemDetail(dto: ItemDto): ItemDetail {
  const textOf = (entry: ItemDto['flavor_text_entries'][number]) =>
    clean(entry.text ?? entry.flavor_text ?? '')
  const effectEs: Record<string, string> = {}
  let effectEsLatest: string | null = null
  let flavorEn: string | null = null
  for (const entry of dto.flavor_text_entries) {
    if (entry.language.name === 'es') {
      effectEs[entry.version_group.name] = textOf(entry)
      effectEsLatest = textOf(entry)
    } else if (entry.language.name === 'en') {
      flavorEn = textOf(entry)
    }
  }
  const effect = dto.effect_entries.find((entry) => entry.language.name === 'en')?.short_effect
  return {
    category: dto.category.name,
    sprite: dto.sprites?.default ?? null,
    effect: effect ? clean(effect) : null,
    effectEs,
    effectEsLatest,
    flavorEn,
    flingPower: dto.fling_power,
    heldBy: dto.held_by_pokemon.map((held) => ({
      id: idFromResourceUrl(held.pokemon.url),
      rarity: Object.fromEntries(held.version_details.map((v) => [v.version.name, v.rarity])),
    })),
  }
}

export async function getItemDetail(slug: string): Promise<ItemDetail> {
  return toItemDetail(await fetchJson<ItemDto>(`/item/${slug}`))
}

/** "oran-berry" -> dados de `/berry/oran` (o slug da berry não tem o sufixo). */
export async function getBerryDetail(itemSlug: string): Promise<BerryDetail> {
  const dto = await fetchJson<BerryDto>(`/berry/${itemSlug.replace(/-berry$/, '')}`)
  return {
    firmness: dto.firmness.name,
    growthTime: dto.growth_time,
    maxHarvest: dto.max_harvest,
    size: dto.size,
    naturalGiftType: dto.natural_gift_type.name,
    naturalGiftPower: dto.natural_gift_power,
    flavors: dto.flavors
      .filter((f) => f.potency > 0)
      .map((f) => ({ flavor: f.flavor.name, potency: f.potency })),
  }
}
