<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiChevronLeft, mdiChevronRight, mdiClose } from '@mdi/js'
import type { Game } from '@/data/games'
import type { RoutePokemon } from '@/types/pokemon'
import { formatAreaName } from '@/utils/encounters'
import { speciesIdOf } from '@/utils/forms'
import RouteEncounterList from '@/components/molecules/RouteEncounterList.vue'

/** Local escolhido no mapa: nome, contagem, anterior/próximo na história e os Pokémon. */
const props = defineProps<{
  game: Game
  location: string
  pokemon: readonly RoutePokemon[] | undefined
  loading: boolean
  failed: boolean
  caughtIds?: ReadonlySet<number>
  onlyMissing?: boolean
  /** Locais vizinhos na ordem da história (null no começo/fim). */
  previous: string | null
  next: string | null
  /** Posição do local na ordem da história (1 = primeiro), null fora dela. */
  step: { index: number; total: number } | null
  /** Sem botão de fechar (painel lateral fixo na tela grande). */
  persistent?: boolean
}>()

const emit = defineEmits<{
  close: []
  go: [location: string]
  retry: []
  select: [id: number]
  toggleCaught: [speciesId: number]
}>()

const { t } = useI18n()

const title = computed(() => formatAreaName(props.location))

const summary = computed(() => {
  const parts: string[] = []
  if (props.step) parts.push(t('routes.map.step', { n: props.step.index, total: props.step.total }))
  const list = props.pokemon
  if (list?.length) {
    parts.push(t('routes.pokemonCount', list.length))
    if (props.caughtIds) {
      const species = new Set(list.map((p) => speciesIdOf(p.id)))
      const caught = [...species].filter((id) => props.caughtIds!.has(id)).length
      parts.push(t('routes.caughtCount', { caught, total: species.size }))
    }
  }
  return parts.join(' · ')
})
</script>

<template>
  <section class="route-location-card" :aria-labelledby="`route-location-${location}`">
    <header class="route-location-card__header d-flex align-start ga-1">
      <div class="flex-grow-1 min-width-0">
        <h2 :id="`route-location-${location}`" class="text-title-medium">{{ title }}</h2>
        <p v-if="summary" class="text-label-medium opacity-70 mb-0">{{ summary }}</p>
      </div>
      <v-btn
        :icon="mdiChevronLeft"
        size="small"
        variant="text"
        :disabled="!previous"
        :aria-label="
          previous
            ? t('routes.map.previous', { name: formatAreaName(previous) })
            : t('routes.map.previousNone')
        "
        @click="previous && emit('go', previous)"
      />
      <v-btn
        :icon="mdiChevronRight"
        size="small"
        variant="text"
        :disabled="!next"
        :aria-label="
          next ? t('routes.map.next', { name: formatAreaName(next) }) : t('routes.map.nextNone')
        "
        @click="next && emit('go', next)"
      />
      <v-btn
        v-if="!persistent"
        :icon="mdiClose"
        size="small"
        variant="text"
        :aria-label="t('common.close')"
        @click="emit('close')"
      />
    </header>
    <div class="route-location-card__body">
      <RouteEncounterList
        :game="game"
        :pokemon="pokemon"
        :loading="loading"
        :failed="failed"
        :caught-ids="caughtIds"
        :only-missing="onlyMissing"
        @retry="emit('retry')"
        @select="emit('select', $event)"
        @toggle-caught="emit('toggleCaught', $event)"
      />
    </div>
  </section>
</template>

<style scoped>
.route-location-card__header {
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.route-location-card__body {
  padding-top: 4px;
}

.min-width-0 {
  min-width: 0;
}
</style>
