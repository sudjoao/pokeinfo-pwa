<script setup lang="ts">
import { computed } from 'vue'
import type { PokemonSummary } from '@/types/pokemon'
import { artworkUrl, formatPokemonName, TYPE_STYLES } from '@/utils/pokemon'
import PokemonArtwork from '@/components/atoms/PokemonArtwork.vue'
import DexNumber from '@/components/atoms/DexNumber.vue'
import TypeChip from '@/components/atoms/TypeChip.vue'

const props = defineProps<{ pokemon: PokemonSummary }>()

const emit = defineEmits<{ select: [pokemon: PokemonSummary] }>()

const name = computed(() => formatPokemonName(props.pokemon.name))
const image = computed(() => artworkUrl(props.pokemon.id))
const accent = computed(() => TYPE_STYLES[props.pokemon.types[0] ?? 'unknown'].color)
</script>

<template>
  <v-card
    class="pokemon-card"
    :style="{ '--accent': accent }"
    hover
    @click="emit('select', pokemon)"
  >
    <div class="pokemon-card__art pa-2">
      <PokemonArtwork :src="image" :alt="name" :size="120" />
    </div>
    <v-card-item class="pt-2">
      <DexNumber :id="pokemon.id" />
      <v-card-title class="text-title-medium pa-0">{{ name }}</v-card-title>
    </v-card-item>
    <v-card-text class="d-flex flex-wrap ga-1 pt-0">
      <TypeChip v-for="type in pokemon.types" :key="type" :type="type" />
    </v-card-text>
  </v-card>
</template>

<style scoped>
.pokemon-card {
  height: 100%;
  overflow: hidden;
}

.pokemon-card__art {
  background: color-mix(in srgb, var(--accent) 22%, rgb(var(--v-theme-surface)));
  border-radius: inherit;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}
</style>
