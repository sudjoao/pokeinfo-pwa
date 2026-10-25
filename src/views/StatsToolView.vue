<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { STAT_NAMES, type StatName } from '@/types/pokemon'
import { usePokedexStore } from '@/stores/pokedex'
import { usePokemonData } from '@/composables/usePokemonData'
import { formatPokemonName } from '@/utils/pokemon'
import { applyCharacteristic, possibleIvs, statValue } from '@/utils/stats'
import {
  CHARACTERISTIC_LIST,
  NATURE_LIST,
  NATURE_STATS,
  findNature,
  natureEffect,
  natureFor,
  natureName,
} from '@/utils/natures'
import DetailLayout from '@/components/templates/DetailLayout.vue'
import PokemonAvatar from '@/components/atoms/PokemonAvatar.vue'

type Tab = 'natures' | 'iv'
type Mode = 'iv' | 'stats'

const route = useRoute()
const router = useRouter()
const { t, te, locale } = useI18n()
const pokedex = usePokedexStore()
const pokemonData = usePokemonData()

onMounted(() => {
  pokemonData.load().catch(() => {})
})

const tab = ref<Tab>(route.query.tab === 'iv' || route.query.id ? 'iv' : 'natures')
const mode = ref<Mode>('iv')
const pokemonId = ref<number | null>(Number(route.query.id) || null)
const level = ref(50)
const natureSlug = ref<string>('hardy')
const characteristic = ref<number | null>(null)
/** Por stat: EV e o valor do jogo (modo IV) ou o IV (modo stats). */
const evs = reactive(
  Object.fromEntries(STAT_NAMES.map((name) => [name, 0])) as Record<StatName, number>,
)
const actual = reactive(
  Object.fromEntries(STAT_NAMES.map((name) => [name, null])) as Record<StatName, number | null>,
)
const ivs = reactive(
  Object.fromEntries(STAT_NAMES.map((name) => [name, 31])) as Record<StatName, number>,
)

watch([tab, pokemonId], () => {
  const query: LocationQueryRaw = {}
  if (tab.value === 'iv') query.tab = 'iv'
  if (pokemonId.value) query.id = String(pokemonId.value)
  router.replace({ query })
})

// ---- Naturezas ----------------------------------------------------------------------------------

const selectedNature = ref<string | null>(null)
const highlighted = computed(() => findNature(selectedNature.value))

function statShort(stat: StatName): string {
  return t(`statShort.${stat}`)
}

function flavorLabel(flavor: string | null): string {
  if (!flavor) return '—'
  return te(`flavor.${flavor}`) ? t(`flavor.${flavor}`) : formatPokemonName(flavor)
}

// ---- Calculadora --------------------------------------------------------------------------------

const pokemonItems = computed(() =>
  pokedex.index.map((entry) => ({ value: entry.id, title: formatPokemonName(entry.name) })),
)

const base = computed<Record<StatName, number> | null>(() => {
  const row = pokemonId.value ? pokemonData.table.value?.rows[pokemonId.value] : undefined
  if (!row) return null
  return Object.fromEntries(
    STAT_NAMES.map((name, index) => [name, row[index] as number]),
  ) as Record<StatName, number>
})

const nature = computed(() => findNature(natureSlug.value))
const natureItems = computed(() =>
  NATURE_LIST.map((n) => ({
    value: n.slug,
    title: n.up
      ? `${natureName(n, locale.value)} (+${statShort(n.up)} −${statShort(n.down!)})`
      : `${natureName(n, locale.value)} (${t('statsTool.neutral')})`,
  })),
)
const characteristicItems = computed(() =>
  CHARACTERISTIC_LIST.map((c, index) => ({
    value: index,
    title: locale.value === 'es' && c.es ? c.es : c.en,
  })),
)

const clampLevel = computed(() => Math.min(100, Math.max(1, Math.round(level.value || 1))))
const evTotal = computed(() => STAT_NAMES.reduce((sum, name) => sum + (evs[name] || 0), 0))

/** Modo IV: faixa possível de cada stat (com a característica aplicada, se houver). */
const ivResults = computed<Record<StatName, number[] | null> | null>(() => {
  const b = base.value
  if (!b) return null
  const raw = Object.fromEntries(
    STAT_NAMES.map((name) => {
      const value = actual[name]
      return [
        name,
        value
          ? possibleIvs(
              name,
              b[name],
              clampLevel.value,
              evs[name] || 0,
              natureEffect(nature.value, name),
              value,
            )
          : null,
      ]
    }),
  ) as Record<StatName, number[] | null>
  const chosen = characteristic.value === null ? null : CHARACTERISTIC_LIST[characteristic.value]
  if (!chosen || STAT_NAMES.some((name) => raw[name] === null)) return raw
  return applyCharacteristic(raw as Record<StatName, number[]>, chosen.stat, chosen.mod5)
})

