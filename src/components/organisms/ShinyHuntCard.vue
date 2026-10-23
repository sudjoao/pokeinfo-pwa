<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiMinus, mdiPlus, mdiRestore, mdiShimmer } from '@mdi/js'
import type { ShinyHunt } from '@/stores/shiny'
import { formatPercent } from '@/utils/pokemon'
import { chanceByNow, hasMasuda, hasShinyCharm, shinyOdds } from '@/utils/shiny'

const props = defineProps<{
  gameTitle: string
  generation: number
  /** Shiny já capturado neste jogo. */
  caught: boolean
  hunt: ShinyHunt | null
}>()

const emit = defineEmits<{
  toggleCaught: []
  count: [delta: number]
  setCharm: [value: boolean]
  setMasuda: [value: boolean]
  reset: []
}>()

const { t, locale, n } = useI18n()

const count = computed(() => props.hunt?.count ?? 0)
const odds = computed(() =>
  shinyOdds(props.generation, props.hunt?.charm ?? false, props.hunt?.masuda ?? false),
)
const byNow = computed(() =>
  formatPercent(chanceByNow(odds.value, count.value) * 100, locale.value),
)
</script>

<template>
  <v-card>
    <v-card-title class="text-title-medium d-flex align-center ga-2">
      <v-icon :icon="mdiShimmer" size="20" />
      {{ t('shiny.title', { game: gameTitle }) }}
    </v-card-title>
    <v-card-text class="d-flex flex-column ga-3">
      <v-switch
        :model-value="caught"
        :label="t('shiny.caught')"
        color="secondary"
        density="compact"
        hide-details
        @update:model-value="emit('toggleCaught')"
      />

      <div class="d-flex align-center flex-wrap ga-3">
        <v-btn
          :icon="mdiMinus"
          variant="tonal"
          size="small"
          :disabled="count === 0"
          :aria-label="t('shiny.decrement')"
          @click="emit('count', -1)"
        />
        <div class="text-center" aria-live="polite">
          <div class="shiny-hunt__count text-headline-small">{{ n(count) }}</div>
          <div class="text-label-small opacity-70">{{ t('shiny.encounters') }}</div>
        </div>
        <v-btn
          :icon="mdiPlus"
          color="primary"
          size="large"
          :aria-label="t('shiny.increment')"
          @click="emit('count', 1)"
        />
        <v-btn
          v-if="count"
          variant="text"
          size="small"
          :prepend-icon="mdiRestore"
          class="ms-auto"
          @click="emit('reset')"
        >
          {{ t('shiny.reset') }}
        </v-btn>
      </div>

      <div class="d-flex flex-wrap gc-4">
        <v-switch
          v-if="hasShinyCharm(generation)"
          :model-value="hunt?.charm ?? false"
          :label="t('shiny.charm')"
          color="primary"
          density="compact"
          hide-details
          @update:model-value="emit('setCharm', Boolean($event))"
        />
        <v-switch
          v-if="hasMasuda(generation)"
          :model-value="hunt?.masuda ?? false"
          :label="t('shiny.masuda')"
          color="primary"
          density="compact"
          hide-details
          @update:model-value="emit('setMasuda', Boolean($event))"
        />
      </div>

      <p class="text-body-medium mb-0">
        {{ t('shiny.odds', { n: n(odds.oneIn) }) }} ·
        {{ t('shiny.byNow', { pct: byNow }) }}
      </p>
      <p class="text-body-small opacity-70 mb-0">{{ t('shiny.hint') }}</p>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.shiny-hunt__count {
  min-width: 4ch;
  font-variant-numeric: tabular-nums;
}
</style>
