import { POKEMON_TYPES, type PokemonType } from '@/types/pokemon'
import { idFromResourceUrl } from '@/utils/pokemon'
import { fetchJson } from './client'
import type { TypeDto } from './dto'

/** Tipos que têm Pokémon na PokéAPI (stellar e unknown não listam nenhum). */
const LISTED_TYPES = POKEMON_TYPES.filter((type) => type !== 'stellar' && type !== 'unknown')

/** Mapa "id do Pokémon (ou forma) -> tipos na ordem dos slots". */
export type TypeMap = Record<number, PokemonType[]>

/**
 * Monta o mapa de tipos de todos os Pokémon a partir dos 18 endpoints `/type/{nome}`
 * (~20 KB cada, ~385 KB no total). É bem mais barato que ler os tipos de `/pokemon/{id}`,
 * cuja resposta tem ~290 KB por Pokémon por causa da lista de golpes.
 */
export async function getTypeMap(signal?: AbortSignal): Promise<TypeMap> {
  const responses = await Promise.all(
    LISTED_TYPES.map((type) => fetchJson<TypeDto>(`/type/${type}`, signal)),
  )

  const slots: Record<number, { slot: number; type: PokemonType }[]> = {}
  responses.forEach((dto, i) => {
    const type = LISTED_TYPES[i]!
    for (const entry of dto.pokemon) {
      const id = idFromResourceUrl(entry.pokemon.url)
      if (!Number.isFinite(id)) continue
      ;(slots[id] ??= []).push({ slot: entry.slot, type })
    }
  })

  const map: TypeMap = {}
  for (const [id, list] of Object.entries(slots)) {
    map[Number(id)] = list.sort((a, b) => a.slot - b.slot).map((entry) => entry.type)
  }
  return map
}
