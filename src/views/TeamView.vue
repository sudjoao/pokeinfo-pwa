<script setup lang="ts">
import { computed, ref } from 'vue'
import { mdiFilterRemoveOutline } from '@mdi/js'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { gameContextQuery } from '@/utils/games'
import { usePokemonList } from '@/composables/usePokemonList'
import { useTeam } from '@/composables/useTeam'
import { useTeamActions } from '@/composables/useTeamActions'
import BackToTop from '@/components/atoms/BackToTop.vue'
import type { PokemonSummary } from '@/types/pokemon'
import DetailLayout from '@/components/templates/DetailLayout.vue'
import SearchField from '@/components/molecules/SearchField.vue'
import EmptyState from '@/components/molecules/EmptyState.vue'
import ResultsAnnouncer from '@/components/atoms/ResultsAnnouncer.vue'
import PokemonCardSkeleton from '@/components/molecules/PokemonCardSkeleton.vue'
import ListFilters from '@/components/organisms/ListFilters.vue'
import PokemonGrid from '@/components/organisms/PokemonGrid.vue'
import GamePickerSheet from '@/components/organisms/GamePickerSheet.vue'
import TypePickerSheet from '@/components/organisms/TypePickerSheet.vue'
import VersionPickerSheet from '@/components/organisms/VersionPickerSheet.vue'
import AdvancedFilterSheet from '@/components/organisms/AdvancedFilterSheet.vue'
import { usePokemonData } from '@/composables/usePokemonData'
import { useOverlayFocusReturn } from '@/composables/useOverlayFocusReturn'
import TeamPanel from '@/components/organisms/TeamPanel.vue'
import TeamTray from '@/components/organisms/TeamTray.vue'
import TeamOverlays from '@/components/organisms/TeamOverlays.vue'

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

const team = useTeam(() => game.value)

const router = useRouter()
const { t } = useI18n()
/** Desktop (≥ 960 px): painel lateral fixo. Abaixo disso: bandeja no rodapé + sheet. */
const { mdAndUp } = useDisplay()

const pickerOpen = ref(false)
const typesOpen = ref(false)
const versionsOpen = ref(false)
const advancedOpen = ref(false)
const pokemonData = usePokemonData()

/** Abre "Filtros" e já baixa a tabela (lista de habilidades, ordenação por stats). */
function openAdvanced(): void {
  advancedOpen.value = true
  pokemonData.load().catch(() => {})
}
const teamOpen = ref(false)
useOverlayFocusReturn(teamOpen)

const contextQuery = computed(() =>
  gameContextQuery(game.value && dex.value ? { game: game.value, dex: dex.value } : null),
)

const actions = useTeamActions(team, {
  game: () => game.value,
  context: () => contextQuery.value,
  candidates: () => filtered.value,
})

// Link compartilhado: o time dele vira o salvo do jogo, com desfazer se havia outro.
const previous = team.takeFromLink()
if (previous) actions.offerUndo(t('team.fromLink'), previous)

/** Altura do cabeçalho: busca (48) + linha de chips (32) + espaçamentos (igual à Home). */
const HEADER_EXTENSION_HEIGHT = 108

/** Tocar em um card entra/sai do time. */
function onCardSelect(pokemon: PokemonSummary): void {
  actions.toggle(pokemon.id)
}

/** Vaga vazia tocada no sheet: fecha para a pessoa escolher na lista. */
function onAddSlot(): void {
  teamOpen.value = false
}

function goBack(): void {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'home', query: contextQuery.value })
}
</script>

