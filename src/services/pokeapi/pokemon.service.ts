import {
  POKEMON_TYPES,
  STAT_NAMES,
  type PokemonDetail,
  type PokemonGameSprite,
  type PokemonHeldItem,
  type PokemonIndexEntry,
  type PokemonPastAbility,
  type PokemonPastStat,
  type PokemonPastTypes,
  type PokemonMoveLearn,
  type PokemonStat,
  type PokemonSummary,
  type PokemonType,
} from '@/types/pokemon'
import { generationNumber, idFromResourceUrl } from '@/utils/pokemon'
import { fetchJson } from './client'
import type { PokemonDto, PokemonListResponse, PokemonSpriteSetDto } from './dto'

function toPokemonType(name: string): PokemonType {
  return (POKEMON_TYPES as readonly string[]).includes(name) ? (name as PokemonType) : 'unknown'
}

function toSummary(dto: PokemonDto): PokemonSummary {
  return {
    id: dto.id,
    name: dto.name,
    types: [...dto.types]
      .sort((a, b) => a.slot - b.slot)
      .map((slot) => toPokemonType(slot.type.name)),
  }
}

function toStats(dto: PokemonDto): PokemonStat[] {
  const byName = new Map(dto.stats.map((slot) => [slot.stat.name, slot.base_stat]))
  return STAT_NAMES.map((name) => ({ name, value: byName.get(name) ?? 0 }))
}

function toMoves(dto: PokemonDto): PokemonMoveLearn[] {
  return dto.moves.flatMap((entry) =>
    entry.version_group_details.map((detail) => ({
      move: entry.move.name,
      versionGroup: detail.version_group.name,
      method: detail.move_learn_method.name,
      level: detail.level_learned_at,
    })),
  )
}

function spriteOf(generation: number, key: string, set: PokemonSpriteSetDto): PokemonGameSprite {
  return {
    generation,
    key,
    front: set.front_default ?? null,
    shiny: set.front_shiny ?? null,
    animated: set.animated?.front_default ?? null,
    animatedShiny: set.animated?.front_shiny ?? null,
  }
}

/**
 * Sprites de cada jogo, da 1ª geração à atual, mais os animados do Showdown no fim. Ignora as
 * chaves "icons" (ícones de menu, não um jogo) e jogos sem nenhuma imagem para esta forma.
 */
export function toSprites(dto: PokemonDto): PokemonGameSprite[] {
  const sprites: PokemonGameSprite[] = []
  for (const [genKey, games] of Object.entries(dto.sprites?.versions ?? {})) {
    const generation = generationNumber(genKey)
    if (!generation) continue
    for (const [key, set] of Object.entries(games)) {
      if (key === 'icons') continue
      const sprite = spriteOf(generation, key, set)
      if (sprite.front || sprite.animated) sprites.push(sprite)
    }
  }
  sprites.sort((a, b) => a.generation - b.generation)
  const showdown = dto.sprites?.other?.showdown
  if (showdown?.front_default) {
    const last = sprites[sprites.length - 1]?.generation ?? 0
    // O Showdown não guarda o GIF em `animated`: o próprio front já é animado.
    sprites.push({
      ...spriteOf(last, 'showdown', {}),
      animated: showdown.front_default,
      animatedShiny: showdown.front_shiny ?? null,
    })
  }
  return sprites
}

export function toHeldItems(dto: PokemonDto): PokemonHeldItem[] {
  return (dto.held_items ?? []).map((held) => ({
    item: held.item.name,
    rarity: Object.fromEntries(held.version_details.map((v) => [v.version.name, v.rarity])),
  }))
}

export function toPastTypes(dto: PokemonDto): PokemonPastTypes[] {
  return (dto.past_types ?? []).flatMap((past) => {
    const until = generationNumber(past.generation.name)
    if (!until) return []
    const types = [...past.types]
      .sort((a, b) => a.slot - b.slot)
      .map((t) => toPokemonType(t.type.name))
    return [{ until, types }]
  })
}

/**
 * Habilidades que mudaram. Entradas com habilidade nula ficam de fora: são o "sem habilidade
 * oculta antes da 5ª geração", igual para todos os Pokémon e sem informação.
 */
export function toPastAbilities(dto: PokemonDto): PokemonPastAbility[] {
  return (dto.past_abilities ?? []).flatMap((past) => {
    const until = generationNumber(past.generation.name)
    if (!until) return []
    return past.abilities.flatMap((slot) =>
      slot.ability
        ? [{ until, slot: slot.slot, ability: slot.ability.name, isHidden: slot.is_hidden }]
        : [],
    )
  })
}

export function toPastStats(dto: PokemonDto): PokemonPastStat[] {
  return (dto.past_stats ?? []).flatMap((past) => {
    const until = generationNumber(past.generation.name)
    if (!until) return []
    return past.stats.map((slot) => ({ until, name: slot.stat.name, value: slot.base_stat }))
  })
}

export function toDetail(dto: PokemonDto): PokemonDetail {
  return {
    ...toSummary(dto),
    speciesId: idFromResourceUrl(dto.species.url),
    isDefault: dto.is_default,
    height: dto.height / 10,
    weight: dto.weight / 10,
    abilities: [...dto.abilities]
      .sort((a, b) => a.slot - b.slot)
      .map((slot) => ({ name: slot.ability.name, isHidden: slot.is_hidden })),
    stats: toStats(dto),
    evYield: STAT_NAMES.flatMap((name) => {
      const value = dto.stats.find((slot) => slot.stat.name === name)?.effort ?? 0
      return value > 0 ? [{ name, value }] : []
    }),
    baseExperience: dto.base_experience,
    cryUrl: dto.cries?.latest ?? dto.cries?.legacy ?? null,
    moves: toMoves(dto),
    sprites: toSprites(dto),
    heldItems: toHeldItems(dto),
    pastTypes: toPastTypes(dto),
    pastAbilities: toPastAbilities(dto),
    pastStats: toPastStats(dto),
  }
}

/**
 * Índice completo da Pokédex (id + nome). Uma única requisição grande;
 * o service worker mantém a resposta em cache.
 */
export async function getPokemonIndex(signal?: AbortSignal): Promise<PokemonIndexEntry[]> {
  const data = await fetchJson<PokemonListResponse>('/pokemon?limit=100000&offset=0', signal)
  return data.results
    .map((resource) => ({ id: idFromResourceUrl(resource.url), name: resource.name }))
    .filter((entry) => Number.isFinite(entry.id))
    .sort((a, b) => a.id - b.id)
}

export async function getPokemonSummary(
  idOrName: number | string,
  signal?: AbortSignal,
): Promise<PokemonSummary> {
  const dto = await fetchJson<PokemonDto>(`/pokemon/${idOrName}`, signal)
  return toSummary(dto)
}

/** Detalhe completo de uma forma de Pokémon (a resposta crua tem ~300 KB; guardamos só o mapeado). */
export async function getPokemonDetail(
  idOrName: number | string,
  signal?: AbortSignal,
): Promise<PokemonDetail> {
  const dto = await fetchJson<PokemonDto>(`/pokemon/${idOrName}`, signal)
  return toDetail(dto)
}
