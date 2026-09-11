<script setup lang="ts">
import { computed } from 'vue'
import { mdiStarFourPoints } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import type { PokemonDetail, PokemonSpecies } from '@/types/pokemon'
import { artworkUrl, formatDexNumber, TYPE_COLORS } from '@/utils/pokemon'
import { speciesDisplayName, speciesGenus } from '@/utils/species'
import PokemonArtwork from '@/components/atoms/PokemonArtwork.vue'
import DexNumber from '@/components/atoms/DexNumber.vue'
import TypeChip from '@/components/atoms/TypeChip.vue'
import CryButton from '@/components/atoms/CryButton.vue'
import CatchToggle from '@/components/atoms/CatchToggle.vue'

/** Número do Pokémon na Pokédex de um jogo, mostrado no lugar do nacional quando há jogo selecionado. */
export interface RegionalNumber {
  number: number
  dexLabel: string
  gameTitle: string
}

const props = defineProps<{
  pokemon: PokemonDetail
  species?: PokemonSpecies | null
  regional?: RegionalNumber | null
  /** Capturado no jogo selecionado; undefined esconde o botão (sem jogo na URL). */
  caught?: boolean
  /** Título da versão em que a espécie é exclusiva no jogo selecionado (ex.: "Sword"). */
  exclusiveTo?: string | null
  showCry?: boolean
  cryPlaying?: boolean
  cryMuted?: boolean
}>()

const emit = defineEmits<{ playCry: []; toggleCaught: [] }>()

const { t, locale } = useI18n()

const name = computed(() => speciesDisplayName(props.species, props.pokemon.name, locale.value))
const genus = computed(() => speciesGenus(props.species, locale.value))
const nationalLabel = computed(() => formatDexNumber(props.pokemon.speciesId))
const image = computed(() => artworkUrl(props.pokemon.id))
const accent = computed(() => TYPE_COLORS[props.pokemon.types[0] ?? 'unknown'])

const caughtLabel = computed(() => {
  const game = props.regional?.gameTitle
  if (props.caught) return game ? t('catch.caughtIn', { game }) : t('catch.caught')
  return game ? t('catch.notCaughtIn', { game }) : t('catch.notCaught')
})
</script>

<template>
  <v-card class="pokemon-hero" :style="{ '--accent': accent }">
    <div class="pokemon-hero__art pa-4">
      <PokemonArtwork :src="image" :alt="name" :size="240" />
    </div>
    <v-card-item>
      <div class="d-flex align-start justify-space-between ga-2">
        <div>
          <div class="d-flex align-baseline flex-wrap ga-1">
            <DexNumber v-if="regional" :id="regional.number" :digits="3" />
            <DexNumber v-else :id="pokemon.id" />
            <span v-if="regional" class="pokemon-hero__national text-label-small">
              {{ t('common.national') }} {{ nationalLabel }}
            </span>
          </div>
          <v-card-title class="text-headline-small pa-0">{{ name }}</v-card-title>
          <v-card-subtitle v-if="genus" class="pa-0">{{ genus }}</v-card-subtitle>
          <p v-if="regional" class="text-body-small opacity-70 mt-1 mb-0">
            {{ t('detail.dexOf', { dex: regional.dexLabel, game: regional.gameTitle }) }}
          </p>
          <p
            v-if="exclusiveTo"
            class="pokemon-hero__exclusive text-body-small mt-1 mb-0 d-flex align-center ga-1"
          >
            <v-icon :icon="mdiStarFourPoints" size="14" />
            {{ t('detail.exclusiveTo', { version: exclusiveTo }) }}
          </p>
          <p v-if="caught !== undefined" class="text-body-small mt-1 mb-0">
            {{ caughtLabel }}
          </p>
        </div>
        <div class="d-flex flex-column align-center ga-2">
          <CryButton
            v-if="showCry"
            :playing="cryPlaying"
            :muted="cryMuted"
            @play="emit('playCry')"
          />
          <CatchToggle
            v-if="caught !== undefined"
            :caught="caught"
            size="default"
            @toggle="emit('toggleCaught')"
          />
        </div>
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

.pokemon-hero__national {
  opacity: 0.45;
  font-variant-numeric: tabular-nums;
}

.pokemon-hero__exclusive {
  color: rgb(var(--v-theme-secondary));
  font-weight: 600;
}

.pokemon-hero__art {
  background: radial-gradient(
    circle at 50% 40%,
    color-mix(in srgb, var(--accent) 45%, rgb(var(--v-theme-surface))),
    color-mix(in srgb, var(--accent) 18%, rgb(var(--v-theme-surface))) 70%
  );
}
</style>
