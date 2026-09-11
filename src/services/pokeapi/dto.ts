/** Tipos crus das respostas da PokéAPI (apenas os campos usados pelo app). */

export interface NamedApiResource {
  name: string
  url: string
}

export interface PokemonListResponse {
  count: number
  next: string | null
  previous: string | null
  results: NamedApiResource[]
}

export interface PokemonTypeSlot {
  slot: number
  type: NamedApiResource
}

export interface PokemonAbilitySlot {
  is_hidden: boolean
  slot: number
  ability: NamedApiResource
}

export interface PokemonStatSlot {
  base_stat: number
  effort: number
  stat: NamedApiResource
}

export interface PokemonCriesDto {
  latest: string | null
  legacy: string | null
}

export interface PokemonDto {
  id: number
  name: string
  is_default: boolean
  /** Decímetros. */
  height: number
  /** Hectogramas. */
  weight: number
  types: PokemonTypeSlot[]
  abilities: PokemonAbilitySlot[]
  stats: PokemonStatSlot[]
  cries: PokemonCriesDto | null
  species: NamedApiResource
}

export interface LocalizedText {
  language: NamedApiResource
}

export interface FlavorTextEntry extends LocalizedText {
  flavor_text: string
  version: NamedApiResource
}

export interface GenusEntry extends LocalizedText {
  genus: string
}

export interface PokemonSpeciesVarietyDto {
  is_default: boolean
  pokemon: NamedApiResource
}

export interface PokemonSpeciesDto {
  id: number
  name: string
  gender_rate: number
  capture_rate: number
  base_happiness: number | null
  is_baby: boolean
  is_legendary: boolean
  is_mythical: boolean
  egg_groups: NamedApiResource[]
  evolves_from_species: NamedApiResource | null
  evolution_chain: { url: string } | null
  generation: NamedApiResource | null
  flavor_text_entries: FlavorTextEntry[]
  genera: GenusEntry[]
  varieties: PokemonSpeciesVarietyDto[]
}

export interface EvolutionDetailDto {
  version_group: NamedApiResource | null
  is_default: boolean | null
  item: NamedApiResource | null
  trigger: NamedApiResource | null
  gender: number | null
  held_item: NamedApiResource | null
  known_move: NamedApiResource | null
  known_move_type: NamedApiResource | null
  location: NamedApiResource | null
  min_level: number | null
  min_happiness: number | null
  min_beauty: number | null
  min_affection: number | null
  near_special_rock: boolean | null
  needs_multiplayer: boolean | null
  needs_overworld_rain: boolean | null
  party_species: NamedApiResource | null
  party_type: NamedApiResource | null
  relative_physical_stats: number | null
  time_of_day: string | null
  trade_species: NamedApiResource | null
  turn_upside_down: boolean | null
  region: NamedApiResource | null
  base_form: NamedApiResource | null
  evolved_form: NamedApiResource | null
  used_move: NamedApiResource | null
  min_move_count: number | null
  min_steps: number | null
  min_damage_taken: number | null
}

export interface ChainLinkDto {
  is_baby: boolean
  species: NamedApiResource
  evolution_details: EvolutionDetailDto[]
  evolves_to: ChainLinkDto[]
}

export interface EvolutionChainDto {
  id: number
  baby_trigger_item: NamedApiResource | null
  chain: ChainLinkDto
}

export interface PokedexEntryDto {
  entry_number: number
  pokemon_species: NamedApiResource
}

export interface PokedexDto {
  id: number
  name: string
  is_main_series: boolean
  pokemon_entries: PokedexEntryDto[]
}

export interface TypePokemonDto {
  slot: number
  pokemon: NamedApiResource
}

/** Só o que usamos de `/type/{nome}`: a lista de Pokémon daquele tipo com o slot. */
export interface TypeDto {
  id: number
  name: string
  pokemon: TypePokemonDto[]
}
