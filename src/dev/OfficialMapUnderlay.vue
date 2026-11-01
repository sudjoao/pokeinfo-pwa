<script setup lang="ts">
import { computed } from 'vue'
import { enabled, fileUrl, sections, sizes } from './officialMap'

/** Só no modo dev: a imagem do mapa oficial, dentro do SVG do mapa (slot `underlay`). */
const props = defineProps<{ sectionKey: string }>()

const image = computed(() => {
  const reference = sections[props.sectionKey]
  const size = reference?.file ? sizes[reference.file] : undefined
  if (!enabled.value || !reference?.file || !size) return null
  return {
    href: fileUrl(reference.file),
    x: reference.x,
    y: reference.y,
    width: size.width * reference.scale,
    height: size.height * reference.scale * reference.stretch,
    opacity: reference.opacity,
  }
})
</script>

<template>
  <image
    v-if="image"
    class="official-map-underlay"
    :href="image.href"
    :x="image.x"
    :y="image.y"
    :width="image.width"
    :height="image.height"
    :opacity="image.opacity"
    preserveAspectRatio="none"
    aria-hidden="true"
  />
</template>

<style scoped>
/* Os mapas de bolso das primeiras gerações têm ~240 px: sem isso, ficam borrados no zoom. */
.official-map-underlay {
  image-rendering: pixelated;
  pointer-events: none;
}
</style>
