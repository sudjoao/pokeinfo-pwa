import {
  POKEMON_TYPES,
  STAT_NAMES,
  type PokemonDetail,
  type PokemonIndexEntry,
  type PokemonStat,
  type PokemonSummary,
  type PokemonType,
} from '@/types/pokemon'
import { idFromResourceUrl } from '@/utils/pokemon'
import { fetchJson } from './client'
import type { PokemonDto, PokemonListResponse } from './dto'

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

function toDetail(dto: PokemonDto): PokemonDetail {
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
    cryUrl: dto.cries?.latest ?? dto.cries?.legacy ?? null,
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
