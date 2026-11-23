<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { artworkSrc, artworkUrl, formatPokemonName } from '@/utils/pokemon'

const props = defineProps<{
  id: number
  name: string
  /** Lado do avatar em px. */
  size?: number
  /** O nome já está escrito ao lado: a imagem sai da árvore de acessibilidade (alt vazio). */
  decorative?: boolean
  /** Versão shiny; sem artwork shiny (algumas formas), cai para o normal. */
  shiny?: boolean
}>()

const label = computed(() => formatPokemonName(props.name))
const side = computed(() => `${props.size ?? 28}px`)

/** Se o proxy (wsrv.nl) falhar, cai para o PNG original, como no PokemonArtwork. */
const fallback = ref(false)
const shinyMissing = ref(false)
watch(
  () => [props.id, props.shiny],
  () => {
    fallback.value = false
    shinyMissing.value = false
  },
)
const showShiny = computed(() => Boolean(props.shiny) && !shinyMissing.value)
const src = computed(() =>
  fallback.value
    ? artworkUrl(props.id, showShiny.value)
    : artworkSrc(props.id, props.size ?? 28, showShiny.value),
)

function onError(): void {
  if (!fallback.value) {
    fallback.value = true
  } else if (showShiny.value) {
    shinyMissing.value = true
    fallback.value = false
  }
}
</script>

<template>
  <img
    :src="src"
    :alt="decorative ? '' : label"
    :title="decorative ? undefined : label"
    :width="size ?? 28"
    :height="size ?? 28"
    loading="lazy"
    decoding="async"
    crossorigin="anonymous"
    class="pokemon-avatar"
    :style="{ width: side, height: side }"
    @error="onError"
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
