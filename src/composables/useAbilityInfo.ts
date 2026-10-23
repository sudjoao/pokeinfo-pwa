import { computed, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVocabularyStore } from '@/stores/vocabulary'
import { usePokedexStore } from '@/stores/pokedex'
import { loadPokemonData, pokemonWithAbility } from '@/composables/usePokemonData'
import type { PokemonAbility } from '@/types/pokemon'
import { formatPokemonName } from '@/utils/pokemon'

export interface AbilityHolder {
  id: number
  name: string
  hidden: boolean
}

/**
 * Estado da sheet de habilidade: descrição (uma requisição pequena, `/ability/{slug}`) e quem mais
 * tem a habilidade (tabela estática, sem requisição; os nomes vêm do índice já em memória).
 */
export function useAbilityInfo() {
  const vocabulary = useVocabularyStore()
  const pokedex = usePokedexStore()
  const { locale } = useI18n()

  const open = ref(false)
  const ability = ref<PokemonAbility | null>(null)
  const status = ref<'loading' | 'ready' | 'error'>('loading')
  const holders = shallowRef<AbilityHolder[] | null>(null)

  const title = computed(() => {
    const slug = ability.value?.name
    if (!slug) return ''
    const es = locale.value === 'es' ? vocabulary.abilities[slug] : null
    return es ?? formatPokemonName(slug)
  })

  const description = computed(() => {
    const slug = ability.value?.name
    const entry = slug ? vocabulary.abilityDescriptions[slug] : undefined
    if (!entry) return null
    return locale.value === 'es' ? (entry.effectEs ?? entry.effect) : entry.effect
  })

  async function load(): Promise<void> {
    const slug = ability.value?.name
    if (!slug) return
    status.value = 'loading'
    holders.value = null
    loadPokemonData()
      .then((data) => {
        if (ability.value?.name !== slug) return
        holders.value = pokemonWithAbility(data, slug).map((holder) => ({
          ...holder,
          name: pokedex.entryOf(holder.id)?.name ?? String(holder.id),
        }))
      })
      .catch(() => {})
    try {
      await vocabulary.ensureAbilityDescription(slug)
      if (ability.value?.name === slug) status.value = 'ready'
    } catch {
      if (ability.value?.name === slug) status.value = 'error'
    }
  }

  function show(value: PokemonAbility): void {
    ability.value = value
    open.value = true
    load()
  }

  return { open, ability, title, description, status, holders, show, retry: load }
}
