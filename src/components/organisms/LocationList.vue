<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Game } from '@/data/games'
import type { PokemonEncounters } from '@/types/pokemon'
import type { SectionStatus } from '@/composables/usePokemonDetail'
import { gamesWithoutEncounterData, groupEncountersByGame } from '@/utils/encounters'
import LocationRow from '@/components/molecules/LocationRow.vue'

const props = defineProps<{
  encounters: PokemonEncounters | null
  status: SectionStatus
  /** Jogo selecionado na Home (via URL); null mostra todos os jogos. */
  game: Game | null
}>()

const emit = defineEmits<{ retry: [] }>()

const { t } = useI18n()

/** Com um jogo na URL, o usuário pode alternar para a visão de todos os jogos. */
const showAll = ref(false)
watch(
  () => props.game?.slug,
  () => (showAll.value = false),
)

const groups = computed(() => (props.encounters ? groupEncountersByGame(props.encounters) : []))
const filtering = computed(() => props.game !== null && !showAll.value)
const gameLocations = computed(() =>
  props.game ? (props.encounters?.[props.game.slug] ?? []) : [],
)

/** Painel aberto na visão geral: o jogo da URL, se ele tiver locais. */
const openPanel = ref<string | undefined>(undefined)
watch(
  [groups, () => props.game?.slug],
  ([list, slug]) => {
    openPanel.value = list.some((group) => group.game.slug === slug) ? slug : undefined
  },
  { immediate: true },
)

const missingGames = computed(() =>
  gamesWithoutEncounterData()
    .map((game) => game.title)
    .join(', '),
)
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
      <span class="text-title-medium">{{ t('detail.locations') }}</span>
      <v-btn
        v-if="game && status === 'ready'"
        size="small"
        variant="text"
        color="primary"
        class="text-none"
        @click="showAll = !showAll"
      >
        {{
          showAll
            ? t('detail.locationsShowGame', { game: game.title })
            : t('detail.locationsShowAll')
        }}
      </v-btn>
    </v-card-title>

    <v-card-text>
      <v-skeleton-loader v-if="status === 'loading'" type="list-item-two-line@3" />

      <div
        v-else-if="status === 'error' || !encounters"
        class="d-flex flex-column align-start ga-2"
      >
        <span>{{ t('detail.locationsError') }}</span>
        <v-btn color="primary" variant="tonal" size="small" @click="emit('retry')">
          {{ t('common.retry') }}
        </v-btn>
      </div>

      <!-- Só o jogo da URL -->
      <template v-else-if="filtering && game">
        <p class="text-label-medium opacity-70 mb-2">
          {{ t('detail.locationsIn', { game: game.title }) }}
        </p>
        <p v-if="!game.hasEncounterData" class="text-body-medium opacity-70 mb-0">
          {{ t('detail.locationsNoData', { game: game.title }) }}
        </p>
        <p v-else-if="!gameLocations.length" class="text-body-medium opacity-70 mb-0">
          {{ t('detail.locationsNoneInGame', { game: game.title }) }}
        </p>
        <ul v-else class="location-list">
          <LocationRow
            v-for="location in gameLocations"
            :key="location.area"
            :location="location"
            :game="game"
          />
        </ul>
      </template>

      <!-- Todos os jogos, um painel por jogo -->
      <template v-else>
        <p v-if="!groups.length" class="text-body-medium opacity-70 mb-0">
          {{ t('detail.locationsNone') }}
        </p>
        <v-expansion-panels v-else v-model="openPanel" variant="accordion">
          <v-expansion-panel
            v-for="group in groups"
            :key="group.game.slug"
            :value="group.game.slug"
          >
            <v-expansion-panel-title>
              <span class="text-body-medium font-weight-medium">{{ group.game.title }}</span>
              <span class="text-label-small opacity-70 ms-2">
                {{ t('detail.locationsCount', group.locations.length) }}
              </span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <ul class="location-list">
                <LocationRow
                  v-for="location in group.locations"
                  :key="location.area"
                  :location="location"
                  :game="group.game"
                />
              </ul>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
        <p class="text-body-small opacity-60 mt-3 mb-0">
          {{ t('detail.locationsMissingGames', { games: missingGames }) }}
        </p>
      </template>

      <p v-if="status === 'ready' && encounters" class="text-body-small opacity-60 mt-2 mb-0">
        {{ t('detail.locationsHint') }}
      </p>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.location-list {
  padding: 0;
  margin: 0;
}
</style>
