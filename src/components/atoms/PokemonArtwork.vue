<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { mdiPokeball } from '@mdi/js'
import { artworkSrc, artworkUrl } from '@/utils/pokemon'

const props = defineProps<{
  /** Id do Pokémon (ou da forma); a URL do artwork é derivada dele. */
  id: number
  alt: string
  /** Lado exibido em px (padrão 120); define a largura pedida ao proxy. */
  size?: number
  /** Versão shiny (cores alternativas) do artwork. */
  shiny?: boolean
}>()

const loaded = ref(false)
/** Se o proxy (wsrv.nl) falhar, tenta uma vez o PNG original do repositório de sprites. */
const fallback = ref(false)

const src = computed(() =>
  fallback.value
    ? artworkUrl(props.id, props.shiny)
    : artworkSrc(props.id, props.size ?? 120, props.shiny),
)

// Reseta ao trocar de Pokémon (ex.: navegação interna entre Pokémon) para repetir a entrada.
watch(
  () => [props.id, props.shiny],
  () => {
    loaded.value = false
    fallback.value = false
  },
)

function onError(): void {
  if (!fallback.value) fallback.value = true
  else loaded.value = true
}
</script>

<template>
  <v-img
    :src="src"
    :alt="alt"
    :height="size ?? 120"
    contain
    crossorigin="anonymous"
    :draggable="false"
    :image-class="['pokemon-artwork__img', loaded ? 'pokemon-artwork__img--loaded' : '']"
    @load="loaded = true"
    @error="onError"
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
  transform: scale(0.55) rotate(-6deg);
  transition:
    opacity 0.3s ease,
    transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

:deep(.pokemon-artwork__img--loaded) {
  opacity: 1;
  transform: scale(1) rotate(0deg);
}
</style>
