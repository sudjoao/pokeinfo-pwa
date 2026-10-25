<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  ref,
  useTemplateRef,
  type ComponentPublicInstance,
} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { mdiClose } from '@mdi/js'
import { usePokedexStore } from '@/stores/pokedex'
import { usePokemonData } from '@/composables/usePokemonData'
import { focusPageTitle } from '@/composables/usePageFocus'
import { STAT_NAMES, type PokemonType } from '@/types/pokemon'
import { formatHeight, formatPokemonName, formatWeight } from '@/utils/pokemon'
import { rowTotal } from '@/utils/advancedFilters'
import { attackMultiplier, battleTypes } from '@/utils/typeChart'
import DetailLayout from '@/components/templates/DetailLayout.vue'
import PokemonArtwork from '@/components/atoms/PokemonArtwork.vue'
import TypeChip from '@/components/atoms/TypeChip.vue'
import MultiplierBadge from '@/components/atoms/MultiplierBadge.vue'

const MAX_COMPARE = 3

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const store = usePokedexStore()
const pokemonData = usePokemonData()

onMounted(() => {
  pokemonData.load().catch(() => {})
})

/** `?ids=6,9,3` -> até 3 ids existentes. */
const ids = computed(() => {
  const raw = typeof route.query.ids === 'string' ? route.query.ids.split(',') : []
  const valid = raw.map(Number).filter((id) => Number.isInteger(id) && id > 0)
  return [...new Set(valid)].slice(0, MAX_COMPARE)
})

function setIds(next: number[]): void {
  router.replace({ query: next.length ? { ids: next.join(',') } : {} })
}

const columns = computed(() =>
  ids.value.map((id) => {
    const row = pokemonData.table.value?.rows[id]
    return {
      id,
      name: formatPokemonName(store.entryOf(id)?.name ?? String(id)),
      types: (store.typesOf(id) ?? []) as PokemonType[],
      row,
    }
  }),
)

/** Maior valor de cada linha, para destacar quem vence (pode haver empate). */
function best(values: (number | undefined)[]): number {
  return Math.max(...values.map((value) => value ?? -1))
}

function isBest(value: number | undefined, values: (number | undefined)[]): boolean {
  return value !== undefined && value === best(values) && columns.value.length > 1
}

const statRows = computed(() => [
  ...STAT_NAMES.map((name, index) => ({
    key: name,
    label: t(`stat.${name}`),
    values: columns.value.map((column) => column.row?.[index] as number | undefined),
  })),
  {
    key: 'total',
    label: t('filters.sort.total'),
    values: columns.value.map((column) => (column.row ? rowTotal(column.row) : undefined)),
  },
])

function abilityNames(column: (typeof columns.value)[number]): string[] {
  const table = pokemonData.table.value
  if (!table || !column.row) return ['—']
  const name = (index: number) => {
    const [slug, es] = table.abilities[index] ?? ['', '']
    return (locale.value === 'es' && es) || formatPokemonName(slug)
  }
  const list = column.row[10].map(name)
  if (column.row[11] >= 0) list.push(`${name(column.row[11])} (${t('ability.hidden')})`)
  return list
}

function weaknesses(types: readonly PokemonType[]) {
  return battleTypes()
    .map((type) => ({ type, multiplier: attackMultiplier(type, types) }))
    .filter((entry) => entry.multiplier > 1)
    .sort((a, b) => b.multiplier - a.multiplier)
}

// Seletor: busca no índice já em memória (nome ou número).
const search = ref<number | null>(null)
const options = computed(() =>
  store.index
    .filter((entry) => !ids.value.includes(entry.id))
    .map((entry) => ({
      value: entry.id,
      title: `${entry.id <= 1025 ? `#${entry.id} ` : ''}${formatPokemonName(entry.name)}`,
    })),
)

const autocomplete = useTemplateRef<ComponentPublicInstance>('autocomplete')

function add(id: number | null): void {
  if (!id || ids.value.length >= MAX_COMPARE) return
  setIds([...ids.value, id])
  // No terceiro o campo some; o foco iria para o body.
  if (ids.value.length + 1 >= MAX_COMPARE) nextTick(focusPageTitle)
  search.value = null
}

function remove(id: number): void {
  setIds(ids.value.filter((item) => item !== id))
  // O botão de remover sai junto com a coluna: o foco volta para o campo de adicionar.
  nextTick(() =>
    (autocomplete.value?.$el as HTMLElement | undefined)?.querySelector('input')?.focus(),
  )
}

function goBack(): void {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'home' })
}
</script>

