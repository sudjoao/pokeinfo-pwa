import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getAbilityNameEs,
  getItemNameEs,
  getMoveNameEs,
} from '@/services/pokeapi/vocabulary.service'

/**
 * Cache em memória (só da sessão) do nome em espanhol de habilidades, itens e golpes,
 * buscados sob demanda (a PokéAPI não tem esse dado embutido em `/pokemon` nem em
 * `/evolution-chain`). Guarda `null` quando a API não tem entrada `es` para o slug, pra não
 * repetir a requisição pra sempre em recursos sem tradução.
 */
export const useVocabularyStore = defineStore('vocabulary', () => {
  const abilities = ref<Record<string, string | null>>({})
  const items = ref<Record<string, string | null>>({})
  const moves = ref<Record<string, string | null>>({})

  function dedupe<T>(inFlight: Map<string, Promise<T>>, key: string, run: () => Promise<T>) {
    const pending = inFlight.get(key)
    if (pending) return pending
    const request = run().finally(() => inFlight.delete(key))
    inFlight.set(key, request)
    return request
  }

  const abilityRequests = new Map<string, Promise<string | null>>()
  const itemRequests = new Map<string, Promise<string | null>>()
  const moveRequests = new Map<string, Promise<string | null>>()

  function ensureAbilityNameEs(slug: string): Promise<string | null> {
    if (slug in abilities.value) return Promise.resolve(abilities.value[slug]!)
    return dedupe(abilityRequests, slug, async () => {
      const name = await getAbilityNameEs(slug)
      abilities.value[slug] = name
      return name
    })
  }

  function ensureItemNameEs(slug: string): Promise<string | null> {
    if (slug in items.value) return Promise.resolve(items.value[slug]!)
    return dedupe(itemRequests, slug, async () => {
      const name = await getItemNameEs(slug)
      items.value[slug] = name
      return name
    })
  }

  function ensureMoveNameEs(slug: string): Promise<string | null> {
    if (slug in moves.value) return Promise.resolve(moves.value[slug]!)
    return dedupe(moveRequests, slug, async () => {
      const name = await getMoveNameEs(slug)
      moves.value[slug] = name
      return name
    })
  }

  return { abilities, items, moves, ensureAbilityNameEs, ensureItemNameEs, ensureMoveNameEs }
})
