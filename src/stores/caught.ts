import { defineGameSetStore } from './gameSet'

/** Pokémon capturados pelo usuário, por jogo (ver `defineGameSetStore`). */
export const CAUGHT_KEY = 'pokeinfo:caught:v1'

export const useCaughtStore = defineGameSetStore('caught', CAUGHT_KEY)
