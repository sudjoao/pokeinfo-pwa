<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiEgg } from '@mdi/js'
import type { PokemonSpecies } from '@/types/pokemon'
import { formatPercent, formatPokemonName, genderRatio } from '@/utils/pokemon'
import { eggSteps } from '@/utils/stats'
import InfoTile from '@/components/atoms/InfoTile.vue'

const props = defineProps<{ species: PokemonSpecies }>()

const emit = defineEmits<{ openCompatible: [] }>()

const { t, te, locale, n } = useI18n()

const gender = computed(() => {
  const ratio = genderRatio(props.species.genderRate)
  if (!ratio) return t('detail.genderless')
  return `♀ ${formatPercent(ratio.female, locale.value)} · ♂ ${formatPercent(ratio.male, locale.value)}`
})

/** Grupo de ovo traduzido; um grupo novo da PokéAPI cai no nome formatado. */
function eggGroupLabel(name: string): string {
  return te(`eggGroup.${name}`) ? t(`eggGroup.${name}`) : formatPokemonName(name)
}

const eggGroups = computed(() => props.species.eggGroups.map(eggGroupLabel).join(', ') || '—')

const cycles = computed(() => {
  const counter = props.species.hatchCounter
  if (counter == null) return undefined
  return t('detail.eggCyclesValue', { cycles: counter, steps: n(eggSteps(counter)) })
})

const canBreed = computed(() => !props.species.eggGroups.includes('no-eggs'))
</script>

<template>
  <v-card>
    <v-card-title class="text-title-medium">{{ t('detail.breeding') }}</v-card-title>
    <v-card-text>
      <div class="breeding-grid">
        <InfoTile :label="t('detail.eggGroups')" :value="eggGroups" />
        <InfoTile :label="t('detail.gender')" :value="gender" />
        <InfoTile :label="t('detail.eggCycles')" :value="cycles" />
      </div>
      <v-btn
        v-if="canBreed"
        class="mt-3"
        variant="tonal"
        color="primary"
        :prepend-icon="mdiEgg"
        aria-haspopup="dialog"
        @click="emit('openCompatible')"
      >
        {{ t('detail.eggCompatibleOpen') }}
      </v-btn>
      <p v-else class="text-body-small opacity-70 mt-3 mb-0">{{ t('detail.eggNoEggs') }}</p>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.breeding-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 12px;
}
</style>
