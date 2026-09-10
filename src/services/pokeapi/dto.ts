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

export interface PokemonDto {
  id: number
  name: string
  types: PokemonTypeSlot[]
}
