<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Game } from '@/data/games'
import type { RoutePokemon } from '@/types/pokemon'
import { formatPokemonName } from '@/utils/pokemon'
import {
  formatConditionVariant,
  formatEncounterMethod,
  formatLevelRange,
  versionTitle,
} from '@/utils/encounters'
import PokemonArtwork from '@/components/atoms/PokemonArtwork.vue'
import CatchToggle from '@/components/atoms/CatchToggle.vue'

const props = defineProps<{
  pokemon: RoutePokemon
  /** Jogo da rota, pra nomear a versão do selo "Só Sword". */
  game: Game
  /** Capturado no jogo; undefined esconde a Poké Bola. */
  caught?: boolean
}>()

const emit = defineEmits<{ select: [id: number]; toggleCaught: [] }>()

const { t, te } = useI18n()

const name = computed(() => formatPokemonName(props.pokemon.name))
const levels = computed(() => formatLevelRange(props.pokemon, t))
const onlyIn = computed(() =>
  props.pokemon.onlyIn ? versionTitle(props.game, props.pokemon.onlyIn) : null,
)
</script>

<template>
  <li class="route-pokemon-row stretched-host d-flex align-center ga-3">
    <PokemonArtwork :id="pokemon.id" alt="" :size="48" class="route-pokemon-row__art" />
    <div class="flex-grow-1 min-width-0">
      <div class="d-flex align-baseline flex-wrap gc-2">
        <button
          type="button"
          class="stretched-action text-body-medium font-weight-medium"
          @click="emit('select', pokemon.id)"
        >
          {{ name }}
        </button>
        <span class="text-label-small opacity-70">{{ levels }}</span>
      </div>
      <div class="d-flex flex-wrap ga-1 mt-1">
        <template v-for="method in pokemon.methods" :key="method.slug">
          <v-chip v-if="!method.variants" size="x-small" variant="tonal">
            {{ formatEncounterMethod(method.slug, t, te) }}
            {{ t('routes.chance', { pct: method.chance }) }}
          </v-chip>
          <!-- Chance por condição (hora, estação, swarm…) fora do chip: o texto pode quebrar linha. -->
          <span v-else class="route-pokemon-row__method d-inline-flex flex-wrap align-center gc-1">
            <v-chip size="x-small" variant="tonal">
              {{ formatEncounterMethod(method.slug, t, te) }}
            </v-chip>
            <span
              v-for="(variant, index) in method.variants"
              :key="variant.conditions.join('+')"
              class="route-pokemon-row__variant text-label-small"
            >
              <span class="opacity-70">{{ formatConditionVariant(variant, t, te) }}</span>
              {{ t('routes.chance', { pct: variant.chance }) }}
              <span v-if="index < method.variants.length - 1" aria-hidden="true" class="opacity-50"
                >·</span
              >
            </span>
          </span>
        </template>
        <v-chip v-if="onlyIn" size="x-small" variant="outlined" color="primary">
          {{ t('versionFilter.only', { version: onlyIn }) }}
        </v-chip>
      </div>
    </div>
    <CatchToggle
      v-if="caught !== undefined"
      :caught="caught"
      :name="name"
      class="route-pokemon-row__catch"
      @toggle="emit('toggleCaught')"
    />
  </li>
</template>

<style scoped>
.route-pokemon-row {
  list-style: none;
  padding: 8px 0;
}

.route-pokemon-row + .route-pokemon-row {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* O artwork ocupa 100% da largura por padrão (cards); aqui, numa linha, fica do tamanho dele. */
.route-pokemon-row__art {
  flex: 0 0 48px;
  width: 48px;
}

.route-pokemon-row__method {
  max-width: 100%;
}

.route-pokemon-row__variant {
  white-space: nowrap;
}

.route-pokemon-row__catch {
  position: relative;
  z-index: 1;
}

.min-width-0 {
  min-width: 0;
}
</style>
