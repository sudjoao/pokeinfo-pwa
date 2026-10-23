import type { PokemonIndexEntry } from '@/types/pokemon'
import { idFromResourceUrl } from '@/utils/pokemon'
import { fetchJson } from './client'
import type { NamedApiResource } from './dto'

interface EggGroupDto {
  pokemon_species: NamedApiResource[]
}

/** Espécies de um grupo de ovo (id da espécie + nome), ordenadas pelo número nacional. */
export async function getEggGroupSpecies(name: string): Promise<PokemonIndexEntry[]> {
  const dto = await fetchJson<EggGroupDto>(`/egg-group/${name}`)
  return dto.pokemon_species
    .map((species) => ({ id: idFromResourceUrl(species.url), name: species.name }))
    .filter((entry) => Number.isFinite(entry.id))
    .sort((a, b) => a.id - b.id)
}
