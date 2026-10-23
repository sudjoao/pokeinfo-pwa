<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Game } from '@/data/games'
import type { PokedexText } from '@/types/pokemon'
import { findGameByVersion } from '@/utils/games'
import { formatPokemonName } from '@/utils/pokemon'

const props = defineProps<{
  texts: readonly PokedexText[]
  /** Jogo selecionado: o texto em destaque passa a ser o de uma versão dele. */
  game?: Game | null
}>()

const { t, locale } = useI18n()

function textOf(entry: PokedexText): string | null {
  return locale.value === 'es' ? (entry.es ?? entry.en) : (entry.en ?? entry.es)
}

function versionTitle(slug: string): string {
  return findGameByVersion(slug)?.version.title ?? formatPokemonName(slug)
}

/** Entradas com texto no idioma atual (ou no outro, como reserva). */
const entries = computed(() =>
  props.texts.flatMap((entry) => {
    const text = textOf(entry)
    return text ? [{ version: entry.version, title: versionTitle(entry.version), text }] : []
  }),
)

/** Do jogo selecionado (última versão dele com texto); sem jogo, a mais recente. */
const featured = computed(() => {
  const versions = new Set(props.game?.versions.map((version) => version.slug))
  const fromGame = entries.value.filter((entry) => versions.has(entry.version)).at(-1)
  return fromGame ?? entries.value.at(-1) ?? null
})

const showAll = ref(false)

/** Textos repetidos entre versões aparecem uma vez só, com as versões juntas. */
const grouped = computed(() => {
  const byText = new Map<string, string[]>()
  for (const entry of entries.value) {
    const titles = byText.get(entry.text) ?? []
    titles.push(entry.title)
    byText.set(entry.text, titles)
  }
  return [...byText].map(([text, titles]) => ({ text, titles: titles.join(', ') }))
})
</script>

<template>
  <v-card v-if="featured">
    <v-card-title class="text-title-medium">
      {{ t('detail.pokedexIn', { version: featured.title }) }}
    </v-card-title>
    <v-card-text class="text-body-large">
      <p class="mb-0">{{ featured.text }}</p>
      <v-btn
        v-if="grouped.length > 1"
        variant="text"
        size="small"
        class="mt-2 px-0 text-none"
        :aria-expanded="showAll"
        @click="showAll = !showAll"
      >
        {{ showAll ? t('detail.pokedexHide') : t('detail.pokedexAll', { n: grouped.length }) }}
      </v-btn>
      <dl v-if="showAll" class="pokedex-card__all text-body-medium mt-2">
        <template v-for="entry in grouped" :key="entry.text">
          <dt class="text-label-large">{{ entry.titles }}</dt>
          <dd class="mb-3">{{ entry.text }}</dd>
        </template>
      </dl>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.pokedex-card__all dd {
  margin-inline-start: 0;
}
</style>
