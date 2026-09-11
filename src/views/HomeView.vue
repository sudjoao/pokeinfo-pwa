<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { mdiSwordCross, mdiTranslate } from '@mdi/js'
import { gameContextQuery } from '@/utils/games'
import { usePokemonList } from '@/composables/usePokemonList'
import { useCry } from '@/composables/useCry'
import { useLocale } from '@/composables/useLocale'
import { useDexLabel } from '@/composables/useDexLabel'
import type { PokemonSummary } from '@/types/pokemon'
import DefaultLayout from '@/components/templates/DefaultLayout.vue'
import SearchField from '@/components/molecules/SearchField.vue'
import EmptyState from '@/components/molecules/EmptyState.vue'
import PokemonCardSkeleton from '@/components/molecules/PokemonCardSkeleton.vue'
import ListFilters from '@/components/organisms/ListFilters.vue'
import PokemonGrid from '@/components/organisms/PokemonGrid.vue'
import GamePickerSheet from '@/components/organisms/GamePickerSheet.vue'
import TypePickerSheet from '@/components/organisms/TypePickerSheet.vue'
import LanguageSheet from '@/components/organisms/LanguageSheet.vue'

const {
  query,
  games,
  game,
  dex,
  setGame,
  setDex,
  caughtFilter,
  setCaughtFilter,
  typeFilter,
  toggleType,
  clearTypes,
  caughtIds,
  caughtCount,
  missingCount,
  toggleCaught,
  items,
  listKey,
  status,
  errorMessage,
  isEmpty,
  sourceLoading,
  sourceError,
  loadMore,
  retry,
} = usePokemonList()

const router = useRouter()
const cry = useCry()
const { t } = useI18n()
const { locale, locales, setLocale } = useLocale()
const { dexLabel } = useDexLabel()

const pickerOpen = ref(false)
const typesOpen = ref(false)
const languageOpen = ref(false)

/** Altura do cabeçalho: busca (48) + linha de chips (32) + espaçamentos. */
const HEADER_EXTENSION_HEIGHT = 108

const emptyTitle = computed(() => {
  if (!game.value || !caughtFilter.value || query.value.trim() || typeFilter.value.length) {
    return t('home.emptyTitle')
  }
  return caughtFilter.value === 'caught' ? t('home.noneCaughtTitle') : t('home.completeTitle')
})

const emptyMessage = computed(() => {
  if (typeFilter.value.length) return t('home.emptyFiltered')
  const params = { dex: dex.value ? dexLabel(dex.value) : '', game: game.value?.title }
  if (game.value && dex.value && caughtFilter.value && !query.value.trim()) {
    return caughtFilter.value === 'caught'
      ? t('home.noneCaughtMessage', params)
      : t('home.completeMessage', params)
  }
  return game.value && dex.value ? t('home.emptyDex', params) : t('home.emptyNational')
})

/** Jogo e Pokédex atuais no formato da URL, para levar o contexto às outras telas. */
const contextQuery = computed(() =>
  gameContextQuery(game.value && dex.value ? { game: game.value, dex: dex.value } : null),
)

/**
 * O grito toca aqui, dentro do toque, porque o iOS bloqueia áudio fora de um gesto do usuário.
 * O jogo selecionado vai junto na URL para o detalhe mostrar o número regional e navegar pela dex.
 */
function openPokemon(pokemon: PokemonSummary): void {
  cry.play(pokemon.id)
  router.push({ name: 'pokemon', params: { id: pokemon.id }, query: contextQuery.value })
}

/** Abre o team builder já com o jogo e o filtro de tipo atuais. */
function openTeamBuilder(): void {
  const query: Record<string, string> = { ...contextQuery.value }
  if (typeFilter.value.length) query.type = typeFilter.value.join(',')
  router.push({ name: 'team', query })
}
</script>

<template>
  <DefaultLayout :extension-height="HEADER_EXTENSION_HEIGHT">
    <template #actions>
      <v-btn :icon="mdiSwordCross" :aria-label="t('home.teamBuilder')" @click="openTeamBuilder" />
      <v-btn :icon="mdiTranslate" :aria-label="t('language.title')" @click="languageOpen = true" />
    </template>
    <template #header>
      <SearchField v-model="query" />
      <ListFilters
        class="mt-2"
        :game="game"
        :dex="dex"
        :types="typeFilter"
        :caught-filter="caughtFilter"
        :caught-count="caughtCount"
        :missing-count="missingCount"
        @open-game="pickerOpen = true"
        @open-types="typesOpen = true"
        @select-dex="setDex"
        @select-caught="setCaughtFilter"
      />
    </template>

    <v-row v-if="sourceLoading" density="compact">
      <v-col v-for="n in 12" :key="n" cols="6" sm="4" md="3" lg="2">
        <PokemonCardSkeleton />
      </v-col>
    </v-row>

    <EmptyState
      v-else-if="sourceError"
      variant="error"
      :title="t('home.loadErrorTitle')"
      :message="sourceError"
      :action-label="t('common.retry')"
      @action="retry"
    />

    <EmptyState v-else-if="isEmpty" :title="emptyTitle" :message="emptyMessage" />

    <PokemonGrid
      v-else
      :key="listKey"
      :items="items"
      :status="status"
      :error-message="errorMessage"
      :caught-ids="game ? caughtIds : undefined"
      @load="loadMore"
      @retry="retry"
      @select="openPokemon"
      @toggle-caught="toggleCaught"
    />

    <GamePickerSheet
      v-model="pickerOpen"
      :games="games"
      :selected="game?.slug ?? null"
      @select="setGame"
    />

    <TypePickerSheet
      v-model="typesOpen"
      :selected="typeFilter"
      @toggle="toggleType"
      @clear="clearTypes"
    />

    <LanguageSheet
      v-model="languageOpen"
      :locales="locales"
      :selected="locale"
      @select="setLocale"
    />
  </DefaultLayout>
</template>
