<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PokemonSummary } from '@/types/pokemon'
import { artworkUrl, formatPokemonName } from '@/utils/pokemon'
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
  <v-card
    class="evolution-stage text-center pa-2"
    :style="{ '--evo-delay': enterDelay }"
    :variant="current ? 'tonal' : 'outlined'"
    :color="current ? 'primary' : undefined"
    :hover="!current"
    :aria-current="current ? 'page' : undefined"
    @click="current ? undefined : emit('select', speciesId)"
  >
    <PokemonArtwork :src="artworkUrl(speciesId)" :alt="label" :size="96" />
    <DexNumber :id="speciesId" />
    <div class="text-title-small">{{ label }}</div>
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

/* Destaque contínuo e sutil no estágio atual: um anel que respira, sem chamar atenção demais. */
.evolution-stage[aria-current='page'] {
  animation:
    evo-stage-in 0.5s var(--evo-delay, 0s) cubic-bezier(0.34, 1.56, 0.64, 1) both,
    evo-current-pulse 2.4s ease-in-out 0.5s infinite;
}

@keyframes evo-current-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, rgb(var(--v-theme-primary)) 40%, transparent);
  }
  50% {
    box-shadow: 0 0 0 7px color-mix(in srgb, rgb(var(--v-theme-primary)) 0%, transparent);
  }
}
</style>
