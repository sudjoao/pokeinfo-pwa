<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { artworkSrc, artworkUrl, formatPokemonName } from '@/utils/pokemon'

const props = defineProps<{
  id: number
  name: string
  /** Lado do avatar em px. */
  size?: number
}>()

const label = computed(() => formatPokemonName(props.name))
const side = computed(() => `${props.size ?? 28}px`)

/** Se o proxy (wsrv.nl) falhar, cai para o PNG original, como no PokemonArtwork. */
const fallback = ref(false)
watch(
  () => props.id,
  () => (fallback.value = false),
)
const src = computed(() =>
  fallback.value ? artworkUrl(props.id) : artworkSrc(props.id, props.size ?? 28),
)
</script>

<template>
  <img
    :src="src"
    :alt="label"
    :title="label"
    :width="size ?? 28"
    :height="size ?? 28"
    loading="lazy"
    decoding="async"
    crossorigin="anonymous"
    class="pokemon-avatar"
    :style="{ width: side, height: side }"
    @error="fallback = true"
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
