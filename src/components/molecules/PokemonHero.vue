<script setup lang="ts">
import { computed } from 'vue'
import type { PokemonDetail } from '@/types/pokemon'
import { artworkUrl, formatPokemonName, TYPE_STYLES } from '@/utils/pokemon'
import PokemonArtwork from '@/components/atoms/PokemonArtwork.vue'
import DexNumber from '@/components/atoms/DexNumber.vue'
import TypeChip from '@/components/atoms/TypeChip.vue'
import CryButton from '@/components/atoms/CryButton.vue'

const props = defineProps<{
  pokemon: PokemonDetail
  genus?: string | null
  showCry?: boolean
  cryPlaying?: boolean
  cryMuted?: boolean
}>()

const emit = defineEmits<{ playCry: [] }>()

const name = computed(() => formatPokemonName(props.pokemon.name))
const image = computed(() => artworkUrl(props.pokemon.id))
const accent = computed(() => TYPE_STYLES[props.pokemon.types[0] ?? 'unknown'].color)
</script>

<template>
  <v-card class="pokemon-hero" :style="{ '--accent': accent }">
    <div class="pokemon-hero__art pa-4">
      <PokemonArtwork :src="image" :alt="name" :size="240" />
    </div>
    <v-card-item>
      <div class="d-flex align-start justify-space-between ga-2">
        <div>
          <DexNumber :id="pokemon.id" />
          <v-card-title class="text-headline-small pa-0">{{ name }}</v-card-title>
          <v-card-subtitle v-if="genus" class="pa-0">{{ genus }}</v-card-subtitle>
        </div>
        <CryButton v-if="showCry" :playing="cryPlaying" :muted="cryMuted" @play="emit('playCry')" />
      </div>
    </v-card-item>
    <v-card-text class="d-flex flex-wrap ga-1 pt-0">
      <TypeChip v-for="type in pokemon.types" :key="type" :type="type" />
    </v-card-text>
  </v-card>
</template>

<style scoped>
.pokemon-hero {
  overflow: hidden;
}

.pokemon-hero__art {
  background: radial-gradient(
    circle at 50% 40%,
    color-mix(in srgb, var(--accent) 45%, rgb(var(--v-theme-surface))),
    color-mix(in srgb, var(--accent) 18%, rgb(var(--v-theme-surface))) 70%
  );
}
</style>
