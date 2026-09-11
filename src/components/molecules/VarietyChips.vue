<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { PokemonVariety } from '@/types/pokemon'
import { formLabel } from '@/utils/evolution'

defineProps<{
  varieties: PokemonVariety[]
  speciesName: string
  currentId: number
}>()

const emit = defineEmits<{ select: [pokemonId: number] }>()

const { t } = useI18n()

function label(variety: PokemonVariety, speciesName: string): string {
  return variety.isDefault ? t('detail.defaultForm') : formLabel(variety.name, speciesName)
}
</script>

<template>
  <v-card>
    <v-card-title class="text-title-medium">{{ t('detail.forms') }}</v-card-title>
    <v-card-text class="d-flex flex-wrap ga-2">
      <v-chip
        v-for="variety in varieties"
        :key="variety.pokemonId"
        size="default"
        :variant="variety.pokemonId === currentId ? 'flat' : 'tonal'"
        color="secondary"
        :disabled="variety.pokemonId === currentId"
        @click="emit('select', variety.pokemonId)"
      >
        {{ label(variety, speciesName) }}
      </v-chip>
    </v-card-text>
  </v-card>
</template>
