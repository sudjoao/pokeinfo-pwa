<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Game } from '@/data/games'
import type { RoutePokemon } from '@/types/pokemon'
import { artworkUrl, formatPokemonName } from '@/utils/pokemon'
import { formatEncounterMethod, formatLevelRange, versionTitle } from '@/utils/encounters'
import PokemonArtwork from '@/components/atoms/PokemonArtwork.vue'

const props = defineProps<{
  pokemon: RoutePokemon
  /** Jogo da rota, pra nomear a versão do selo "Só Sword". */
  game: Game
}>()

const emit = defineEmits<{ select: [id: number] }>()

const { t, te } = useI18n()

const name = computed(() => formatPokemonName(props.pokemon.name))
const image = computed(() => artworkUrl(props.pokemon.id))
const levels = computed(() => formatLevelRange(props.pokemon, t))
const onlyIn = computed(() =>
  props.pokemon.onlyIn ? versionTitle(props.game, props.pokemon.onlyIn) : null,
)
</script>

<template>
  <li class="route-pokemon-row d-flex align-center ga-3" @click="emit('select', pokemon.id)">
    <PokemonArtwork :src="image" :alt="name" :size="48" />
    <div class="flex-grow-1 min-width-0">
      <div class="d-flex align-baseline flex-wrap gc-2">
        <span class="text-body-medium font-weight-medium">{{ name }}</span>
        <span class="text-label-small opacity-70">{{ levels }}</span>
      </div>
      <div class="d-flex flex-wrap ga-1 mt-1">
        <v-chip
          v-for="method in pokemon.methods"
          :key="method.slug"
          size="x-small"
          variant="tonal"
        >
          {{ formatEncounterMethod(method.slug, t, te) }}
          {{ t('routes.chance', { pct: method.chance }) }}
        </v-chip>
        <v-chip v-if="onlyIn" size="x-small" variant="outlined" color="primary">
          {{ t('versionFilter.only', { version: onlyIn }) }}
        </v-chip>
      </div>
    </div>
  </li>
</template>

<style scoped>
.route-pokemon-row {
  list-style: none;
  padding: 8px 0;
  cursor: pointer;
}

.route-pokemon-row + .route-pokemon-row {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.min-width-0 {
  min-width: 0;
}
</style>