<template>
  <DetailLayout :title="t('compare.title')" @back="goBack">
    <div class="d-flex flex-column ga-4">
      <v-autocomplete
        v-if="ids.length < MAX_COMPARE"
        ref="autocomplete"
        v-model="search"
        :items="options"
        :label="t('compare.add')"
        :hint="t('compare.hint', { n: MAX_COMPARE })"
        persistent-hint
        variant="outlined"
        density="comfortable"
        clearable
        @update:model-value="add"
      />

      <p v-if="!ids.length" class="opacity-70">{{ t('compare.empty') }}</p>

      <v-card v-else>
        <v-card-text>
          <!-- Tabela de verdade: o leitor de tela anuncia "Ataque, Charizard: 84" ao navegar. -->
          <table class="compare">
            <caption class="d-sr-only">
              {{
                t('compare.title')
              }}
            </caption>
            <colgroup>
              <col class="compare__label-col" />
              <col v-for="column in columns" :key="column.id" />
            </colgroup>
            <thead>
              <tr>
                <td />
                <th v-for="column in columns" :key="column.id" scope="col" class="compare__pokemon">
                  <v-btn
                    :icon="mdiClose"
                    size="small"
                    variant="text"
                    class="compare__remove"
                    :aria-label="t('compare.remove', { name: column.name })"
                    @click="remove(column.id)"
                  />
                  <PokemonArtwork :id="column.id" alt="" :size="88" />
                  <RouterLink
                    :to="{ name: 'pokemon', params: { id: column.id } }"
                    class="compare__name"
                  >
                    {{ column.name }}
                  </RouterLink>
                  <div class="d-flex flex-wrap justify-center ga-1 mt-1">
                    <TypeChip
                      v-for="type in column.types"
                      :key="type"
                      :type="type"
                      size="x-small"
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in statRows" :key="row.key">
                <th
                  scope="row"
                  class="compare__label"
                  :class="{ 'font-weight-bold': row.key === 'total' }"
                >
                  {{ row.label }}
                </th>
                <td
                  v-for="(value, index) in row.values"
                  :key="index"
                  class="compare__value"
                  :class="{ 'compare__value--best': isBest(value, row.values) }"
                >
                  {{ value ?? '—' }}
                  <span v-if="isBest(value, row.values)" class="d-sr-only">
                    ({{ t('compare.best') }})
                  </span>
                </td>
              </tr>
              <tr>
                <th scope="row" class="compare__label">{{ t('detail.height') }}</th>
                <td v-for="column in columns" :key="column.id" class="compare__value">
                  {{ column.row ? formatHeight(column.row[6] / 10, locale) : '—' }}
                </td>
              </tr>
              <tr>
                <th scope="row" class="compare__label">{{ t('detail.weight') }}</th>
                <td v-for="column in columns" :key="column.id" class="compare__value">
                  {{ column.row ? formatWeight(column.row[7] / 10, locale) : '—' }}
                </td>
              </tr>
              <tr>
                <th scope="row" class="compare__label">{{ t('detail.abilities') }}</th>
                <td
                  v-for="column in columns"
                  :key="column.id"
                  class="compare__value text-body-small"
                >
                  <span v-for="name in abilityNames(column)" :key="name" class="d-block">{{
                    name
                  }}</span>
                </td>
              </tr>
              <tr>
                <th scope="row" class="compare__label">{{ t('detail.weakTo') }}</th>
                <td v-for="column in columns" :key="column.id" class="compare__value">
                  <ul class="compare__weak">
                    <li v-for="entry in weaknesses(column.types)" :key="entry.type">
                      <TypeChip :type="entry.type" size="x-small" />
                      <MultiplierBadge :multiplier="entry.multiplier" />
                    </li>
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
          <p class="text-body-small opacity-70 mt-3 mb-0">{{ t('compare.bestHint') }}</p>
        </v-card-text>
      </v-card>
    </div>
  </DetailLayout>
</template>

<style scoped>
.compare {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 4px 8px;
}

.compare th,
.compare td {
  vertical-align: middle;
}

.compare__label-col {
  width: 24%;
}

.compare__pokemon {
  position: relative;
  text-align: center;
  font-weight: inherit;
}

.compare__remove {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
}

.compare__name {
  display: block;
  color: inherit;
  font-weight: 600;
  font-size: 0.875rem;
  overflow-wrap: anywhere;
}

.compare__label {
  text-align: start;
  font-weight: inherit;
  font-size: 0.8125rem;
  hyphens: auto;
  overflow-wrap: break-word;
}

.compare__value {
  text-align: center;
  font-variant-numeric: tabular-nums;
  border-radius: 8px;
  padding: 2px 4px;
}

.compare__value--best {
  background: color-mix(in srgb, rgb(var(--v-theme-secondary)) 18%, transparent);
  font-weight: 700;
}

.compare__weak {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.compare__weak li {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 2px;
}
</style>
