import type { PokedexText, PokemonSpecies } from '@/types/pokemon'
import { generationNumber, idFromResourceUrl } from '@/utils/pokemon'
import { fetchJson } from './client'
import type { PokemonSpeciesDto } from './dto'

/** A PokéAPI não tem pt-BR; usamos inglês como padrão e espanhol quando disponível (idioma `es`). */
const TEXT_LANGUAGE = 'en'
const ES_LANGUAGE = 'es'

/** Remove quebras de linha e o caractere de "form feed" que os textos dos jogos trazem. */
function cleanFlavorText(text: string): string {
  return text
    .replace(/[\n\f\r]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Um texto por versão, com inglês e espanhol lado a lado. */
function toPokedexTexts(dto: PokemonSpeciesDto): PokedexText[] {
  const byVersion = new Map<string, PokedexText>()
  for (const entry of dto.flavor_text_entries) {
    const language = entry.language.name
    if (language !== TEXT_LANGUAGE && language !== ES_LANGUAGE) continue
    const version = entry.version.name
    let text = byVersion.get(version)
    if (!text) {
      text = { version, en: null, es: null }
      byVersion.set(version, text)
    }
    text[language === TEXT_LANGUAGE ? 'en' : 'es'] = cleanFlavorText(entry.flavor_text)
  }
  return [...byVersion.values()]
}

function toSpecies(dto: PokemonSpeciesDto): PokemonSpecies {
  // As entradas vêm em ordem de versão; a última de cada idioma é a mais recente.
  const flavor = dto.flavor_text_entries.filter((f) => f.language.name === TEXT_LANGUAGE).at(-1)
  const genus = dto.genera.find((g) => g.language.name === TEXT_LANGUAGE)
  const flavorEs = dto.flavor_text_entries.filter((f) => f.language.name === ES_LANGUAGE).at(-1)
  const genusEs = dto.genera.find((g) => g.language.name === ES_LANGUAGE)
  const nameEs = dto.names.find((n) => n.language.name === ES_LANGUAGE)

  return {
    id: dto.id,
    name: dto.name,
    genus: genus?.genus ?? null,
    description: flavor ? cleanFlavorText(flavor.flavor_text) : null,
    nameEs: nameEs?.name ?? null,
    genusEs: genusEs?.genus ?? null,
    descriptionEs: flavorEs ? cleanFlavorText(flavorEs.flavor_text) : null,
    generation: dto.generation ? generationNumber(dto.generation.name) : null,
    genderRate: dto.gender_rate,
    eggGroups: dto.egg_groups.map((group) => group.name),
    captureRate: dto.capture_rate,
    baseHappiness: dto.base_happiness,
    growthRate: dto.growth_rate?.name ?? null,
    hatchCounter: dto.hatch_counter,
    pokedexTexts: toPokedexTexts(dto),
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
