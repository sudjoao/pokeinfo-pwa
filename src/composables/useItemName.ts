import { watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVocabularyStore } from '@/stores/vocabulary'
import { formatPokemonName } from '@/utils/pokemon'

/**
 * Nome de item no idioma atual: em espanhol vem da PokéAPI (buscado sob demanda), nos outros
 * idiomas o nome em inglês formatado, como nos jogos. `slugs` diz quais pré-buscar.
 */
export function useItemName(slugs: () => readonly string[]) {
  const { locale } = useI18n()
  const vocabulary = useVocabularyStore()

  watchEffect(() => {
    if (locale.value !== 'es') return
    for (const slug of slugs()) vocabulary.ensureItemNameEs(slug)
  })

  return (slug: string): string =>
    (locale.value === 'es' ? vocabulary.items[slug] : null) || formatPokemonName(slug)
}
