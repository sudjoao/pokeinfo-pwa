<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { BATTLE_TYPES } from '@/data/typeChart'
import {
  CATEGORIES,
  GENERATIONS,
  SORT_KEYS,
  type AdvancedFilters,
  type SortKey,
} from '@/utils/advancedFilters'
import { formatPokemonName } from '@/utils/pokemon'
import { STAT_NAMES } from '@/types/pokemon'
import { useOverlayFocusReturn } from '@/composables/useOverlayFocusReturn'

const props = defineProps<{
  filters: AdvancedFilters
  /** [slug, nome em espanhol] de todas as habilidades; null enquanto a tabela não carregou. */
  abilities: readonly (readonly [string, string])[] | null
}>()

const open = defineModel<boolean>({ required: true })
useOverlayFocusReturn(open)

const emit = defineEmits<{ update: [filters: AdvancedFilters]; clear: [] }>()

const { t, locale } = useI18n()

function set<K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]): void {
  emit('update', { ...props.filters, [key]: value })
}

function sortLabel(key: SortKey): string {
  if ((STAT_NAMES as readonly string[]).includes(key)) return t(`stat.${key}`)
  return t(`filters.sort.${key}`)
}

const sortItems = computed(() => SORT_KEYS.map((key) => ({ value: key, title: sortLabel(key) })))

const typeItems = computed(() =>
  BATTLE_TYPES.map((type) => ({ value: type, title: t(`type.${type}`) })),
)

const abilityItems = computed(() =>
  (props.abilities ?? [])
    .map(([slug, es]) => ({
      value: slug,
      title: (locale.value === 'es' && es) || formatPokemonName(slug),
    }))
    .sort((a, b) => a.title.localeCompare(b.title)),
)

/** Ao escolher um stat/total, o padrão útil é do maior para o menor. */
function setSort(key: SortKey): void {
  emit('update', { ...props.filters, sort: key, desc: key !== 'number' && key !== 'name' })
}
</script>

<template>
  <v-bottom-sheet v-model="open" scrollable inset :aria-label="t('filters.title')">
    <v-card rounded="t-xl" :title="t('filters.title')">
      <v-card-text class="advanced-sheet__body d-flex flex-column ga-4">
        <div class="d-flex flex-wrap align-center ga-2">
          <v-select
            :model-value="filters.sort"
            :items="sortItems"
            :label="t('filters.sortBy')"
            density="compact"
            variant="outlined"
            hide-details
            class="advanced-sheet__sort"
            @update:model-value="setSort"
          />
          <v-btn-toggle
            :model-value="filters.desc ? 'desc' : 'asc'"
            mandatory
            density="compact"
            variant="outlined"
            divided
            :aria-label="t('filters.direction')"
            @update:model-value="set('desc', $event === 'desc')"
          >
            <v-btn value="asc" size="small" :aria-pressed="!filters.desc">{{
              t('filters.asc')
            }}</v-btn>
            <v-btn value="desc" size="small" :aria-pressed="filters.desc">{{
              t('filters.desc')
            }}</v-btn>
          </v-btn-toggle>
        </div>

        <v-switch
          :model-value="filters.favorites"
          :label="t('filters.favorites')"
          color="primary"
          density="compact"
          hide-details
          @update:model-value="set('favorites', Boolean($event))"
        />

        <fieldset class="advanced-sheet__group">
          <legend class="text-label-large mb-1">{{ t('filters.generation') }}</legend>
          <v-chip-group
            :model-value="filters.generations"
            multiple
            column
            selected-class="text-primary-safe"
            @update:model-value="
              set(
                'generations',
                [...($event as number[])].sort((a, b) => a - b),
              )
            "
          >
            <v-chip
              v-for="gen in GENERATIONS"
              :key="gen"
              :value="gen"
              filter
              variant="outlined"
              role="button"
              :aria-pressed="filters.generations.includes(gen)"
            >
              {{ gen }}
            </v-chip>
          </v-chip-group>
        </fieldset>

        <fieldset class="advanced-sheet__group">
          <legend class="text-label-large mb-1">{{ t('filters.category') }}</legend>
          <v-chip-group
            :model-value="filters.categories"
            multiple
            column
            selected-class="text-primary-safe"
            @update:model-value="set('categories', $event)"
          >
            <v-chip
              v-for="cat in CATEGORIES"
              :key="cat"
              :value="cat"
              filter
              variant="outlined"
              role="button"
              :aria-pressed="filters.categories.includes(cat)"
            >
              {{ t(`filters.categories.${cat}`) }}
            </v-chip>
          </v-chip-group>
        </fieldset>

        <v-select
          :model-value="filters.weakTo"
          :items="typeItems"
          :label="t('filters.weakTo')"
          :hint="t('filters.weakToHint')"
          persistent-hint
          clearable
          density="compact"
          variant="outlined"
          @update:model-value="set('weakTo', $event ?? null)"
        />

        <v-autocomplete
          :model-value="filters.ability"
          :items="abilityItems"
          :label="t('filters.ability')"
          :loading="!abilities"
          clearable
          density="compact"
          variant="outlined"
          hide-details
          @update:model-value="set('ability', $event ?? null)"
        />

        <div>
          <div id="advanced-min-total" class="text-label-large">
            {{ t('filters.minTotal', { n: filters.minTotal ?? 0 }) }}
          </div>
          <v-slider
            :model-value="filters.minTotal ?? 0"
            :min="0"
            :max="720"
            :step="10"
            color="primary"
            hide-details
            aria-labelledby="advanced-min-total"
            @update:model-value="set('minTotal', $event > 0 ? $event : null)"
          />
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn @click="emit('clear')">{{ t('common.clear') }}</v-btn>
        <v-spacer />
        <v-btn color="primary" variant="flat" @click="open = false">{{ t('common.done') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-bottom-sheet>
</template>

<style scoped>
.advanced-sheet__body {
  max-height: 75vh;
  /* Espaço para o rótulo flutuante do primeiro campo, que o contêiner rolável cortaria. */
  padding-top: 12px !important;
}

.advanced-sheet__sort {
  min-width: 200px;
  flex: 1 1 200px;
}

.advanced-sheet__group {
  border: 0;
  padding: 0;
  margin: 0;
}
</style>
