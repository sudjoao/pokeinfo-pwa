<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onActivated, ref, watch } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  mdiFilterRemoveOutline,
  mdiPackageVariantClosed,
  mdiSwordCross,
  mdiViewGridOutline,
} from '@mdi/js'
import { gameContextQuery } from '@/utils/games'
import { ROUTE_GAMES } from '@/data/routeGames'
import { usePokemonList } from '@/composables/usePokemonList'
import { useCry } from '@/composables/useCry'
import { useDexLabel } from '@/composables/useDexLabel'
import type { PokemonSummary } from '@/types/pokemon'
import DefaultLayout from '@/components/templates/DefaultLayout.vue'
import SearchField from '@/components/molecules/SearchField.vue'
import RecentStrip from '@/components/molecules/RecentStrip.vue'
import { useRecentStore } from '@/stores/recent'
import { usePokedexStore } from '@/stores/pokedex'
import EmptyState from '@/components/molecules/EmptyState.vue'
import ResultsAnnouncer from '@/components/atoms/ResultsAnnouncer.vue'
import PokemonCardSkeleton from '@/components/molecules/PokemonCardSkeleton.vue'
import ListFilters from '@/components/organisms/ListFilters.vue'
import PokemonGrid from '@/components/organisms/PokemonGrid.vue'
import PokemonBoxes from '@/components/organisms/PokemonBoxes.vue'
import BackToTop from '@/components/atoms/BackToTop.vue'
import GamePickerSheet from '@/components/organisms/GamePickerSheet.vue'
import TypePickerSheet from '@/components/organisms/TypePickerSheet.vue'
import VersionPickerSheet from '@/components/organisms/VersionPickerSheet.vue'
import { useMountOnOpen } from '@/composables/useMountOnOpen'
import { usePokemonData } from '@/composables/usePokemonData'

// Só usados ao abrir a aba "Rotas" (com ~170 KB de dados) e o sheet de filtros (VSelect, VSlider…):
// ficam fora do carregamento inicial.
const RouteList = defineAsyncComponent(() => import('@/components/organisms/RouteList.vue'))
const AdvancedFilterSheet = defineAsyncComponent(
  () => import('@/components/organisms/AdvancedFilterSheet.vue'),
)

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
  hasFilters,
  clearFilters,
  versions,
  availability,
  toggleAvailability,
  clearAvailability,
  availabilityCounts,
  caughtIds,
  caughtCount,
  missingCount,
  toggleCaught,
  advanced,
  advancedCount,
  setAdvanced,
  clearAdvanced,
  items,
  filtered,
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
const route = useRoute()
const recent = useRecentStore()
const pokedexStore = usePokedexStore()

/** Faixa "Vistos recentemente": só na lista sem busca nem filtro (é o "ponto de partida"). */
const recentItems = computed(() =>
  query.value.trim() || typeFilter.value.length || advancedCount.value
    ? []
    : recent.pokemon.flatMap((id) => {
        const entry = pokedexStore.entryOf(id)
        return entry ? [{ id, name: entry.name }] : []
      }),
)

/** A busca que levou a abrir um Pokémon vira "busca recente". */
function rememberSearch(): void {
  if (query.value.trim()) recent.search(query.value)
}

/** Cards (padrão) ou caixas de 30, como no Pokémon HOME (`?layout=boxes`). */
const layout = computed<'cards' | 'boxes'>(() =>
  route.query.layout === 'boxes' ? 'boxes' : 'cards',
)

function setLayout(value: 'cards' | 'boxes'): void {
  const query = { ...route.query }
  if (value === 'boxes') query.layout = 'boxes'
  else delete query.layout
  router.replace({ query })
}
const cry = useCry()
const { t } = useI18n()
const { dexLabel } = useDexLabel()

/** Aba ativa na Home; "routes" só existe com um jogo com dados de encontro selecionado. */
const view = ref<'pokemon' | 'routes'>('pokemon')
watch(
  () => game.value?.slug,
  () => (view.value = 'pokemon'),
)

const pickerOpen = ref(false)
const typesOpen = ref(false)
const versionsOpen = ref(false)
const advancedOpen = ref(false)
const advancedMounted = useMountOnOpen(advancedOpen)
const pokemonData = usePokemonData()

/** Abre "Filtros" e já baixa a tabela (lista de habilidades, ordenação por stats). */
function openAdvanced(): void {
  advancedOpen.value = true
  pokemonData.load().catch(() => {})
}

/** Altura do cabeçalho: busca (48) + linha de chips (32) + espaçamentos. */
const HEADER_EXTENSION_HEIGHT = 108

/** Só "Favoritos" ligado e nenhum favorito: explica onde se favorita, em vez de "tente outra busca". */
const noFavorites = computed(
  () => advanced.value.favorites && advancedCount.value === 1 && !query.value.trim(),
)

const emptyTitle = computed(() => {
  if (noFavorites.value) return t('home.noFavoritesTitle')
  if (
    !game.value ||
    !caughtFilter.value ||
    query.value.trim() ||
    typeFilter.value.length ||
    availability.value.length
  ) {
    return t('home.emptyTitle')
  }
  return caughtFilter.value === 'caught' ? t('home.noneCaughtTitle') : t('home.completeTitle')
})

