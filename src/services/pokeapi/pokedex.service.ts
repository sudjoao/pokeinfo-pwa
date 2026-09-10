import type { PokedexEntry } from '@/types/pokemon'
import { idFromResourceUrl } from '@/utils/pokemon'
import { fetchJson } from './client'
import type { PokedexDto } from './dto'

/**
 * Entradas de uma Pokédex regional (ex.: "galar", "hisui"), já ordenadas pelo número no jogo.
 * A resposta crua tem de 12 a 45 KB; guardamos só número + espécie (~10 KB para 400 entradas).
 */
export async function getPokedexEntries(
  slug: string,
  signal?: AbortSignal,
): Promise<PokedexEntry[]> {
  const dto = await fetchJson<PokedexDto>(`/pokedex/${slug}`, signal)
  return dto.pokemon_entries
    .map((entry) => ({
      entryNumber: entry.entry_number,
      speciesId: idFromResourceUrl(entry.pokemon_species.url),
      speciesName: entry.pokemon_species.name,
    }))
    .filter((entry) => Number.isFinite(entry.speciesId))
    .sort((a, b) => a.entryNumber - b.entryNumber)
}
