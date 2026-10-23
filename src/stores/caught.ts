import { defineGameSetStore } from './gameSet'

/** Pokémon capturados pelo usuário, por jogo (ver `defineGameSetStore`). */
export const useCaughtStore = defineGameSetStore('caught', 'pokeinfo:caught:v1')
