<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { mdiDeleteSweepOutline } from '@mdi/js'
import { gameContextQuery } from '@/utils/games'
import { usePokemonList } from '@/composables/usePokemonList'
import { TEAM_SIZE, useTeam, type TeamMember } from '@/composables/useTeam'
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
import TeamBench from '@/components/organisms/TeamBench.vue'
import TeamAnalysis from '@/components/organisms/TeamAnalysis.vue'

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
  version,
  setVersionFilter,
  exclusiveCounts,
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

const pickerOpen = ref(false)
const typesOpen = ref(false)
const tab = ref<'pick' | 'analysis'>('pick')
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
        :version-filter="version?.slug ?? null"
        :exclusive-counts="exclusiveCounts"
        @open-game="pickerOpen = true"
        @open-types="typesOpen = true"
        @select-dex="setDex"
        @select-caught="setCaughtFilter"
        @select-version="setVersionFilter"
      />
    </template>

    <section class="mb-4" :aria-label="t('team.heading')">
      <div class="d-flex align-center justify-space-between mb-2">
        <h2 class="text-title-medium">
          {{ t('team.heading') }}
          <span class="team-view__count opacity-60">
            {{ t('team.count', { n: team.size.value, max: TEAM_SIZE }) }}
          </span>
        </h2>
        <v-btn
          v-if="team.size.value"
          variant="text"
          size="small"
          :prepend-icon="mdiDeleteSweepOutline"
          @click="team.clear"
        >
          {{ t('team.clear') }}
        </v-btn>
      </div>
      <TeamBench
        :members="team.members.value"
        @select="openMember"
        @remove="team.remove($event.id)"
        @add="tab = 'pick'"
      />
    </section>

    <v-tabs v-model="tab" color="primary" class="mb-4" grow>
      <v-tab value="pick">{{ t('team.tabPick') }}</v-tab>
      <v-tab value="analysis">{{ t('team.tabAnalysis') }}</v-tab>
    </v-tabs>

    <template v-if="tab === 'analysis'">
      <EmptyState v-if="team.size.value === 0" :title="t('team.analysisEmpty')" />
      <TeamAnalysis
        v-else
        :members="team.members.value"
        :defense="team.defense.value"
        :threats="team.threats.value"
        :coverage="team.coverage.value"
        :gaps="team.gaps.value"
      />
    </template>

    <template v-else>
      <p class="text-body-small opacity-60 mb-3">{{ t('team.pickHint') }}</p>

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
        @load="loadMore"
        @retry="retry"
        @select="onCardSelect"
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

    <v-snackbar v-model="fullNotice" :timeout="2500">{{ t('team.full') }}</v-snackbar>
  </DetailLayout>
</template>

<style scoped>
.team-view__count {
  font-variant-numeric: tabular-nums;
  font-weight: 400;
}
</style>
