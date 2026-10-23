<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOverlayFocusReturn } from '@/composables/useOverlayFocusReturn'
import { formatPercent, itemSpriteUrl } from '@/utils/pokemon'
import { useItemName } from '@/composables/useItemName'
import {
  CAPTURE_STATUSES,
  ballsInGeneration,
  captureProbability,
  captureWithin,
  throwsFor,
  type CaptureStatus,
} from '@/utils/capture'

const props = defineProps<{
  name: string
  captureRate: number
  types: readonly string[]
  /** Geração do jogo selecionado (sem jogo: a mais recente). */
  generation: number
  /** Capturado no jogo selecionado (Repeat Ball). */
  caught: boolean
}>()

const open = defineModel<boolean>({ required: true })
useOverlayFocusReturn(open)

const { t, locale } = useI18n()

/** Gen 1–2 tinham outra conta; usa a da 3ª geração, que é a mais próxima. */
const formulaGeneration = computed(() => Math.max(3, props.generation))
const balls = computed(() => ballsInGeneration(formulaGeneration.value))
const ballSlug = ref('poke-ball')
watch(balls, (list) => {
  if (!list.some((b) => b.slug === ballSlug.value)) ballSlug.value = 'poke-ball'
})
const ball = computed(() => balls.value.find((b) => b.slug === ballSlug.value) ?? balls.value[0]!)
const itemName = useItemName(() => balls.value.map((b) => b.slug))

const hp = ref(100)
const status = ref<CaptureStatus>('none')
const level = ref(20)
const turns = ref(0)
const dark = ref(false)
const water = ref(false)

const multiplier = computed(() =>
  ball.value.multiplier({
    generation: formulaGeneration.value,
    types: props.types,
    level: level.value || 1,
    turns: turns.value || 0,
    dark: dark.value,
    water: water.value,
    caught: props.caught,
  }),
)

const probability = computed(() =>
  captureProbability({
    captureRate: props.captureRate,
    hp: Math.max(1, hp.value) / 100,
    ball: multiplier.value,
    status: status.value,
    generation: formulaGeneration.value,
  }),
)

const percent = (value: number) => formatPercent(value * 100, locale.value)
const throws = computed(() => throwsFor(probability.value))

const ballItems = computed(() =>
  balls.value.map((b) => ({ value: b.slug, title: itemName(b.slug) })),
)
const statusItems = computed(() =>
  CAPTURE_STATUSES.map((value) => ({ value, title: t(`capture.status.${value}`) })),
)
const multiplierText = computed(() =>
  Number.isFinite(multiplier.value) ? `×${multiplier.value.toLocaleString(locale.value)}` : '∞',
)
</script>

<template>
  <v-bottom-sheet v-model="open" scrollable :aria-label="t('capture.title', { name })">
    <v-card rounded="t-xl" :title="t('capture.title', { name })">
      <v-card-text class="capture-sheet__body d-flex flex-column ga-3">
        <div class="capture-sheet__result" aria-live="polite">
          <div class="text-display-small font-weight-bold">{{ percent(probability) }}</div>
          <div class="text-body-medium">{{ t('capture.perThrow') }}</div>
          <div class="text-body-small opacity-70 mt-1">
            {{ t('capture.within', { n: 5, pct: percent(captureWithin(probability, 5)) }) }}
            <template v-if="Number.isFinite(throws) && throws > 1">
              · {{ t('capture.throwsFor', { n: throws }) }}
            </template>
          </div>
        </div>

        <v-select
          v-model="ballSlug"
          :items="ballItems"
          :label="t('capture.ball')"
          density="compact"
          variant="outlined"
          hide-details
        >
          <template #prepend-inner>
            <img
              :src="itemSpriteUrl(ballSlug)"
              alt=""
              width="24"
              height="24"
              crossorigin="anonymous"
              class="capture-sheet__ball"
            />
          </template>
          <template #append-inner>
            <span class="text-label-medium opacity-70">{{ multiplierText }}</span>
          </template>
        </v-select>

        <div v-if="ball.uses === 'level'" class="d-flex align-center ga-3">
          <v-text-field
            v-model.number="level"
            type="number"
            min="1"
            max="100"
            :label="t('capture.level')"
            density="compact"
            variant="outlined"
            hide-details
            class="capture-sheet__small"
          />
        </div>
        <v-slider
          v-if="ball.uses === 'turns'"
          v-model="turns"
          :min="0"
          :max="15"
          :step="1"
          :label="t('capture.turns', { n: turns + 1 })"
          hide-details
          color="primary"
        />
        <v-switch
          v-if="ball.uses === 'dark'"
          v-model="dark"
          :label="t('capture.dark')"
          color="primary"
          density="compact"
          hide-details
        />
        <v-switch
          v-if="ball.uses === 'water'"
          v-model="water"
          :label="t('capture.water')"
          color="primary"
          density="compact"
          hide-details
        />
        <p v-if="ball.uses === 'caught'" class="text-body-small mb-0">
          {{ caught ? t('capture.repeatCaught') : t('capture.repeatNotCaught') }}
        </p>
        <p v-if="ball.uses === 'types'" class="text-body-small mb-0">
          {{ multiplier > 1 ? t('capture.netYes') : t('capture.netNo') }}
        </p>

        <v-slider
          v-model="hp"
          :min="1"
          :max="100"
          :step="1"
          :label="t('capture.hp', { n: hp })"
          hide-details
          color="primary"
        />
        <v-select
          v-model="status"
          :items="statusItems"
          :label="t('capture.statusLabel')"
          density="compact"
          variant="outlined"
          hide-details
        />
        <p class="text-body-small opacity-70 mb-0">
          {{ t('capture.hint', { rate: captureRate, gen: formulaGeneration }) }}
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="open = false">{{ t('common.done') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-bottom-sheet>
</template>

<style scoped>
.capture-sheet__body {
  max-height: 80vh;
}

.capture-sheet__result {
  text-align: center;
  padding: 8px 0;
}

.capture-sheet__ball {
  image-rendering: pixelated;
}

.capture-sheet__small {
  max-width: 120px;
}
</style>
