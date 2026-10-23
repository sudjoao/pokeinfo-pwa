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
  /** Imagem principal da tela (LCP): baixa já, com prioridade alta, em vez de esperar o scroll. */
  priority?: boolean
}>()

const side = computed(() => props.size ?? 120)
const loaded = ref(false)
/** Se o proxy (wsrv.nl) falhar, tenta uma vez o PNG original do repositório de sprites. */
const fallback = ref(false)
/** Nem o PNG original carregou: mostra a Poké Bola no lugar. */
const failed = ref(false)

const src = computed(() =>
  fallback.value
    ? artworkUrl(props.id, props.shiny)
    : artworkSrc(props.id, side.value, props.shiny),
)

// Reseta ao trocar de Pokémon (ex.: navegação interna entre Pokémon) para repetir a entrada.
watch(
  () => [props.id, props.shiny],
  () => {
    loaded.value = false
    fallback.value = false
    failed.value = false
  },
)

function onError(): void {
  if (!fallback.value) fallback.value = true
  else failed.value = true
}
</script>

<template>
  <!--
    <img> nativo em vez de v-img: o v-img cria um observer, uma transição e um spinner por
    instância (centenas na lista) e não repassa loading/decoding/width/height ao <img>.
  -->
  <div class="pokemon-artwork" :style="{ height: `${side}px` }">
    <v-icon
      v-if="!loaded || failed"
      :icon="mdiPokeball"
      :size="Math.min(48, side / 2)"
      class="pokemon-artwork__placeholder"
      :class="{ 'pokemon-artwork__placeholder--failed': failed }"
      :role="failed && alt ? 'img' : undefined"
      :aria-label="failed && alt ? alt : undefined"
      :aria-hidden="failed && alt ? undefined : 'true'"
    />
    <img
      v-if="!failed"
      :src="src"
      :alt="alt"
      :width="side"
      :height="side"
      :loading="priority ? 'eager' : 'lazy'"
      :fetchpriority="priority ? 'high' : undefined"
      decoding="async"
      crossorigin="anonymous"
      draggable="false"
      class="pokemon-artwork__img"
      :class="{ 'pokemon-artwork__img--loaded': loaded }"
      @load="loaded = true"
      @error="onError"
    />
  </div>
</template>

<style scoped>
.pokemon-artwork {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.pokemon-artwork__placeholder {
  position: absolute;
  opacity: 0.18;
}

.pokemon-artwork__placeholder--failed {
  position: static;
  opacity: 0.5;
}

.pokemon-artwork__img {
  height: 100%;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  opacity: 0;
  transform: scale(0.55) rotate(-6deg);
  transition:
    opacity 0.3s ease,
    transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pokemon-artwork__img--loaded {
  opacity: 1;
  transform: scale(1) rotate(0deg);
}
</style>
