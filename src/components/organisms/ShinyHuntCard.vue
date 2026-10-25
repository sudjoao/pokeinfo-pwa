<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch, type ComponentPublicInstance } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiMinus, mdiPlus, mdiRestore, mdiShimmer } from '@mdi/js'
import type { ShinyHunt } from '@/stores/shiny'
import { formatPercent } from '@/utils/pokemon'
import { chanceByNow, hasMasuda, hasShinyCharm, shinyOdds } from '@/utils/shiny'
import { prefersReducedMotion } from '@/composables/usePrefersReducedMotion'

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

// "Tirar" fica desabilitado no zero e "Zerar" some: se o foco estava neles, iria para o body.
const plus = useTemplateRef<ComponentPublicInstance>('plus')
function focusPlus(): void {
  nextTick(() => (plus.value?.$el as HTMLElement | undefined)?.focus())
}

// Cada encontro somado dá um "pulo" no número: o retorno de que o toque contou, sem olhar o dígito.
const countEl = useTemplateRef<HTMLElement>('countEl')
watch(count, (value, old) => {
  if (value <= old || prefersReducedMotion()) return
  countEl.value?.animate([{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }], {
    duration: 220,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  })
})

function decrement(): void {
  emit('count', -1)
  if (count.value <= 1) focusPlus()
}

function reset(): void {
  emit('reset')
  focusPlus()
}
const odds = computed(() =>
  shinyOdds(props.generation, props.hunt?.charm ?? false, props.hunt?.masuda ?? false),
)
const byNow = computed(() =>
  formatPercent(chanceByNow(odds.value, count.value) * 100, locale.value),
)
</script>

<template>
  <v-card>
    <v-card-title tag="h2" class="text-title-medium d-flex align-center ga-2">
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
          @click="decrement"
        />
        <div class="text-center" aria-live="polite">
          <div ref="countEl" class="shiny-hunt__count text-headline-small">{{ n(count) }}</div>
          <div class="text-label-small opacity-70">{{ t('shiny.encounters') }}</div>
        </div>
        <v-btn
          ref="plus"
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
          @click="reset"
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
