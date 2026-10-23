<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { PokemonType } from '@/types/pokemon'
import { isPokemonType, TYPE_COLORS, TYPE_TEXT_COLORS } from '@/utils/pokemon'
import { attackMultiplier, battleTypes, LATEST_GENERATION } from '@/utils/typeChart'
import DetailLayout from '@/components/templates/DetailLayout.vue'
import TypeToggle from '@/components/atoms/TypeToggle.vue'
import MultiplierBadge from '@/components/atoms/MultiplierBadge.vue'
import MultiplierGroups from '@/components/molecules/MultiplierGroups.vue'

type Mode = 'defense' | 'attack' | 'chart'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

/** As três tabelas que existiram: 1ª geração, 2ª a 5ª e 6ª em diante (usa a última de cada faixa). */
const GENERATION_OPTIONS = [
  { value: 1, key: 'types.gen1' },
  { value: 5, key: 'types.gen2to5' },
  { value: LATEST_GENERATION, key: 'types.gen6plus' },
] as const

// Estado na URL (`/types?mode=defense&types=fire,flying&gen=5`): dá para compartilhar o cálculo.
const mode = computed<Mode>(() =>
  route.query.mode === 'attack' || route.query.mode === 'chart' ? route.query.mode : 'defense',
)
const generation = computed(() => {
  const gen = Number(route.query.gen)
  return GENERATION_OPTIONS.some((option) => option.value === gen) ? gen : LATEST_GENERATION
})
const available = computed(() => battleTypes(generation.value))
const selected = computed<PokemonType[]>(() => {
  const raw = typeof route.query.types === 'string' ? route.query.types.split(',') : []
  const valid = raw.filter(isPokemonType).filter((type) => available.value.includes(type))
  return [...new Set(valid)].slice(0, mode.value === 'attack' ? 1 : 2)
})

function update(change: { mode?: Mode; types?: PokemonType[]; gen?: number }): void {
  const next = {
    mode: change.mode ?? mode.value,
    types: change.types ?? selected.value,
    gen: change.gen ?? generation.value,
  }
  const query: LocationQueryRaw = {}
  if (next.mode !== 'defense') query.mode = next.mode
  if (next.types.length) query.types = next.types.join(',')
  if (next.gen !== LATEST_GENERATION) query.gen = String(next.gen)
  router.replace({ query })
}

function setMode(value: Mode): void {
  // Ataque usa um tipo só: fica com o primeiro escolhido.
  update({ mode: value, types: value === 'attack' ? selected.value.slice(0, 1) : selected.value })
}

function toggle(type: PokemonType): void {
  const current = selected.value
  if (current.includes(type)) update({ types: current.filter((item) => item !== type) })
  else if (mode.value === 'attack') update({ types: [type] })
  else update({ types: current.length < 2 ? [...current, type] : [current[0]!, type] })
}

const entries = computed(() => {
  if (!selected.value.length) return []
  return available.value.map((type) =>
    mode.value === 'attack'
      ? { type, multiplier: attackMultiplier(selected.value[0]!, [type], generation.value) }
      : { type, multiplier: attackMultiplier(type, selected.value, generation.value) },
  )
})

function abbreviation(type: PokemonType): string {
  return t(`type.${type}`).slice(0, 3)
}

function goBack(): void {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'home' })
}
</script>

<template>
  <DetailLayout :title="t('types.title')" @back="goBack">
    <div class="d-flex flex-column ga-4">
      <v-btn-toggle
        :model-value="mode"
        mandatory
        divided
        variant="outlined"
        density="comfortable"
        class="align-self-start"
        @update:model-value="setMode"
      >
        <v-btn value="defense">{{ t('types.defense') }}</v-btn>
        <v-btn value="attack">{{ t('types.attack') }}</v-btn>
        <v-btn value="chart">{{ t('types.chart') }}</v-btn>
      </v-btn-toggle>

      <div>
        <div id="types-generation" class="text-label-large mb-1">{{ t('types.generation') }}</div>
        <v-btn-toggle
          :model-value="generation"
          mandatory
          divided
          variant="outlined"
          density="compact"
          aria-labelledby="types-generation"
          @update:model-value="update({ gen: $event })"
        >
          <v-btn
            v-for="option in GENERATION_OPTIONS"
            :key="option.value"
            :value="option.value"
            size="small"
          >
            {{ t(option.key) }}
          </v-btn>
        </v-btn-toggle>
      </div>

      <template v-if="mode !== 'chart'">
        <v-card>
          <v-card-text>
            <p class="text-body-medium mb-3">
              {{ mode === 'attack' ? t('types.pickAttack') : t('types.pickDefense') }}
            </p>
            <div class="d-flex flex-wrap ga-2">
              <TypeToggle
                v-for="type in available"
                :key="type"
                :type="type"
                :selected="selected.includes(type)"
                @toggle="toggle"
              />
            </div>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-text aria-live="polite">
            <p v-if="!entries.length" class="mb-0 opacity-70">{{ t('types.empty') }}</p>
            <MultiplierGroups v-else :entries="entries" :mode="mode" show-neutral />
          </v-card-text>
        </v-card>
      </template>

      <v-card v-else>
        <v-card-text>
          <p class="text-body-small opacity-70">{{ t('types.chartCaption') }}</p>
          <div class="types-chart" tabindex="0" role="region" :aria-label="t('types.chartScroll')">
            <table class="types-chart__table">
              <thead>
                <tr>
                  <td />
                  <th v-for="defender in available" :key="defender" scope="col">
                    <abbr
                      class="types-chart__type"
                      :title="t(`type.${defender}`)"
                      :style="{
                        background: TYPE_COLORS[defender],
                        color: TYPE_TEXT_COLORS[defender],
                      }"
                      >{{ abbreviation(defender) }}</abbr
                    >
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="attacker in available" :key="attacker">
                  <th scope="row">
                    <abbr
                      class="types-chart__type"
                      :title="t(`type.${attacker}`)"
                      :style="{
                        background: TYPE_COLORS[attacker],
                        color: TYPE_TEXT_COLORS[attacker],
                      }"
                      >{{ abbreviation(attacker) }}</abbr
                    >
                  </th>
                  <td v-for="defender in available" :key="defender">
                    <MultiplierBadge
                      :multiplier="attackMultiplier(attacker, [defender], generation)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </DetailLayout>
</template>

<style scoped>
.types-chart {
  overflow-x: auto;
}

.types-chart:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
}

.types-chart__table {
  border-collapse: collapse;
}

.types-chart__table th,
.types-chart__table td {
  padding: 2px;
  text-align: center;
}

.types-chart__type {
  display: inline-block;
  min-width: 34px;
  padding: 2px 4px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
}
</style>
