<script setup lang="ts">
import { ref, watch } from 'vue'
import { mdiPokeball } from '@mdi/js'

const props = defineProps<{
  src: string
  alt: string
  size?: number | string
}>()

const loaded = ref(false)

// Reseta ao trocar de sprite (ex.: navegação interna entre Pokémon) para repetir a entrada.
watch(
  () => props.src,
  () => {
    loaded.value = false
  },
)
</script>

<template>
  <v-img
    :src="src"
    :alt="alt"
    :height="size ?? 120"
    contain
    :draggable="false"
    :image-class="['pokemon-artwork__img', loaded ? 'pokemon-artwork__img--loaded' : '']"
    @load="loaded = true"
    @error="loaded = true"
  >
    <template #placeholder>
      <div class="d-flex align-center justify-center fill-height">
        <v-progress-circular indeterminate size="24" width="2" color="primary" />
      </div>
    </template>
    <template #error>
      <div class="d-flex align-center justify-center fill-height">
        <v-icon :icon="mdiPokeball" size="48" color="grey" />
      </div>
    </template>
  </v-img>
</template>

<style scoped>
/*
 * O <img> real fica bem aninhado dentro do template interno do v-img (não é a raiz do
 * componente), então o atributo de escopo do Vue não alcança ele sem :deep().
 */
:deep(.pokemon-artwork__img) {
  opacity: 0;
  transform: scale(0.85);
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

:deep(.pokemon-artwork__img--loaded) {
  opacity: 1;
  transform: scale(1);
}
</style>
