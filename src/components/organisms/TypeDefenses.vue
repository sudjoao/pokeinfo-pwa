<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PokemonType } from '@/types/pokemon'
import { attackMultiplier, battleTypes, typesInGeneration } from '@/utils/typeChart'
import TypeChip from '@/components/atoms/TypeChip.vue'
import MultiplierBadge from '@/components/atoms/MultiplierBadge.vue'

const props = defineProps<{
  pokemonId: number
  types: readonly PokemonType[]
  /** Geração do jogo selecionado; sem jogo, a tabela atual. */
  generation?: number
  gameTitle?: string
}>()

const { t } = useI18n()

interface Entry {
  type: PokemonType
  multiplier: number
}

const groups = computed(() => {
  const defending = typesInGeneration(props.pokemonId, props.types, props.generation)
  const entries: Entry[] = battleTypes(props.generation).map((type) => ({
    type,
    multiplier: attackMultiplier(type, defending, props.generation),
  }))
  return [
    {
      key: 'weak',
      label: t('detail.weakTo'),
      entries: entries.filter((e) => e.multiplier > 1).sort((a, b) => b.multiplier - a.multiplier),
    },
    {
      key: 'resist',
      label: t('detail.resists'),
      entries: entries
        .filter((e) => e.multiplier > 0 && e.multiplier < 1)
        .sort((a, b) => a.multiplier - b.multiplier),
    },
    {
      key: 'immune',
      label: t('detail.immuneTo'),
      entries: entries.filter((e) => e.multiplier === 0),
    },
  ].filter((group) => group.entries.length)
})

const note = computed(() =>
  props.generation && props.gameTitle
    ? t('detail.defensesGeneration', { n: props.generation, game: props.gameTitle })
    : t('detail.defensesCurrent'),
)
</script>

<template>
  <v-card>
    <v-card-title class="text-title-medium">{{ t('detail.typeDefenses') }}</v-card-title>
    <v-card-text class="d-flex flex-column ga-3">
      <div v-for="group in groups" :key="group.key">
        <h3 class="text-label-large mb-1">{{ group.label }}</h3>
        <ul class="type-defenses__list">
          <li
            v-for="entry in group.entries"
            :key="entry.type"
            class="d-inline-flex align-center ga-1"
          >
            <TypeChip :type="entry.type" size="small" />
            <MultiplierBadge :multiplier="entry.multiplier" />
          </li>
        </ul>
      </div>
      <p class="text-body-small opacity-70 mb-0">{{ note }}</p>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.type-defenses__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  padding: 0;
  margin: 0;
  list-style: none;
}
</style>
