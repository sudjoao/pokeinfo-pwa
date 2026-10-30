<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Game } from '@/data/games'
import type { PokemonType } from '@/types/pokemon'
import type { TrainerPokemon } from '@/types/trainers'
import { formatPokemonName, TYPE_COLORS, TYPE_TEXT_COLORS } from '@/utils/pokemon'
import { moveInfo, moveName } from '@/utils/moves'
import { categoryInGeneration } from '@/utils/trainers'
import PokemonArtwork from '@/components/atoms/PokemonArtwork.vue'
import TypeChip from '@/components/atoms/TypeChip.vue'

const props = defineProps<{
  pokemon: TrainerPokemon
  game: Game
  /** Nome do Pokémon (o slug do índice, já resolvido por quem lista). */
  name: string
  /** Tipos na geração do jogo (Clefairy era Normal até a 5ª). */
  types: readonly PokemonType[]
}>()

const emit = defineEmits<{ select: [id: number] }>()

const { t, locale } = useI18n()

const displayName = computed(() => formatPokemonName(props.name))

/** Golpes com os valores do jogo (tipo e categoria mudaram entre gerações). */
const moves = computed(() =>
  props.pokemon.moves.flatMap((slug) => {
    const info = moveInfo(slug, props.game.slug)
    if (!info) return []
    const category = categoryInGeneration(info.category, info.type, props.game.generation)
    return [
      { slug, name: moveName(info, locale.value), type: info.type, category, power: info.power },
    ]
  }),
)

const details = computed(() => {
  const list: string[] = []
  if (props.pokemon.ability) {
    list.push(t('league.ability', { name: formatPokemonName(props.pokemon.ability) }))
  }
  if (props.pokemon.item) {
    list.push(t('league.item', { name: formatPokemonName(props.pokemon.item) }))
  }
  return list
})
</script>

<template>
  <li class="trainer-pokemon-row stretched-host d-flex ga-3">
    <PokemonArtwork :id="pokemon.id" alt="" :size="56" class="trainer-pokemon-row__art" />
    <div class="flex-grow-1 min-width-0">
      <div class="d-flex align-center flex-wrap gc-2 gr-1">
        <button
          type="button"
          class="stretched-action text-body-medium font-weight-medium"
          @click="emit('select', pokemon.id)"
        >
          {{ displayName }}
        </button>
        <span
          v-if="pokemon.gender"
          class="text-label-medium opacity-70"
          :aria-label="t(`league.gender.${pokemon.gender}`)"
          >{{ pokemon.gender === 'm' ? '♂' : '♀' }}</span
        >
        <span class="text-label-medium opacity-70">{{
          t('detail.level', { n: pokemon.level })
        }}</span>
        <TypeChip v-for="type in types" :key="type" :type="type" size="x-small" />
        <v-chip v-if="pokemon.tera" size="x-small" variant="outlined" class="text-primary-safe">
          {{ t('league.tera', { type: t(`type.${pokemon.tera}`) }) }}
        </v-chip>
        <v-chip v-if="pokemon.special" size="x-small" variant="outlined" class="text-primary-safe">
          {{ t(`league.special.${pokemon.special}`) }}
        </v-chip>
      </div>
      <p v-if="details.length" class="text-label-medium opacity-80 mb-0 mt-1">
        {{ details.join(' · ') }}
      </p>
      <ul
        v-if="moves.length"
        class="trainer-pokemon-row__moves mt-1"
        :aria-label="t('league.moves')"
      >
        <li
          v-for="move in moves"
          :key="move.slug"
          class="trainer-pokemon-row__move text-label-medium"
          :style="{ backgroundColor: TYPE_COLORS[move.type], color: TYPE_TEXT_COLORS[move.type] }"
        >
          <span>{{ move.name }}</span>
          <span class="d-sr-only">
            ({{ t(`type.${move.type}`) }}, {{ t(`moves.${move.category}`) }})
          </span>
          <span v-if="move.power" class="trainer-pokemon-row__power" aria-hidden="true">
            {{ move.power }}
          </span>
        </li>
      </ul>
    </div>
  </li>
</template>

<style scoped>
.trainer-pokemon-row {
  list-style: none;
  padding: 10px 0;
}

.trainer-pokemon-row + .trainer-pokemon-row {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* O artwork ocupa 100% da largura por padrão (cards); aqui, numa linha, fica do tamanho dele. */
.trainer-pokemon-row__art {
  flex: 0 0 56px;
  width: 56px;
}

.trainer-pokemon-row__moves {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
  gap: 4px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.trainer-pokemon-row__move {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-height: 24px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.trainer-pokemon-row__power {
  opacity: 0.85;
  font-variant-numeric: tabular-nums;
}

.min-width-0 {
  min-width: 0;
}
</style>
