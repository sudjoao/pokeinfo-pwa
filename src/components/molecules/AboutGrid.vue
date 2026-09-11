<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PokemonDetail, PokemonSpecies } from '@/types/pokemon'
import {
  formatHeight,
  formatPercent,
  formatPokemonName,
  formatWeight,
  genderRatio,
} from '@/utils/pokemon'
import InfoTile from '@/components/atoms/InfoTile.vue'

const props = defineProps<{
  pokemon: PokemonDetail
  species?: PokemonSpecies | null
}>()

const { t, te, locale } = useI18n()

const height = computed(() => formatHeight(props.pokemon.height, locale.value))
const weight = computed(() => formatWeight(props.pokemon.weight, locale.value))

const gender = computed(() => {
  if (!props.species) return null
  const ratio = genderRatio(props.species.genderRate)
  if (!ratio) return t('detail.genderless')
  return `♀ ${formatPercent(ratio.female, locale.value)} · ♂ ${formatPercent(ratio.male, locale.value)}`
})

/** Grupo de ovo traduzido; um grupo novo da PokéAPI cai no nome formatado. */
function eggGroupLabel(name: string): string {
  return te(`eggGroup.${name}`) ? t(`eggGroup.${name}`) : formatPokemonName(name)
}

const eggGroups = computed(() => props.species?.eggGroups.map(eggGroupLabel).join(', ') ?? null)

const generation = computed(() =>
  props.species?.generation ? t('detail.generationValue', { n: props.species.generation }) : null,
)

const category = computed(() => {
  if (!props.species) return null
  if (props.species.isMythical) return t('detail.categoryMythical')
  if (props.species.isLegendary) return t('detail.categoryLegendary')
  if (props.species.isBaby) return t('detail.categoryBaby')
  return t('detail.categoryCommon')
})
</script>

<template>
  <v-card>
    <v-card-title class="text-title-medium">{{ t('detail.about') }}</v-card-title>
    <v-card-text>
      <div class="about-grid">
        <InfoTile :label="t('detail.height')" :value="height" />
        <InfoTile :label="t('detail.weight')" :value="weight" />
        <InfoTile :label="t('detail.gender')" :value="gender ?? undefined" />
        <InfoTile :label="t('detail.eggGroups')" :value="eggGroups ?? undefined" />
        <InfoTile :label="t('detail.generation')" :value="generation ?? undefined" />
        <InfoTile :label="t('detail.category')" :value="category ?? undefined" />
        <InfoTile
          :label="t('detail.captureRate')"
          :value="species ? String(species.captureRate) : undefined"
        />
        <InfoTile
          :label="t('detail.baseHappiness')"
          :value="species?.baseHappiness != null ? String(species.baseHappiness) : undefined"
        />
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.about-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 12px;
}

@media (min-width: 600px) {
  .about-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
