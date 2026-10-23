<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PokemonDetail, PokemonSpecies } from '@/types/pokemon'
import { formatHeight, formatWeight } from '@/utils/pokemon'
import InfoTile from '@/components/atoms/InfoTile.vue'

const props = defineProps<{
  pokemon: PokemonDetail
  species?: PokemonSpecies | null
}>()

const { t, locale } = useI18n()

const height = computed(() => formatHeight(props.pokemon.height, locale.value))
const weight = computed(() => formatWeight(props.pokemon.weight, locale.value))

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
    <v-card-title tag="h2" class="text-title-medium">{{ t('detail.about') }}</v-card-title>
    <v-card-text>
      <div class="about-grid">
        <InfoTile :label="t('detail.height')" :value="height" />
        <InfoTile :label="t('detail.weight')" :value="weight" />
        <InfoTile :label="t('detail.generation')" :value="generation ?? undefined" />
        <InfoTile :label="t('detail.category')" :value="category ?? undefined" />
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
