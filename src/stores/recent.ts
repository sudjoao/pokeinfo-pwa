import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readStorage, writeStorage } from '@/utils/storage'

const RECENT_KEY = 'pokeinfo:recent:v1'
const MAX_POKEMON = 20
const MAX_SEARCHES = 8

interface PersistedRecent {
  pokemon: number[]
  searches: string[]
}

/** Coloca `value` no começo da lista, sem repetir e com no máximo `max` itens. */
export function pushRecent<T>(list: readonly T[], value: T, max: number): T[] {
  return [value, ...list.filter((item) => item !== value)].slice(0, max)
}

/**
 * Pokémon vistos e buscas recentes, salvos no aparelho. Ficam de fora do backup de propósito: é
 * histórico de uso, não algo que a pessoa marcou.
 */
export const useRecentStore = defineStore('recent', () => {
  const saved = readStorage<Partial<PersistedRecent>>(RECENT_KEY)
  const pokemon = ref<number[]>(
    Array.isArray(saved?.pokemon) ? saved.pokemon.filter(Number.isInteger) : [],
  )
  const searches = ref<string[]>(
    Array.isArray(saved?.searches) ? saved.searches.filter((s) => typeof s === 'string') : [],
  )

  function persist(): void {
    writeStorage(RECENT_KEY, { pokemon: pokemon.value, searches: searches.value })
  }

  function visit(id: number): void {
    if (pokemon.value[0] === id) return
    pokemon.value = pushRecent(pokemon.value, id, MAX_POKEMON)
    persist()
  }

  /** Busca que levou a abrir um Pokémon (registrar a cada tecla encheria a lista de "pik", "pika"…). */
  function search(term: string): void {
    const value = term.trim().toLowerCase()
    if (!value) return
    searches.value = pushRecent(searches.value, value, MAX_SEARCHES)
    persist()
  }

  function clearPokemon(): void {
    pokemon.value = []
    persist()
  }

  function clearSearches(): void {
    searches.value = []
    persist()
  }

  return { pokemon, searches, visit, search, clearPokemon, clearSearches }
})
