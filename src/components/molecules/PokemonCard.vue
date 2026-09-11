<script setup lang="ts">
import { computed } from 'vue'
import { mdiCheckCircle } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import type { PokemonListItem } from '@/types/pokemon'
import { artworkUrl, formatDexNumber, formatPokemonName, TYPE_COLORS } from '@/utils/pokemon'
import PokemonArtwork from '@/components/atoms/PokemonArtwork.vue'
import DexNumber from '@/components/atoms/DexNumber.vue'
import TypeChip from '@/components/atoms/TypeChip.vue'
import CatchToggle from '@/components/atoms/CatchToggle.vue'

const props = defineProps<{
  pokemon: PokemonListItem
  /** Estado de captura no jogo selecionado; undefined esconde o botão (Pokédex Nacional). */
  caught?: boolean
  /** Card escolhido (ex.: já está no time); undefined quando a lista não tem seleção. */
  selected?: boolean
}>()

const emit = defineEmits<{
  select: [pokemon: PokemonListItem]
  toggleCaught: [speciesId: number]
}>()

const { t } = useI18n()

const name = computed(() => formatPokemonName(props.pokemon.name))
const image = computed(() => artworkUrl(props.pokemon.id))
const accent = computed(() => TYPE_COLORS[props.pokemon.types[0] ?? 'unknown'])

/** Com um jogo selecionado, o número regional vai em destaque e o nacional fica pequeno. */
const regional = computed(() => props.pokemon.dexNumber !== undefined)
const nationalLabel = computed(() => formatDexNumber(props.pokemon.speciesId ?? props.pokemon.id))
const speciesId = computed(() => props.pokemon.speciesId ?? props.pokemon.id)
</script>

<template>
  <v-card
    class="pokemon-card"
    :class="{ 'pokemon-card--selected': selected }"
    :style="{ '--accent': accent }"
    hover
    :aria-pressed="selected"
    @click="emit('select', pokemon)"
  >
    <div class="pokemon-card__art pa-2">
      <PokemonArtwork :src="image" :alt="name" :size="120" />
      <v-icon
        v-if="selected"
        :icon="mdiCheckCircle"
        color="primary"
        class="pokemon-card__check"
        :aria-label="t('team.inTeam')"
      />
      <CatchToggle
        v-if="caught !== undefined"
        :caught="caught"
        class="pokemon-card__catch"
        @toggle="emit('toggleCaught', speciesId)"
      />
    </div>
    <v-card-item class="pt-2">
      <div class="d-flex align-baseline flex-wrap ga-1">
        <DexNumber v-if="regional" :id="pokemon.dexNumber!" :digits="3" />
        <DexNumber v-else :id="pokemon.id" />
        <span v-if="regional" class="pokemon-card__national text-label-small">
          {{ t('common.national') }} {{ nationalLabel }}
        </span>
      </div>
      <v-card-title class="text-title-medium pa-0">{{ name }}</v-card-title>
    </v-card-item>
    <v-card-text class="d-flex flex-wrap ga-1 pt-0">
      <TypeChip v-for="type in pokemon.types" :key="type" :type="type" />
    </v-card-text>
  </v-card>
</template>

<style scoped>
.pokemon-card {
  height: 100%;
  overflow: hidden;
}

.pokemon-card__art {
  position: relative;
  background: color-mix(in srgb, var(--accent) 22%, rgb(var(--v-theme-surface)));
  border-radius: inherit;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.pokemon-card__catch {
  position: absolute;
  top: 4px;
  right: 4px;
}

.pokemon-card--selected {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}

.pokemon-card__check {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgb(var(--v-theme-surface));
  border-radius: 50%;
}

.pokemon-card__national {
  opacity: 0.45;
  font-variant-numeric: tabular-nums;
}
</style>
