<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { PokemonMoveLearn } from '@/types/pokemon'
import { findGame } from '@/utils/games'
import { formatVersionGroup } from '@/utils/evolution'
import { formatPokemonName } from '@/utils/pokemon'
import {
  MOVE_METHODS,
  movesByMethod,
  versionGroupsWithMoves,
  type LearnedMove,
  type MoveMethodGroup,
} from '@/utils/moves'
import TypeChip from '@/components/atoms/TypeChip.vue'

const props = defineProps<{
  moves: readonly PokemonMoveLearn[]
  /** Grupo de versões do jogo selecionado (= `Game.slug`); sem jogo, começa no mais recente. */
  versionGroup?: string | null
}>()

const { t, locale } = useI18n()

const groups = computed(() => versionGroupsWithMoves(props.moves))

function initialGroup(): string | null {
  if (props.versionGroup && groups.value.includes(props.versionGroup)) return props.versionGroup
  if (props.versionGroup) return null
  // Sem jogo: o mais recente da série principal (Champions, por exemplo, não está em data/games.ts).
  return groups.value.find((slug) => findGame(slug)) ?? groups.value[0] ?? null
}

const selected = ref<string | null>(initialGroup())
watch(
  () => [props.moves, props.versionGroup],
  () => (selected.value = initialGroup()),
)

function groupTitle(slug: string): string {
  return findGame(slug)?.title ?? formatVersionGroup(slug)
}

const groupItems = computed(() =>
  groups.value.map((slug) => ({ value: slug, title: groupTitle(slug) })),
)

const byMethod = computed(() =>
  selected.value ? movesByMethod(props.moves, selected.value) : null,
)

const tabs = computed(() =>
  MOVE_METHODS.filter(
    (method) => method === 'level-up' || (byMethod.value?.[method].length ?? 0) > 0,
  ),
)
const tab = ref<MoveMethodGroup>('level-up')
watch(tabs, (list) => {
  if (!list.includes(tab.value)) tab.value = list[0] ?? 'level-up'
})

function moveName(move: LearnedMove): string {
  return (locale.value === 'es' && move.info.nameEs) || formatPokemonName(move.info.slug)
}

function levelLabel(move: LearnedMove): string {
  return move.level === 0 ? t('moves.evolve') : String(move.level)
}

const dash = '—'
</script>

<template>
  <v-card>
    <v-card-title tag="h2" class="text-title-medium">{{ t('moves.title') }}</v-card-title>
    <v-card-text>
      <p v-if="!groups.length" class="mb-0 opacity-70">{{ t('moves.noneAtAll') }}</p>
      <template v-else>
        <v-select
          v-model="selected"
          :items="groupItems"
          :label="t('moves.game')"
          density="compact"
          variant="outlined"
          hide-details
          class="moves-card__game mb-2"
        />
        <p v-if="!selected" class="mb-0 opacity-70">
          {{ t('moves.noneInGame', { game: versionGroup ? groupTitle(versionGroup) : '' }) }}
        </p>
        <template v-else-if="byMethod">
          <v-tabs v-model="tab" density="compact" show-arrows class="mb-2">
            <v-tab v-for="method in tabs" :key="method" :value="method" class="text-none">
              {{ t(`moves.${method}`) }} ({{ byMethod[method].length }})
            </v-tab>
          </v-tabs>
          <p v-if="!byMethod[tab].length" class="mb-0 opacity-70">{{ t('moves.none') }}</p>
          <v-table v-else density="compact" class="moves-card__table">
            <thead>
              <tr>
                <th v-if="tab === 'level-up'" scope="col">{{ t('moves.level') }}</th>
                <th scope="col">{{ t('moves.move') }}</th>
                <th scope="col" class="text-end">{{ t('moves.power') }}</th>
                <th scope="col" class="text-end">{{ t('moves.accuracy') }}</th>
                <th scope="col" class="text-end">{{ t('moves.pp') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="move in byMethod[tab]" :key="`${move.info.slug}-${move.level}`">
                <td
                  v-if="tab === 'level-up'"
                  class="moves-card__num"
                  :title="move.level === 0 ? t('moves.evolveLong') : undefined"
                >
                  <template v-if="move.level === 0">
                    <span aria-hidden="true">{{ levelLabel(move) }}</span>
                    <span class="d-sr-only">{{ t('moves.evolveLong') }}</span>
                  </template>
                  <template v-else>{{ levelLabel(move) }}</template>
                </td>
                <td>
                  <RouterLink
                    :to="{
                      name: 'move',
                      params: { slug: move.info.slug },
                      query: { game: selected },
                    }"
                    class="moves-card__link font-weight-medium"
                  >
                    {{ moveName(move) }}
                  </RouterLink>
                  <div class="d-flex align-center ga-1 my-1">
                    <TypeChip :type="move.info.type" size="x-small" />
                    <span class="text-label-small opacity-70">
                      {{ t(`moves.${move.info.category}`) }}
                    </span>
                  </div>
                </td>
                <td class="moves-card__num text-end">{{ move.info.power ?? dash }}</td>
                <td class="moves-card__num text-end">
                  {{ move.info.accuracy ? `${move.info.accuracy}%` : dash }}
                </td>
                <td class="moves-card__num text-end">{{ move.info.pp ?? dash }}</td>
              </tr>
            </tbody>
          </v-table>
          <p class="text-body-small opacity-70 mt-2 mb-0">{{ t('moves.hint') }}</p>
        </template>
      </template>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.moves-card__link {
  display: block;
  color: inherit;
  text-decoration: underline;
  text-decoration-color: rgba(var(--v-theme-on-surface), 0.4);
  text-underline-offset: 3px;
}

.moves-card__game {
  max-width: 320px;
}

.moves-card__num {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.moves-card__table {
  background: transparent;
}

/* Cabe em 360 px de largura: células estreitas e o nome do golpe quebrando linha. */
.moves-card__table :deep(th),
.moves-card__table :deep(td) {
  padding: 4px 6px !important;
}

.moves-card__table :deep(th:first-child),
.moves-card__table :deep(td:first-child) {
  padding-inline-start: 0 !important;
}

.moves-card__table :deep(th:last-child),
.moves-card__table :deep(td:last-child) {
  padding-inline-end: 0 !important;
}
</style>