/** Modo stats: valor de cada stat com os IVs informados. */
const statResults = computed(() => {
  const b = base.value
  if (!b) return null
  return Object.fromEntries(
    STAT_NAMES.map((name) => [
      name,
      statValue(
        name,
        b[name],
        clampLevel.value,
        ivs[name] || 0,
        evs[name] || 0,
        natureEffect(nature.value, name),
      ),
    ]),
  ) as Record<StatName, number>
})

function ivText(list: number[] | null): string {
  if (list === null) return '—'
  if (!list.length) return t('statsTool.impossible')
  const min = list[0]!
  const max = list[list.length - 1]!
  return min === max ? String(min) : `${min}–${max}`
}

function natureMark(stat: StatName): string {
  const effect = natureEffect(nature.value, stat)
  return effect === 110 ? '↑' : effect === 90 ? '↓' : ''
}

function goBack(): void {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'home' })
}
</script>

<template>
  <DetailLayout :title="t('statsTool.title')" @back="goBack">
    <div class="d-flex flex-column ga-4">
      <v-btn-toggle
        v-model="tab"
        mandatory
        divided
        variant="outlined"
        density="comfortable"
        class="align-self-start"
        :aria-label="t('statsTool.title')"
      >
        <v-btn value="natures" :aria-pressed="tab === 'natures'">{{
          t('statsTool.natures')
        }}</v-btn>
        <v-btn value="iv" :aria-pressed="tab === 'iv'">{{ t('statsTool.calculator') }}</v-btn>
      </v-btn-toggle>

      <template v-if="tab === 'natures'">
        <v-card>
          <v-card-text>
            <p class="text-body-medium">{{ t('statsTool.naturesIntro') }}</p>
            <div class="natures-table-wrap">
              <table class="natures-table">
                <caption class="d-sr-only">
                  {{
                    t('statsTool.naturesCaption')
                  }}
                </caption>
                <thead>
                  <tr>
                    <td />
                    <th
                      v-for="down in NATURE_STATS"
                      :key="down"
                      scope="col"
                      class="text-label-medium"
                    >
                      −{{ statShort(down) }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="up in NATURE_STATS" :key="up">
                    <th scope="row" class="text-label-small">+{{ statShort(up) }}</th>
                    <td v-for="down in NATURE_STATS" :key="down">
                      <button
                        type="button"
                        class="natures-table__cell text-body-small"
                        :class="{
                          'natures-table__cell--neutral': up === down,
                          'natures-table__cell--active':
                            selectedNature === natureFor(up, down)?.slug,
                        }"
                        :aria-pressed="selectedNature === natureFor(up, down)?.slug"
                        @click="selectedNature = natureFor(up, down)?.slug ?? null"
                      >
                        {{ natureFor(up, down) ? natureName(natureFor(up, down)!, locale) : '' }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-if="highlighted" class="text-body-medium mt-4 mb-0" aria-live="polite">
              <strong>{{ natureName(highlighted, locale) }}</strong
              >:
              <template v-if="highlighted.up">
                {{
                  t('statsTool.natureEffect', {
                    up: t(`stat.${highlighted.up}`),
                    down: t(`stat.${highlighted.down}`),
                  })
                }}
                · {{ t('statsTool.likes', { flavor: flavorLabel(highlighted.likes) }) }} ·
                {{ t('statsTool.hates', { flavor: flavorLabel(highlighted.hates) }) }}
              </template>
              <template v-else>{{ t('statsTool.neutralLong') }}</template>
            </p>
          </v-card-text>
        </v-card>
      </template>

      <template v-else>
        <v-card>
          <v-card-text class="d-flex flex-column ga-3">
            <p class="text-body-small opacity-70 mb-0">{{ t('statsTool.formulaHint') }}</p>
            <v-autocomplete
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              v-model="pokemonId"
              :items="pokemonItems"
              :label="t('statsTool.pokemon')"
              density="compact"
              variant="outlined"
              hide-details
              auto-select-first
            >
              <template #prepend-inner>
                <PokemonAvatar v-if="pokemonId" :id="pokemonId" name="" :size="28" decorative />
              </template>
            </v-autocomplete>
            <div class="stats-tool__row">
              <v-text-field
                v-model.number="level"
                type="number"
                min="1"
                max="100"
                :label="t('statsTool.level')"
                density="compact"
                variant="outlined"
                hide-details
              />
              <v-select
                v-model="natureSlug"
                :items="natureItems"
                :label="t('statsTool.nature')"
                density="compact"
                variant="outlined"
                hide-details
              />
            </div>
            <v-btn-toggle
              v-model="mode"
              mandatory
              divided
              variant="outlined"
              density="compact"
              class="align-self-start"
              :aria-label="t('statsTool.calculator')"
            >
              <v-btn value="iv" size="small" :aria-pressed="mode === 'iv'">{{
                t('statsTool.modeIv')
              }}</v-btn>
              <v-btn value="stats" size="small" :aria-pressed="mode === 'stats'">{{
                t('statsTool.modeStats')
              }}</v-btn>
            </v-btn-toggle>
            <v-select
              v-if="mode === 'iv'"
              v-model="characteristic"
              :items="characteristicItems"
              :label="t('statsTool.characteristic')"
              density="compact"
              variant="outlined"
              hide-details
              clearable
            />
          </v-card-text>
        </v-card>

        <v-card v-if="!pokemonId" class="pa-4 opacity-70">{{ t('statsTool.pickPokemon') }}</v-card>
        <v-card v-else-if="!base">
          <v-skeleton-loader aria-hidden="true" type="table-tbody" />
        </v-card>
        <v-card v-else>
          <v-table density="compact">
            <caption class="d-sr-only">
              {{
                t('statsTool.calculator')
              }}
            </caption>
            <thead>
              <tr>
                <th scope="col">{{ t('statsTool.stat') }}</th>
                <th scope="col">{{ t('statsTool.ev') }}</th>
                <th scope="col">{{ mode === 'iv' ? t('statsTool.actual') : t('statsTool.iv') }}</th>
                <th scope="col" class="text-end">
                  {{ mode === 'iv' ? t('statsTool.iv') : t('statsTool.actual') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="name in STAT_NAMES" :key="name">
                <th scope="row" class="text-label-large font-weight-regular">
                  {{ statShort(name) }}
                  <span
                    v-if="natureMark(name)"
                    :aria-label="
                      t(natureMark(name) === '↑' ? 'statsTool.raised' : 'statsTool.lowered')
                    "
                  >
                    {{ natureMark(name) }}
                  </span>
                  <div class="text-label-small opacity-70">
                    {{ t('statsTool.baseValue', { n: base[name] }) }}
                  </div>
                </th>
                <td>
                  <input
                    v-model.number="evs[name]"
                    type="number"
                    min="0"
                    max="252"
                    class="stats-tool__input"
                    :aria-label="t('statsTool.evFor', { stat: t(`stat.${name}`) })"
                  />
                </td>
                <td>
                  <input
                    v-if="mode === 'iv'"
                    v-model.number="actual[name]"
                    type="number"
                    min="1"
                    class="stats-tool__input"
                    :aria-label="t('statsTool.actualFor', { stat: t(`stat.${name}`) })"
                  />
                  <input
                    v-else
                    v-model.number="ivs[name]"
                    type="number"
                    min="0"
                    max="31"
                    class="stats-tool__input"
                    :aria-label="t('statsTool.ivFor', { stat: t(`stat.${name}`) })"
                  />
                </td>
                <td class="text-end stats-tool__num font-weight-medium">
                  {{ mode === 'iv' ? ivText(ivResults?.[name] ?? null) : statResults?.[name] }}
                </td>
              </tr>
            </tbody>
          </v-table>
          <v-card-text class="pt-2">
            <p class="text-body-small mb-0" :class="{ 'text-error': evTotal > 510 }">
              {{ t('statsTool.evTotal', { n: evTotal }) }}
            </p>
          </v-card-text>
        </v-card>
      </template>
    </div>
  </DetailLayout>
</template>

<style scoped>
.natures-table-wrap {
  overflow-x: auto;
}

.natures-table {
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 2px;
}

.natures-table thead td,
.natures-table tbody th {
  width: 40px;
}

.natures-table th {
  padding: 4px;
  text-align: center;
  white-space: nowrap;
}

.natures-table__cell {
  width: 100%;
  min-height: 44px;
  padding: 2px 1px;
  /* Nome inteiro numa linha: "Adamant" quebrado em "Adama/nt" não se lê. Cabe a 320 px. */
  overflow-wrap: normal;
  font-size: 0.6875rem;
  letter-spacing: 0;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.natures-table__cell--neutral {
  opacity: 0.7;
  font-style: italic;
}

.natures-table__cell--active {
  outline: 2px solid rgb(var(--v-theme-primary));
}

.stats-tool__row {
  display: grid;
  grid-template-columns: minmax(80px, 120px) 1fr;
  gap: 12px;
}

.stats-tool__table :deep(th),
.stats-tool__table :deep(td) {
  padding-inline: 8px !important;
}

.stats-tool__input {
  width: 56px;
  padding: 4px 6px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font-variant-numeric: tabular-nums;
}

.stats-tool__num {
  font-variant-numeric: tabular-nums;
}
</style>