const emptyMessage = computed(() => {
  if (noFavorites.value) return t('home.noFavoritesMessage')
  if (typeFilter.value.length || availability.value.length || advancedCount.value)
    return t('home.emptyFiltered')
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

/** Detalhe do Pokémon; o jogo selecionado vai junto para mostrar o número regional e navegar pela dex. */
function pokemonRoute(pokemon: PokemonSummary): RouteLocationRaw {
  return { name: 'pokemon', params: { id: pokemon.id }, query: contextQuery.value }
}

/** Último Pokémon aberto pela grade: ao voltar, o foco do teclado retorna ao card dele. */
let lastOpenedId: number | null = null

/**
 * O card é um link e navega sozinho; aqui só toca o grito, dentro do toque, porque o iOS
 * bloqueia áudio fora de um gesto do usuário.
 */
function onCardOpen(pokemon: PokemonSummary): void {
  lastOpenedId = pokemon.id
  rememberSearch()
  cry.play(pokemon.id)
}

/** Navegação da aba de rotas (que só tem o id, sem o resumo completo). */
function openPokemonId(id: number): void {
  rememberSearch()
  cry.play(id)
  router.push({ name: 'pokemon', params: { id }, query: contextQuery.value })
}

// A Home fica em KeepAlive: ao voltar do detalhe, devolve o foco ao card que foi aberto (sem rolar,
// a posição já é restaurada pelo router) em vez de mandar quem usa teclado para o topo da página.
onActivated(() => {
  const id = lastOpenedId
  if (id === null) return
  lastOpenedId = null
  nextTick(() => {
    document
      .querySelector<HTMLElement>(`[data-pokemon-id="${id}"] .stretched-action`)
      ?.focus({ preventScroll: true })
  })
})

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
    </template>
    <template #header>
      <SearchField v-model="query" :recent="recent.searches" @clear-recent="recent.clearSearches" />
      <ListFilters
        class="mt-2"
        :game="game"
        :dex="dex"
        :types="typeFilter"
        :caught-filter="caughtFilter"
        :caught-count="caughtCount"
        :missing-count="missingCount"
        :versions="versions"
        :availability="availability"
        :simplified="view === 'routes'"
        @open-game="pickerOpen = true"
        @open-types="typesOpen = true"
        :advanced-count="advancedCount"
        @open-versions="versionsOpen = true"
        @open-advanced="openAdvanced"
        @select-dex="setDex"
        @select-caught="setCaughtFilter"
      />
    </template>

    <v-tabs v-if="game && ROUTE_GAMES.has(game.slug)" v-model="view" class="mb-3" density="compact">
      <v-tab value="pokemon">{{ t('home.pokemonTab') }}</v-tab>
      <v-tab value="routes">{{ t('home.routesTab') }}</v-tab>
    </v-tabs>

    <RouteList
      v-if="view === 'routes' && game"
      :game="game"
      :caught-ids="caughtIds"
      @select="openPokemonId"
      @toggle-caught="toggleCaught"
    />

    <template v-else>
      <RecentStrip
        v-if="recentItems.length && layout === 'cards'"
        :items="recentItems"
        class="mb-3"
        @select="openPokemonId"
        @clear="recent.clearPokemon"
      />
      <ResultsAnnouncer :count="filtered.length" :ready="!sourceLoading && !sourceError" />

      <div class="d-flex justify-end mb-2">
        <v-btn-toggle
          :model-value="layout"
          mandatory
          density="compact"
          variant="outlined"
          divided
          :aria-label="t('boxes.layout')"
          @update:model-value="setLayout"
        >
          <v-btn
            value="cards"
            :icon="mdiViewGridOutline"
            :aria-pressed="layout === 'cards'"
            :aria-label="t('boxes.cards')"
          />
          <v-btn
            value="boxes"
            :icon="mdiPackageVariantClosed"
            :aria-pressed="layout === 'boxes'"
            :aria-label="t('boxes.boxes')"
          />
        </v-btn-toggle>
      </div>

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

      <EmptyState
        v-else-if="isEmpty"
        :title="emptyTitle"
        :message="emptyMessage"
        :action-label="hasFilters ? t('home.clearFilters') : undefined"
        :action-icon="mdiFilterRemoveOutline"
        @action="clearFilters"
      />

      <PokemonBoxes
        v-else-if="layout === 'boxes'"
        :items="filtered"
        :caught-ids="game ? caughtIds : undefined"
        @toggle-caught="toggleCaught"
        @open="openPokemonId"
      />

      <PokemonGrid
        v-else
        :key="listKey"
        :items="items"
        :status="status"
        :error-message="errorMessage"
        :caught-ids="game ? caughtIds : undefined"
        :link-to="pokemonRoute"
        @load="loadMore"
        @retry="retry"
        @select="onCardOpen"
        @toggle-caught="toggleCaught"
      />
    </template>

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

    <VersionPickerSheet
      v-if="game"
      v-model="versionsOpen"
      :game-title="game.title"
      :versions="versions"
      :selected="availability"
      :counts="availabilityCounts"
      @toggle="toggleAvailability"
      @clear="clearAvailability"
    />

    <BackToTop />

    <AdvancedFilterSheet
      v-if="advancedMounted"
      v-model="advancedOpen"
      :filters="advanced"
      :abilities="pokemonData.table.value?.abilities ?? null"
      @update="setAdvanced"
      @clear="clearAdvanced"
    />
  </DefaultLayout>
</template>
