<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onActivated,
  reactive,
  ref,
  shallowRef,
  useTemplateRef,
  watch,
} from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  mdiCheckboxMultipleMarkedOutline,
  mdiClipboardListOutline,
  mdiFilterRemoveOutline,
  mdiPackageVariantClosed,
  mdiViewGridOutline,
} from '@mdi/js'
import { gameContextQuery } from '@/utils/games'
import { ROUTE_GAMES } from '@/data/routeGames'
import { hasLeague } from '@/utils/league'
import { usePokemonList } from '@/composables/usePokemonList'
import { useCry } from '@/composables/useCry'
import { useDexLabel } from '@/composables/useDexLabel'
import { useShortcut } from '@/composables/useShortcut'
import { announce } from '@/composables/useAnnouncer'
import { useCaughtStore } from '@/stores/caught'
import SelectionBar from '@/components/organisms/SelectionBar.vue'
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
import PokemonBoxes, { type BoxEntry } from '@/components/organisms/PokemonBoxes.vue'
import AppNotice from '@/components/molecules/AppNotice.vue'
import BackToTop from '@/components/atoms/BackToTop.vue'
import GamePickerSheet from '@/components/organisms/GamePickerSheet.vue'
import TypePickerSheet from '@/components/organisms/TypePickerSheet.vue'
import VersionPickerSheet from '@/components/organisms/VersionPickerSheet.vue'
import { useMountOnOpen } from '@/composables/useMountOnOpen'
import { usePokemonData } from '@/composables/usePokemonData'

