import {
  POKEMON_TYPES,
  type PokemonIndexEntry,
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
