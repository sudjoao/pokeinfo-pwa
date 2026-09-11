<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PokemonSummary } from '@/types/pokemon'
import { artworkUrl, formatPokemonName } from '@/utils/pokemon'
import PokemonArtwork from '@/components/atoms/PokemonArtwork.vue'
import DexNumber from '@/components/atoms/DexNumber.vue'
import TypeChip from '@/components/atoms/TypeChip.vue'

const props = defineProps<{
  speciesId: number
  name: string
  summary?: PokemonSummary | null
  current?: boolean
  isBaby?: boolean
}>()

const emit = defineEmits<{ select: [id: number] }>()

const { t } = useI18n()

const label = computed(() => formatPokemonName(props.name))
</script>

<template>
  <v-card
    class="evolution-stage text-center pa-2"
    :variant="current ? 'tonal' : 'outlined'"
    :color="current ? 'primary' : undefined"
    :hover="!current"
    :aria-current="current ? 'page' : undefined"
    @click="current ? undefined : emit('select', speciesId)"
  >
    <PokemonArtwork :src="artworkUrl(speciesId)" :alt="label" :size="96" />
    <DexNumber :id="speciesId" />
    <div class="text-title-small">{{ label }}</div>
    <div v-if="isBaby" class="text-label-small opacity-70">{{ t('detail.baby') }}</div>
    <div class="d-flex flex-wrap justify-center ga-1 mt-1">
      <TypeChip v-for="type in summary?.types ?? []" :key="type" :type="type" />
    </div>
  </v-card>
</template>

<style scoped>
.evolution-stage {
  width: 150px;
  flex: 0 0 auto;
}
</style>
