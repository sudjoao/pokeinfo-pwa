<script setup lang="ts">
import { computed } from 'vue'
import { artworkUrl, formatPokemonName } from '@/utils/pokemon'

const props = defineProps<{
  id: number
  name: string
  /** Lado do avatar em px. */
  size?: number
}>()

const label = computed(() => formatPokemonName(props.name))
const side = computed(() => `${props.size ?? 28}px`)
</script>

<template>
  <img
    :src="artworkUrl(id)"
    :alt="label"
    :title="label"
    :width="size ?? 28"
    :height="size ?? 28"
    loading="lazy"
    decoding="async"
    class="pokemon-avatar"
    :style="{ width: side, height: side }"
  />
</template>

<style scoped>
.pokemon-avatar {
  display: inline-block;
  object-fit: contain;
  border-radius: 50%;
  background: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 8%, transparent);
  vertical-align: middle;
}
</style>
