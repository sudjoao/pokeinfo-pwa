<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PokemonSummary } from '@/types/pokemon'
import { formatPokemonName } from '@/utils/pokemon'
import PokemonArtwork from '@/components/atoms/PokemonArtwork.vue'
import DexNumber from '@/components/atoms/DexNumber.vue'
import TypeChip from '@/components/atoms/TypeChip.vue'

const props = defineProps<{
  speciesId: number
  name: string
  summary?: PokemonSummary | null
  current?: boolean
  isBaby?: boolean
  /** Profundidade na cadeia (0 = base); espaça a entrada de cada estágio em cascata. */
  depth?: number
}>()

const emit = defineEmits<{ select: [id: number] }>()

const { t } = useI18n()

const label = computed(() => formatPokemonName(props.name))
const enterDelay = computed(() => `${(props.depth ?? 0) * 90}ms`)
</script>

<template>
  <!-- `link` só dá o visual de clicável; o clique e o foco ficam no botão do nome (stretched). -->
  <v-card
    class="evolution-stage stretched-host text-center pa-2"
    :style="{ '--evo-delay': enterDelay }"
    :variant="current ? 'tonal' : 'outlined'"
    :color="current ? 'primary' : undefined"
    :hover="!current"
    :link="!current"
    :aria-current="current ? 'page' : undefined"
  >
    <span v-if="current" class="evolution-stage__ring" aria-hidden="true" />
    <PokemonArtwork :id="speciesId" alt="" :size="96" />
    <DexNumber :id="speciesId" />
    <div class="text-title-small">
      <span v-if="current">{{ label }}</span>
      <button v-else type="button" class="stretched-action" @click="emit('select', speciesId)">
        {{ label }}
      </button>
    </div>
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
  animation: evo-stage-in 0.5s var(--evo-delay, 0s) cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes evo-stage-in {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/*
 * Destaque contínuo e sutil no estágio atual: um anel que respira, sem chamar atenção demais.
 * Anima só a opacidade de uma camada própria (composição na GPU); animar o box-shadow do card
 * repintava a cada quadro enquanto a tela estivesse aberta.
 */
.evolution-stage__ring {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0 3px color-mix(in srgb, rgb(var(--v-theme-primary)) 55%, transparent);
  pointer-events: none;
  will-change: opacity;
  animation: evo-current-pulse 2.4s ease-in-out 0.5s infinite;
}

@keyframes evo-current-pulse {
  0%,
  100% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}
</style>
