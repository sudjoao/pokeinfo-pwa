<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PokemonType } from '@/types/pokemon'
import { attackMultiplier, battleTypes, typesInGeneration } from '@/utils/typeChart'
import MultiplierGroups from '@/components/molecules/MultiplierGroups.vue'

const props = defineProps<{
  pokemonId: number
  types: readonly PokemonType[]
  /** Geração do jogo selecionado; sem jogo, a tabela atual. */
  generation?: number
  gameTitle?: string
}>()

const { t } = useI18n()

const entries = computed(() => {
  const defending = typesInGeneration(props.pokemonId, props.types, props.generation)
  return battleTypes(props.generation).map((type) => ({
    type,
    multiplier: attackMultiplier(type, defending, props.generation),
  }))
})

const note = computed(() =>
  props.generation && props.gameTitle
    ? t('detail.defensesGeneration', { n: props.generation, game: props.gameTitle })
    : t('detail.defensesCurrent'),
)
</script>

<template>
  <v-card>
    <v-card-title class="text-title-medium">{{ t('detail.typeDefenses') }}</v-card-title>
    <v-card-text class="d-flex flex-column ga-3">
      <MultiplierGroups :entries="entries" mode="defense" />
      <p class="text-body-small opacity-70 mb-0">{{ note }}</p>
    </v-card-text>
  </v-card>
</template>