// Só usados ao abrir as abas "Rotas" (com ~170 KB de dados), "Líderes" e "Time" e o sheet de filtros
// (VSelect, VSlider…): ficam fora do carregamento inicial.
const RouteList = defineAsyncComponent(() => import('@/components/organisms/RouteList.vue'))
const LeagueList = defineAsyncComponent(() => import('@/components/organisms/LeagueList.vue'))
const TeamTab = defineAsyncComponent(() => import('@/components/organisms/TeamTab.vue'))
const AdvancedFilterSheet = defineAsyncComponent(
  () => import('@/components/organisms/AdvancedFilterSheet.vue'),
)
const ExportListSheet = defineAsyncComponent(
  () => import('@/components/organisms/ExportListSheet.vue'),
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
  source,
  filtered,
  exportSource,
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

type HomeTab = 'pokemon' | 'team' | 'routes' | 'leaders'

/**
 * Aba ativa na Home. "team" (o time salvo do jogo) existe sempre; "routes" só com um jogo com dados
 * de encontro selecionado e "leaders" com um jogo que tem ginásios/Elite 4 (Legends: Arceus e Z-A
 * não têm).
 */
const view = ref<HomeTab>('pokemon')
const hasRoutesTab = computed(() => !!game.value && ROUTE_GAMES.has(game.value.slug))
const hasLeadersTab = computed(() => !!game.value && hasLeague(game.value.slug))
// Trocar de jogo mantém a aba (o Time mostra o do jogo novo); só volta para Pokémon se ela sumiu.
watch([hasRoutesTab, hasLeadersTab], ([routes, leaders]) => {
  if ((view.value === 'routes' && !routes) || (view.value === 'leaders' && !leaders))
    view.value = 'pokemon'
})

/**
 * As abas ficam grudadas no topo: trocar de aba lá embaixo da lista mostraria o meio (ou o fim) da
 * outra. Cada aba guarda a própria rolagem (até trocar de jogo); a primeira visita começa do topo.
 */
const tabScroll = new Map<HomeTab, number>()
watch(view, (next, previous) => {
  tabScroll.set(previous, window.scrollY)
  const top = tabScroll.get(next) ?? 0
  nextTick(() => window.scrollTo({ top }))
})
watch(
  () => game.value?.slug,
  () => tabScroll.clear(),
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

/** Busca ou filtros além do jogo e do filtro de captura (a exportação escolhe o recorte de captura). */
const narrowed = computed(
  () =>
    Boolean(query.value.trim()) ||
    typeFilter.value.length > 0 ||
    availability.value.length > 0 ||
    advancedCount.value > 0,
)

const exportOpen = ref(false)
const exportMounted = useMountOnOpen(exportOpen)
/** Lista lida ao abrir: o estado de captura e os filtros daquele momento. */
const exportEntries = shallowRef<readonly BoxEntry[]>([])
/**
 * "Exportar" já abre no que a tela mostra quando há filtro de captura; sem ele, nos que faltam
 * (o uso principal: levar a lista para pesquisar onde capturar).
 */
const exportScope = computed(() => caughtFilter.value ?? 'missing')
/** O sheet está exportando a seleção (abre em "todos", sem o aviso de filtros). */
const exportSelection = ref(false)
const notice = ref<string | null>(null)

function openExport(): void {
  exportEntries.value = exportSource()
  exportSelection.value = false
  exportOpen.value = true
}

/*
 * Seleção múltipla: "Selecionar" troca o toque no card (abrir a ficha) por escolher, e a barra do
 * rodapé marca a captura de todos de uma vez ou copia a lista deles. A chave é o id da forma
 * (o card); a captura vai para a espécie, como no toque na Poké Bola.
 */
const caughtStore = useCaughtStore()
const selecting = ref(false)
const selectedIds = reactive(new Set<number>())
const selectionBarHeight = ref(0)
const selectButton = useTemplateRef<{ $el: HTMLElement }>('selectButton')

function startSelection(): void {
  selecting.value = true
  announce(t('select.started'))
}

/** Sai do modo; o foco volta ao "Selecionar" (a barra, onde ele estava, some). */
function exitSelection(options: { focus?: boolean; silent?: boolean } = {}): void {
  if (!selecting.value) return
  selecting.value = false
  selectedIds.clear()
  if (!options.silent) announce(t('select.ended'))
  if (options.focus) nextTick(() => selectButton.value?.$el.focus())
}

function toggleSelecting(): void {
  if (selecting.value) exitSelection()
  else startSelection()
}

function toggleSelected(id: number): void {
  if (selectedIds.has(id)) selectedIds.delete(id)
  else selectedIds.add(id)
}

function setSelected(ids: readonly number[], selected: boolean): void {
  for (const id of ids) {
    if (selected) selectedIds.add(id)
    else selectedIds.delete(id)
  }
}

/** "Selecionar todos" vale para a lista inteira com os filtros, não só os cards já carregados. */
const allSelected = computed(
  () => filtered.value.length > 0 && filtered.value.every((entry) => selectedIds.has(entry.id)),
)

function toggleAll(): void {
  const select = !allSelected.value
  setSelected(
    filtered.value.map((entry) => entry.id),
    select,
  )
  announce(t('select.count', selectedIds.size))
}

/** Na grade, o card vira botão de seleção; fora do modo, abre a ficha (com o grito). */
function onGridSelect(pokemon: PokemonSummary): void {
  if (selecting.value) toggleSelected(pokemon.id)
  else onCardOpen(pokemon)
}

/** Selecionados na ordem da Pokédex (a fonte), não na ordem dos toques. */
function selectedEntries(): BoxEntry[] {
  return source.value.filter((entry) => selectedIds.has(entry.id))
}

/** Marcação em lote: só as espécies que mudam entram no desfazer (e na contagem do aviso). */
const markUndo = shallowRef<{ text: string; game: string; ids: number[]; caught: boolean } | null>(
  null,
)

function markSelected(caught: boolean): void {
  const current = game.value
  if (!current) return
  const marked = caughtStore.caughtIn(current.slug)
  const species = new Set(selectedEntries().map((entry) => entry.speciesId ?? entry.id))
  const changed = [...species].filter((id) => marked.has(id) !== caught)
  exitSelection({ focus: true, silent: true })
  if (!changed.length) {
    notice.value = t(caught ? 'select.alreadyCaught' : 'select.alreadyMissing')
    return
  }
  caughtStore.setMany(current.slug, changed, caught)
  markUndo.value = {
    text: t(caught ? 'select.markedCaught' : 'select.markedMissing', changed.length),
    game: current.slug,
    ids: changed,
    caught,
  }
}

function undoMark(): void {
  const last = markUndo.value
  if (last) caughtStore.setMany(last.game, last.ids, !last.caught)
}

function copySelection(): void {
  exportEntries.value = selectedEntries()
  exportSelection.value = true
  exportOpen.value = true
}

useShortcut(['Escape'], () => exitSelection({ focus: true }))

// Outro jogo ou Pokédex é outra lista (e outra captura); a seleção também não vale nas outras abas.
watch([() => game.value?.slug, () => dex.value?.slug], () => exitSelection({ silent: true }))
watch(view, (value) => value !== 'pokemon' && exitSelection({ silent: true }))

function onExportCopied(count: number): void {
  notice.value = t('export.copied', count)
}

/** Link absoluto da ficha, com o jogo (é lá que fica "Onde encontrar"). */
function pokemonLink(id: number): string {
  const href = router.resolve({ name: 'pokemon', params: { id }, query: contextQuery.value }).href
  return new URL(href, window.location.origin).href
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
</script>

<template>
  <DefaultLayout :extension-height="HEADER_EXTENSION_HEIGHT">
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
        :simplified="view === 'routes' || view === 'leaders'"
        @open-game="pickerOpen = true"
        @open-types="typesOpen = true"
        :advanced-count="advancedCount"
        @open-versions="versionsOpen = true"
        @open-advanced="openAdvanced"
        @select-dex="setDex"
        @select-caught="setCaughtFilter"
      />
    </template>

    <v-tabs v-model="view" class="home-tabs mb-3" density="compact">
      <v-tab value="pokemon">{{ t('home.pokemonTab') }}</v-tab>
      <v-tab value="team">{{ t('home.teamTab') }}</v-tab>
      <v-tab v-if="hasRoutesTab" value="routes">{{ t('home.routesTab') }}</v-tab>
      <v-tab v-if="hasLeadersTab" value="leaders">{{ t('home.leadersTab') }}</v-tab>
    </v-tabs>

    <RouteList
      v-if="view === 'routes' && game"
      :game="game"
      :caught-ids="caughtIds"
      @select="openPokemonId"
      @toggle-caught="toggleCaught"
    />

    <LeagueList v-else-if="view === 'leaders' && game" :game="game" @select="openPokemonId" />

    <TeamTab
      v-else-if="view === 'team'"
      :game="game"
      :dex="dex"
      :candidates="filtered"
      :types="typeFilter"
    />

    <template v-else>
      <RecentStrip
        v-if="recentItems.length && layout === 'cards' && !selecting"
        :items="recentItems"
        class="mb-3"
        @select="openPokemonId"
        @clear="recent.clearPokemon"
      />
      <ResultsAnnouncer :count="filtered.length" :ready="!sourceLoading && !sourceError" />

      <div class="d-flex align-center ga-2 mb-2">
        <v-btn
          variant="tonal"
          :prepend-icon="mdiClipboardListOutline"
          :disabled="sourceLoading || !!sourceError"
          aria-haspopup="dialog"
          @click="openExport"
        >
          {{ t('export.action') }}
        </v-btn>
        <v-btn
          ref="selectButton"
          :variant="selecting ? 'flat' : 'tonal'"
          :color="selecting ? 'primary' : undefined"
          :prepend-icon="mdiCheckboxMultipleMarkedOutline"
          :disabled="!selecting && (sourceLoading || !!sourceError || isEmpty)"
          :aria-pressed="selecting"
          @click="toggleSelecting"
        >
          {{ t('select.action') }}
        </v-btn>
        <v-spacer />
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

      <SelectionBar
        v-if="selecting"
        :count="selectedIds.size"
        :total="filtered.length"
        :all-selected="allSelected"
        :can-mark="!!game"
        @close="exitSelection({ focus: true })"
        @toggle-all="toggleAll"
        @mark="markSelected"
        @copy="copySelection"
        @resize="selectionBarHeight = $event"
      />

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
        :selecting="selecting"
        :selected-ids="selectedIds"
        @toggle-caught="toggleCaught"
        @open="openPokemonId"
        @select="toggleSelected"
        @select-many="setSelected"
      />

      <PokemonGrid
        v-else
        :key="listKey"
        :items="items"
        :status="status"
        :error-message="errorMessage"
        :caught-ids="game ? caughtIds : undefined"
        :selected-ids="selecting ? selectedIds : undefined"
        :selectable="selecting"
        :link-to="selecting ? undefined : pokemonRoute"
        @load="loadMore"
        @retry="retry"
        @select="onGridSelect"
        @toggle-caught="toggleCaught"
      />

      <!-- A barra de seleção cobre o fim da lista: o espaço dela entra embaixo. -->
      <div v-if="selecting" :style="{ height: `${selectionBarHeight}px` }" aria-hidden="true" />
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

    <BackToTop :offset="selecting ? selectionBarHeight : 0" />

    <ExportListSheet
      v-if="exportMounted"
      v-model="exportOpen"
      :entries="exportEntries"
      :caught-ids="game ? caughtIds : undefined"
      :game="game"
      :dex="dex"
      :initial-scope="exportSelection ? 'all' : exportScope"
      :filtered="!exportSelection && narrowed"
      :selection="exportSelection"
      :link-for="pokemonLink"
      @copied="onExportCopied"
    />

    <AppNotice :text="notice" location="top" @close="notice = null" />
    <AppNotice
      :text="markUndo?.text ?? null"
      location="top"
      :action-label="t('common.undo')"
      @action="undoMark"
      @close="markUndo = null"
    />

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

<style scoped>
/* Abas grudadas logo abaixo do cabeçalho (busca e filtros), por cima da lista que rola. */
.home-tabs {
  position: sticky;
  top: calc(var(--v-layout-top, 0px) + var(--safe-top));
  z-index: 2;
  background: rgb(var(--v-theme-background));
}
</style>
