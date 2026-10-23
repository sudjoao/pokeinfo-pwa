import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loadPokemonData } from '@/composables/usePokemonData'
import {
  getAbilityDescription,
  getAbilityNameEs,
  type AbilityDescription,
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
  const abilityDescriptions = ref<Record<string, AbilityDescription>>({})

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

  // Os nomes em espanhol de habilidades e golpes já vêm nos dados gerados (src/data/generated):
  // a PokéAPI (/ability, /move, respostas grandes com todos os idiomas) fica só de reserva.
  function ensureAbilityNameEs(slug: string): Promise<string | null> {
    if (slug in abilities.value) return Promise.resolve(abilities.value[slug]!)
    return dedupe(abilityRequests, slug, async () => {
      const data = await loadPokemonData().catch(() => null)
      const index = data?.abilityIndex.get(slug)
      const bundled = index === undefined ? undefined : data?.abilities[index]?.[1]
      const name = bundled || (await getAbilityNameEs(slug))
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
      const bundled = await import('@/data/generated/moves')
        .then(({ MOVES }) => MOVES[slug]?.[5])
        .catch(() => undefined)
      const name = bundled || (await getMoveNameEs(slug))
      moves.value[slug] = name
      return name
    })
  }

  const descriptionRequests = new Map<string, Promise<AbilityDescription>>()

  /** Descrição da habilidade (também preenche o nome em espanhol, que vem na mesma resposta). */
  function ensureAbilityDescription(slug: string): Promise<AbilityDescription> {
    const cached = abilityDescriptions.value[slug]
    if (cached) return Promise.resolve(cached)
    return dedupe(descriptionRequests, slug, async () => {
      const description = await getAbilityDescription(slug)
      abilityDescriptions.value[slug] = description
      abilities.value[slug] = description.nameEs
      return description
    })
  }

  return {
    abilities,
    items,
    moves,
    abilityDescriptions,
    ensureAbilityNameEs,
    ensureItemNameEs,
    ensureMoveNameEs,
    ensureAbilityDescription,
  }
})
