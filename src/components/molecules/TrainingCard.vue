<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PokemonDetail, PokemonSpecies } from '@/types/pokemon'
import { formatPercent, formatPokemonName } from '@/utils/pokemon'
import { captureProbability } from '@/utils/capture'
import { LATEST_GENERATION } from '@/utils/typeChart'
import InfoTile from '@/components/atoms/InfoTile.vue'

const props = defineProps<{
  pokemon: PokemonDetail
  species?: PokemonSpecies | null
  /** Geração do jogo selecionado (fórmula de captura); sem jogo, a mais recente. */
  generation?: number
}>()

const emit = defineEmits<{ openCapture: [] }>()

const { t, te, locale } = useI18n()

const evYield = computed(() =>
  props.pokemon.evYield.length
    ? props.pokemon.evYield.map((ev) => `${ev.value} ${t(`stat.${ev.name}`)}`).join(', ')
    : '—',
)

const growthRate = computed(() => {
  const slug = props.species?.growthRate
  if (!slug) return undefined
  return te(`growthRate.${slug}`) ? t(`growthRate.${slug}`) : formatPokemonName(slug)
})

const percent = (value: number) => formatPercent(value * 100, locale.value)

/** Poké Ball, sem status, na fórmula do jogo (a sheet de captura tem as outras bolas). */
function chance(rate: number, hp: number): number {
  const generation = Math.max(3, props.generation ?? LATEST_GENERATION)
  return captureProbability({ captureRate: rate, hp, ball: 1, status: 'none', generation })
}

const capture = computed(() => {
  if (!props.species) return null
  const rate = props.species.captureRate
  return {
    rate: String(rate),
    hint: t('detail.captureChance', {
      full: percent(chance(rate, 1)),
      min: percent(chance(rate, 0.01)),
    }),
  }
})
</script>

<template>
  <v-card>
    <v-card-title tag="h2" class="text-title-medium">{{ t('detail.training') }}</v-card-title>
    <v-card-text>
      <div class="training-grid">
        <InfoTile :label="t('detail.evYield')" :value="evYield" />
        <InfoTile
          :label="t('detail.baseExperience')"
          :value="pokemon.baseExperience != null ? String(pokemon.baseExperience) : undefined"
        />
        <InfoTile :label="t('detail.captureRate')" :value="capture?.rate" />
        <InfoTile
          :label="t('detail.baseHappiness')"
          :value="species?.baseHappiness != null ? String(species.baseHappiness) : undefined"
        />
        <InfoTile :label="t('detail.growthRate')" :value="growthRate" />
      </div>
      <p v-if="capture" class="text-body-small opacity-70 mt-3 mb-0">{{ capture.hint }}</p>
      <v-btn
        v-if="capture"
        variant="tonal"
        size="small"
        class="mt-3"
        aria-haspopup="dialog"
        @click="emit('openCapture')"
      >
        {{ t('capture.open') }}
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.training-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 12px;
}
</style>
