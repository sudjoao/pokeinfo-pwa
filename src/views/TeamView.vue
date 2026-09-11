<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import { gameContextQuery } from '@/utils/games'
import { usePokemonList } from '@/composables/usePokemonList'
import { useTeam, type TeamMember } from '@/composables/useTeam'
import { useCry } from '@/composables/useCry'
import type { PokemonSummary } from '@/types/pokemon'
import DetailLayout from '@/components/templates/DetailLayout.vue'
import SearchField from '@/components/molecules/SearchField.vue'
import EmptyState from '@/components/molecules/EmptyState.vue'
import PokemonCardSkeleton from '@/components/molecules/PokemonCardSkeleton.vue'
import ListFilters from '@/components/organisms/ListFilters.vue'
import PokemonGrid from '@/components/organisms/PokemonGrid.vue'
import GamePickerSheet from '@/components/organisms/GamePickerSheet.vue'
import TypePickerSheet from '@/components/organisms/TypePickerSheet.vue'
import VersionPickerSheet from '@/components/organisms/VersionPickerSheet.vue'
import TeamPanel from '@/components/organisms/TeamPanel.vue'
import TeamTray from '@/components/organisms/TeamTray.vue'

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
  versions,
  availability,
  toggleAvailability,
  clearAvailability,
  availabilityCounts,
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

const team = useTeam()

const router = useRouter()
const cry = useCry()
const { t } = useI18n()
/** Desktop (≥ 960 px): painel lateral fixo. Abaixo disso: bandeja no rodapé + sheet. */
const { mdAndUp } = useDisplay()

const pickerOpen = ref(false)
const typesOpen = ref(false)
const versionsOpen = ref(false)
const teamOpen = ref(false)
const fullNotice = ref(false)

/** Altura do cabeçalho: busca (48) + linha de chips (32) + espaçamentos (igual à Home). */
const HEADER_EXTENSION_HEIGHT = 108

/** Ids do time em Set: o grid marca os cards já escolhidos. */
const teamIds = computed(() => new Set(team.ids.value))

const contextQuery = computed(() =>
  gameContextQuery(game.value && dex.value ? { game: game.value, dex: dex.value } : null),
)

/** Tocar em um card entra/sai do time; com 6 já escolhidos, avisa em vez de trocar. */
function onCardSelect(pokemon: PokemonSummary): void {
  if (team.toggle(pokemon.id) === 'full') fullNotice.value = true
}

/** Tocar em um membro abre o detalhe (com o grito no gesto, como na Home). */
function openMember(member: TeamMember): void {
  cry.play(member.id)
  router.push({ name: 'pokemon', params: { id: member.id }, query: contextQuery.value })
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
        @open-versions="versionsOpen = true"
        @select-dex="setDex"
        @select-caught="setCaughtFilter"
      />
    </template>

    <v-row class="team-view" :class="{ 'team-view--tray': !mdAndUp }">
      <v-col cols="12" md="8">
        <p class="text-body-small opacity-60 mb-3">{{ t('team.pickHint') }}</p>

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
        />

        <PokemonGrid
          v-else
          :key="listKey"
          :items="items"
          :status="status"
          :error-message="errorMessage"
          :caught-ids="game ? caughtIds : undefined"
          :selected-ids="teamIds"
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
            @select="openMember"
            @remove="team.remove($event.id)"
            @clear="team.clear"
          />
        </div>
      </v-col>
    </v-row>

    <!-- Celular: bandeja fixa no rodapé; o time completo e a análise abrem num sheet. -->
    <template v-if="!mdAndUp">
      <TeamTray :members="team.members.value" @open="teamOpen = true" />
      <v-bottom-sheet v-model="teamOpen">
        <v-card class="team-view__sheet" rounded="t-xl" :aria-label="t('team.heading')">
          <v-card-text class="team-view__sheet-body">
            <TeamPanel
              :members="team.members.value"
              :defense="team.defense.value"
              :threats="team.threats.value"
              :coverage="team.coverage.value"
              :gaps="team.gaps.value"
              @select="openMember"
              @remove="team.remove($event.id)"
              @add="onAddSlot"
              @clear="team.clear"
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

    <v-snackbar v-model="fullNotice" :timeout="2500" location="top">{{
      t('team.full')
    }}</v-snackbar>
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