<template>
  <DetailLayout :title="t('team.title')" :extension-height="HEADER_EXTENSION_HEIGHT" @back="goBack">
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
        :versions="versions"
        :availability="availability"
        @open-game="pickerOpen = true"
        @open-types="typesOpen = true"
        :advanced-count="advancedCount"
        @open-versions="versionsOpen = true"
        @open-advanced="openAdvanced"
        @select-dex="setDex"
        @select-caught="setCaughtFilter"
      />
    </template>

    <v-row class="team-view" :class="{ 'team-view--tray': !mdAndUp }">
      <v-col cols="12" md="8">
        <p class="text-body-small opacity-70 mb-3">{{ t('team.pickHint') }}</p>
        <ResultsAnnouncer :count="filtered.length" :ready="!sourceLoading && !sourceError" />

        <v-row v-if="sourceLoading" density="compact">
          <v-col v-for="n in 12" :key="n" cols="6" sm="4" md="4" lg="3">
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
          :title="t('home.emptyTitle')"
          :message="t('home.emptyFiltered')"
          :action-label="hasFilters ? t('home.clearFilters') : undefined"
          :action-icon="mdiFilterRemoveOutline"
          @action="clearFilters"
        />

        <PokemonGrid
          v-else
          :key="listKey"
          :items="items"
          :status="status"
          :error-message="errorMessage"
          :caught-ids="game ? caughtIds : undefined"
          :selected-ids="actions.teamIds.value"
          wide
          @load="loadMore"
          @retry="retry"
          @select="onCardSelect"
          @toggle-caught="toggleCaught"
        />
      </v-col>

      <!-- Desktop: o time e a análise acompanham a rolagem num painel fixo. -->
      <v-col v-if="mdAndUp" cols="12" md="4">
        <div class="team-view__panel">
          <TeamPanel
            :members="team.members.value"
            :defense="team.defense.value"
            :threats="team.threats.value"
            :coverage="team.coverage.value"
            :gaps="team.gaps.value"
            :suggestions="actions.suggestions.value"
            @select="actions.openMember"
            @remove="actions.removeMember"
            @clear="actions.clearTeam"
            @add-suggestion="actions.toggle"
            @export-showdown="actions.copyShowdown"
            @import-showdown="actions.importOpen.value = true"
            @share="actions.shareTeam"
            @share-image="actions.openShareImage"
          />
        </div>
      </v-col>
    </v-row>

    <!-- Celular: bandeja fixa no rodapé; o time completo e a análise abrem num sheet. -->
    <template v-if="!mdAndUp">
      <TeamTray :members="team.members.value" @open="teamOpen = true" />
      <v-bottom-sheet v-model="teamOpen" :aria-label="t('team.heading')">
        <v-card class="team-view__sheet" rounded="t-xl">
          <v-card-text class="team-view__sheet-body">
            <TeamPanel
              :members="team.members.value"
              :defense="team.defense.value"
              :threats="team.threats.value"
              :coverage="team.coverage.value"
              :gaps="team.gaps.value"
              :suggestions="actions.suggestions.value"
              @select="actions.openMember"
              @remove="actions.removeMember"
              @add="onAddSlot"
              @clear="actions.clearTeam"
              @add-suggestion="actions.toggle"
              @export-showdown="actions.copyShowdown"
              @import-showdown="actions.importOpen.value = true"
              @share="actions.shareTeam"
              @share-image="actions.openShareImage"
            />
          </v-card-text>
          <v-card-actions class="team-view__sheet-actions">
            <v-spacer />
            <v-btn color="primary" variant="flat" @click="teamOpen = false">
              {{ t('team.close') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-bottom-sheet>
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

    <AdvancedFilterSheet
      v-model="advancedOpen"
      :filters="advanced"
      :abilities="pokemonData.table.value?.abilities ?? null"
      @update="setAdvanced"
      @clear="clearAdvanced"
    />

    <TeamOverlays :actions="actions" />
    <BackToTop :offset="mdAndUp ? 0 : 72" />
  </DetailLayout>
</template>

<style scoped>
/* Espaço para a bandeja fixa não cobrir a última linha de cards. */
.team-view--tray {
  padding-bottom: calc(72px + var(--safe-bottom));
}

/* Painel que acompanha a rolagem no desktop; rola por dentro quando a análise é maior que a tela. */
.team-view__panel {
  position: sticky;
  top: calc(var(--v-layout-top, 0px) + var(--safe-top) + 16px);
  max-height: calc(100dvh - var(--v-layout-top, 0px) - var(--safe-top) - 32px);
  overflow-y: auto;
  padding: 2px;
}

.team-view__sheet {
  display: flex;
  flex-direction: column;
  max-height: 90dvh;
}

.team-view__sheet-body {
  overflow-y: auto;
  padding-top: 20px;
}

.team-view__sheet-actions {
  padding-bottom: calc(8px + var(--safe-bottom));
}
</style>
