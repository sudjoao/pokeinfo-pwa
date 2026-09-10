import type { PokemonSpecies } from '@/types/pokemon'
import { generationNumber, idFromResourceUrl } from '@/utils/pokemon'
import { fetchJson } from './client'
import type { PokemonSpeciesDto } from './dto'

/** A PokéAPI não tem pt-BR; usamos inglês para os textos. */
const TEXT_LANGUAGE = 'en'

/** Remove quebras de linha e o caractere de "form feed" que os textos dos jogos trazem. */
function cleanFlavorText(text: string): string {
  return text
    .replace(/[\n\f\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function toSpecies(dto: PokemonSpeciesDto): PokemonSpecies {
  // As entradas vêm em ordem de versão; a última em inglês é a mais recente.
  const flavor = dto.flavor_text_entries.filter((f) => f.language.name === TEXT_LANGUAGE).at(-1)
  const genus = dto.genera.find((g) => g.language.name === TEXT_LANGUAGE)

  return {
    id: dto.id,
    name: dto.name,
    genus: genus?.genus ?? null,
    description: flavor ? cleanFlavorText(flavor.flavor_text) : null,
    generation: dto.generation ? generationNumber(dto.generation.name) : null,
    genderRate: dto.gender_rate,
    eggGroups: dto.egg_groups.map((group) => group.name),
    captureRate: dto.capture_rate,
    baseHappiness: dto.base_happiness,
    isBaby: dto.is_baby,
    isLegendary: dto.is_legendary,
    isMythical: dto.is_mythical,
    evolutionChainId: dto.evolution_chain ? idFromResourceUrl(dto.evolution_chain.url) : null,
    evolvesFromSpeciesId: dto.evolves_from_species
      ? idFromResourceUrl(dto.evolves_from_species.url)
      : null,
    varieties: dto.varieties
      .map((variety) => ({
        pokemonId: idFromResourceUrl(variety.pokemon.url),
        name: variety.pokemon.name,
        isDefault: variety.is_default,
      }))
      .filter((variety) => Number.isFinite(variety.pokemonId)),
  }
}

export async function getPokemonSpecies(
  idOrName: number | string,
  signal?: AbortSignal,
): Promise<PokemonSpecies> {
  const dto = await fetchJson<PokemonSpeciesDto>(`/pokemon-species/${idOrName}`, signal)
  return toSpecies(dto)
}
