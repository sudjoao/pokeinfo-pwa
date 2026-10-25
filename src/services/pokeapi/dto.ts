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

export interface PokemonMoveVersionDto {
  level_learned_at: number
  move_learn_method: NamedApiResource
  version_group: NamedApiResource
}

export interface PokemonMoveDto {
  move: NamedApiResource
  version_group_details: PokemonMoveVersionDto[]
}

/** Conjunto de sprites de um jogo; animados só em Crystal, Black/White e Showdown. */
export interface PokemonSpriteSetDto {
  front_default?: string | null
  front_shiny?: string | null
  animated?: { front_default?: string | null; front_shiny?: string | null } | null
}

export interface PokemonSpritesDto {
  /** "generation-i" -> "red-blue" -> sprites (inclui chaves "icons", que não são jogos). */
  versions?: Record<string, Record<string, PokemonSpriteSetDto>>
  other?: { showdown?: PokemonSpriteSetDto | null } | null
}

export interface PokemonHeldItemDto {
  item: NamedApiResource
  version_details: { rarity: number; version: NamedApiResource }[]
}

export interface PokemonPastTypesDto {
  generation: NamedApiResource
  types: PokemonTypeSlot[]
}

export interface PokemonPastAbilitiesDto {
  generation: NamedApiResource
  abilities: { ability: NamedApiResource | null; is_hidden: boolean; slot: number }[]
}

export interface PokemonPastStatsDto {
  generation: NamedApiResource
  stats: PokemonStatSlot[]
}

export interface PokemonDto {
  id: number
  name: string
  is_default: boolean
  base_experience: number | null
  /** Decímetros. */
  height: number
  /** Hectogramas. */
  weight: number
  types: PokemonTypeSlot[]
  abilities: PokemonAbilitySlot[]
  stats: PokemonStatSlot[]
  cries: PokemonCriesDto | null
  species: NamedApiResource
  moves: PokemonMoveDto[]
  sprites?: PokemonSpritesDto
  held_items?: PokemonHeldItemDto[]
  past_types?: PokemonPastTypesDto[]
  past_abilities?: PokemonPastAbilitiesDto[]
  past_stats?: PokemonPastStatsDto[]
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

export interface NameEntry extends LocalizedText {
  name: string
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
  growth_rate: NamedApiResource | null
  hatch_counter: number | null
  flavor_text_entries: FlavorTextEntry[]
  genera: GenusEntry[]
  names: NameEntry[]
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

export interface EncounterDetailDto {
  min_level: number
  max_level: number
  chance: number
  method: NamedApiResource
  condition_values: NamedApiResource[]
}

export interface EncounterVersionDetailDto {
  version: NamedApiResource
  max_chance: number
  encounter_details: EncounterDetailDto[]
}

/** Item de `/pokemon/{id}/encounters` (a resposta é uma lista, vazia quando não há dados). */
export interface PokemonEncounterDto {
  location_area: NamedApiResource
  version_details: EncounterVersionDetailDto[]
}

export interface LocationAreaPokemonEncounterDto {
  pokemon: NamedApiResource
  version_details: EncounterVersionDetailDto[]
}

/** Só o que usamos de `/location-area/{slug}`: quem aparece ali, por versão. */
export interface LocationAreaDto {
  pokemon_encounters: LocationAreaPokemonEncounterDto[]
}
