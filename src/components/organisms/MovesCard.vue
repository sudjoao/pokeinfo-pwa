<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiArrowDown, mdiArrowUp } from '@mdi/js'
import type { PokemonMoveLearn, PokemonType } from '@/types/pokemon'
import { findGame } from '@/utils/games'
import { formatVersionGroup } from '@/utils/evolution'
import { formatPokemonName } from '@/utils/pokemon'
import { isStab, sortLearnedMoves, type MoveColumn } from '@/utils/detailExtras'
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
  /** Tipos do Pokémon, para marcar os golpes com STAB (mesmo tipo, +50% de dano). */
  types?: readonly PokemonType[]
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

/*
 * Ordenação pelos cabeçalhos. Padrão: por nível na aba "Por nível", pelo nome exibido nas outras
 * (o collator do idioma põe os nomes em espanhol em ordem). O primeiro toque num número ordena
 * do maior para o menor (o que interessa em poder/precisão/PP); o segundo inverte.
 */
const sortColumn = ref<MoveColumn>('level')
const sortDesc = ref(false)
const defaultColumn = computed<MoveColumn>(() => (tab.value === 'level-up' ? 'level' : 'name'))
watch(defaultColumn, (column) => {
  sortColumn.value = column
  sortDesc.value = false
})

function sortBy(column: MoveColumn): void {
  if (sortColumn.value === column) {
    sortDesc.value = !sortDesc.value
    return
  }
  sortColumn.value = column
  sortDesc.value = column !== 'level' && column !== 'name'
}

function ariaSort(column: MoveColumn): 'ascending' | 'descending' | undefined {
  if (sortColumn.value !== column) return undefined
  return sortDesc.value ? 'descending' : 'ascending'
}

const collator = computed(() => new Intl.Collator(locale.value, { sensitivity: 'base' }))
const rows = computed(() => {
  const list = byMethod.value?.[tab.value] ?? []
  return sortLearnedMoves(list, sortColumn.value, sortDesc.value, moveName, collator.value)
})

/** Colunas numéricas (poder, precisão, PP) e, na aba por nível, o nível. */
const COLUMNS: readonly { key: MoveColumn; label: string }[] = [
  { key: 'power', label: 'moves.power' },
  { key: 'accuracy', label: 'moves.accuracy' },
  { key: 'pp', label: 'moves.pp' },
]

function stab(move: LearnedMove): boolean {
  return isStab(move.info, props.types ?? [])
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
                <th v-if="tab === 'level-up'" scope="col" :aria-sort="ariaSort('level')">
                  <button type="button" class="moves-card__sort" @click="sortBy('level')">
                    {{ t('moves.level') }}
                    <v-icon
                      v-if="sortColumn === 'level'"
                      :icon="sortDesc ? mdiArrowDown : mdiArrowUp"
                      size="14"
                    />
                  </button>
                </th>
                <th scope="col" :aria-sort="ariaSort('name')">
                  <button type="button" class="moves-card__sort" @click="sortBy('name')">
                    {{ t('moves.move') }}
                    <v-icon
                      v-if="sortColumn === 'name'"
                      :icon="sortDesc ? mdiArrowDown : mdiArrowUp"
                      size="14"
                    />
                  </button>
                </th>
                <th
                  v-for="column in COLUMNS"
                  :key="column.key"
                  scope="col"
                  class="text-end"
                  :aria-sort="ariaSort(column.key)"
                >
                  <button
                    type="button"
                    class="moves-card__sort moves-card__sort--end"
                    @click="sortBy(column.key)"
                  >
                    {{ t(column.label) }}
                    <v-icon
                      v-if="sortColumn === column.key"
                      :icon="sortDesc ? mdiArrowDown : mdiArrowUp"
                      size="14"
                    />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="move in rows" :key="`${move.info.slug}-${move.level}`">
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
                  <div class="d-flex align-center flex-wrap ga-1 my-1">
                    <TypeChip :type="move.info.type" size="x-small" />
                    <span class="text-label-small opacity-70">
                      {{ t(`moves.${move.info.category}`) }}
                    </span>
                    <span v-if="stab(move)" class="moves-card__stab text-label-small">
                      <span aria-hidden="true">{{ t('moves.stab') }}</span>
                      <span class="d-sr-only">{{ t('moves.stabLong') }}</span>
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
          <p class="text-body-small opacity-70 mt-2 mb-0">
            {{ t('moves.hint') }} {{ t('moves.sortHint') }}
          </p>
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

/* Cabeçalho clicável com a mesma cara do texto do cabeçalho (o ícone diz a direção). */
.moves-card__sort {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: inherit;
  cursor: pointer;
  min-height: 32px;
}

.moves-card__sort--end {
  justify-content: flex-end;
}

/* Selo "STAB": golpe do tipo do Pokémon, com o bônus de 50%. */
.moves-card__stab {
  padding: 0 4px;
  border-radius: 4px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: rgb(var(--v-theme-secondary));
  background: rgba(var(--v-theme-secondary), 0.14);
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
