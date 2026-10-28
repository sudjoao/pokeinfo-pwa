<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Game } from '@/data/games'
import type { RoutePokemon } from '@/types/pokemon'
import { speciesIdOf } from '@/utils/forms'
import RoutePokemonRow from '@/components/molecules/RoutePokemonRow.vue'

/** Pokémon de um local (corpo do painel da lista e do painel do mapa). */
const props = defineProps<{
  game: Game
  /** undefined enquanto não baixou. */
  pokemon: readonly RoutePokemon[] | undefined
  loading: boolean
  failed: boolean
  /** Espécies capturadas no jogo; undefined esconde a Poké Bola. */
  caughtIds?: ReadonlySet<number>
  /** Esconde os já capturados. */
  onlyMissing?: boolean
}>()

const emit = defineEmits<{ select: [id: number]; toggleCaught: [speciesId: number]; retry: [] }>()

const { t } = useI18n()

function isCaught(pokemon: RoutePokemon): boolean {
  return props.caughtIds?.has(speciesIdOf(pokemon.id)) ?? false
}

const visible = computed(() =>
  props.onlyMissing ? (props.pokemon ?? []).filter((p) => !isCaught(p)) : (props.pokemon ?? []),
)
</script>

<template>
  <v-skeleton-loader aria-hidden="true" v-if="loading" type="list-item-two-line@3" />

  <div v-else-if="failed" class="d-flex flex-column align-start ga-2">
    <span>{{ t('routes.loadError') }}</span>
    <v-btn color="primary" variant="tonal" size="small" @click="emit('retry')">
      {{ t('common.retry') }}
    </v-btn>
  </div>

  <p v-else-if="pokemon && !pokemon.length" class="text-body-medium opacity-70 mb-0">
    {{ t('routes.emptyRoute', { game: game.title }) }}
  </p>

  <template v-else-if="pokemon">
    <p v-if="!visible.length" class="text-body-medium opacity-70 mb-0">
      {{ t('routes.allCaught') }}
    </p>
    <ul v-else class="route-encounter-list">
      <RoutePokemonRow
        v-for="entry in visible"
        :key="entry.id"
        :pokemon="entry"
        :game="game"
        :caught="caughtIds ? isCaught(entry) : undefined"
        @select="emit('select', $event)"
        @toggle-caught="emit('toggleCaught', speciesIdOf(entry.id))"
      />
    </ul>
  </template>
</template>

<style scoped>
.route-encounter-list {
  padding: 0;
  margin: 0;
}
</style>
