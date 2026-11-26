<script setup lang="ts">
import { computed, onActivated, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { GAMES } from '@/data/games'
import { usePokedexStore } from '@/stores/pokedex'
import { usePokemonData } from '@/composables/usePokemonData'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
import { announce } from '@/composables/useAnnouncer'
import { findGame } from '@/utils/games'
import { speciesIdOf } from '@/utils/forms'
import { hasMegaEvolution } from '@/utils/megas'
import { formatPokemonName } from '@/utils/pokemon'
import { speedValues, type SpeedModifiers, type SpeedValues } from '@/utils/speed'
import { nameMatches, normalizeSearch } from '@/utils/search'
import DetailLayout from '@/components/templates/DetailLayout.vue'
import SearchField from '@/components/molecules/SearchField.vue'
import PokemonAvatar from '@/components/atoms/PokemonAvatar.vue'
import EmptyState from '@/components/molecules/EmptyState.vue'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const pokedex = usePokedexStore()
const pokemonData = usePokemonData()

onMounted(() => {
  pokemonData.load().catch(() => {})
})

/** Linhas por vez (são ~1.300 com as formas): "Mostrar mais" adiciona outro lote. */
const PAGE = 100
const COLUMNS = ['min', 'neutral', 'max', 'maxPlus'] as const
/** No celular ficam só Máx e Máx+ (as que importam para quem age primeiro). */
const WIDE_ONLY = new Set(['min', 'neutral'])
/** Megas e formas Primal: só existem nos jogos com Mega Evolução. */
const MEGA_FORM = /-(mega|primal)(-|$)/

const level = ref<50 | 100>(50)
const game = ref<string | null>(null)
const modifiers = reactive<SpeedModifiers>({
  scarf: false,
  tailwind: false,
  stage: 0,
  paralysis: false,
})
/** Trick Room: por 5 turnos, o mais lento age primeiro (a lista vira de cabeça para baixo). */
const trickRoom = ref(false)

/**
 * Estado vindo da URL (`?level=100&game=…&scarf=1&tw=1&par=1&stage=2&tr=1`): dá para compartilhar
 * o cenário. Relido ao reativar (a tela fica em KeepAlive, como a Home).
 */
function readFromRoute(): void {
  level.value = route.query.level === '100' ? 100 : 50
  game.value = findGame(String(route.query.game ?? ''))?.slug ?? null
  modifiers.scarf = route.query.scarf === '1'
  modifiers.tailwind = route.query.tw === '1'
  modifiers.paralysis = route.query.par === '1'
  const stage = Number(route.query.stage)
  modifiers.stage = Number.isInteger(stage) ? Math.max(-6, Math.min(6, stage)) : 0
  trickRoom.value = route.query.tr === '1'
}
readFromRoute()
onActivated(() => {
  if (route.name === 'speed') readFromRoute()
})
const team = computed(() =>
  String(route.query.team ?? '')
    .split(',')
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0),
)
/** A paralisia tira um quarto até a 6ª geração: a conta segue o jogo escolhido. */
watch(game, (slug) => (modifiers.generation = findGame(slug)?.generation), { immediate: true })
const search = ref('')
const debouncedSearch = useDebouncedRef(search, 250)
const shown = ref(PAGE)

watch([level, game, modifiers, trickRoom], () => {
  if (route.name !== 'speed') return
  const query: LocationQueryRaw = { ...route.query }
  const flags: [string, boolean][] = [
    ['level', level.value === 100],
    ['scarf', modifiers.scarf],
    ['tw', modifiers.tailwind],
    ['par', modifiers.paralysis === true],
    ['tr', trickRoom.value],
  ]
  for (const [key, on] of flags) {
    if (on) query[key] = key === 'level' ? '100' : '1'
    else delete query[key]
  }
  if (modifiers.stage) query.stage = String(modifiers.stage)
  else delete query.stage
  if (game.value) query.game = game.value
  else delete query.game
  router.replace({ query })
})

// Com jogo: só as espécies das Pokédex dele (todas as do jogo, ex.: Paldea + Kitakami + Blueberry).
const dexSpecies = shallowRef<Set<number> | null>(null)
const dexStatus = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
/** Espécies das Pokédex do jogo (a tabela mostra só elas); "tentar de novo" chama outra vez. */
async function loadDex(slug = game.value): Promise<void> {
  dexSpecies.value = null
  const g = findGame(slug)
  if (!g) {
    dexStatus.value = 'idle'
    return
  }
  dexStatus.value = 'loading'
  try {
    const lists = await Promise.all(g.dexes.map((dex) => pokedex.ensureDexEntries(dex.slug)))
    if (slug !== game.value) return
    dexSpecies.value = new Set(lists.flat().map((entry) => entry.speciesId))
    dexStatus.value = 'ready'
  } catch {
    dexStatus.value = 'error'
  }
}

watch(game, (slug) => loadDex(slug), { immediate: true })

interface SpeedRow extends SpeedValues {
  id: number
  name: string
  base: number
  /** Posição pela velocidade máxima (empates dividem a posição). */
  rank: number
}

/**
 * Todos com a base de Velocidade da tabela gerada. Formas que não mudam a Velocidade da espécie
 * (cosméticas, Gigantamax) ficam de fora para a lista não repetir linhas iguais.
 */
const rows = computed<SpeedRow[]>(() => {
  const table = pokemonData.table.value
  if (!table) return []
  const list: Omit<SpeedRow, 'rank'>[] = []
  for (const entry of pokedex.index) {
    const row = table.rows[entry.id]
    if (!row) continue
    const species = speciesIdOf(entry.id)
    if (dexSpecies.value && !dexSpecies.value.has(species)) continue
    if (game.value && !hasMegaEvolution(game.value) && MEGA_FORM.test(entry.name)) continue
    const base = row[5] as number
    if (species !== entry.id && table.rows[species]?.[5] === base && !team.value.includes(entry.id))
      continue
    list.push({
      id: entry.id,
      name: entry.name,
      base,
      ...speedValues(base, level.value, modifiers),
    })
  }
  // Trick Room inverte: o mais lento vem primeiro (e é o 1º da fila).
  const first = trickRoom.value ? -1 : 1
  list.sort((a, b) => first * (b.maxPlus - a.maxPlus || b.base - a.base) || a.id - b.id)
  let rank = 0
  return list.map((row, index) => {
    if (index === 0 || row.maxPlus !== list[index - 1]!.maxPlus) rank = index + 1
    return { ...row, rank }
  })
})

const teamRows = computed(() => rows.value.filter((row) => team.value.includes(row.id)))

const filtered = computed(() => {
  const term = normalizeSearch(debouncedSearch.value ?? '')
  return term ? rows.value.filter((row) => nameMatches(row.name, term)) : rows.value
})
watch([debouncedSearch, level, game], () => (shown.value = PAGE))
watch(
  () => filtered.value.length,
  (count) => {
    if (pokemonData.table.value && dexStatus.value !== 'loading')
      announce(t('speed.results', count))
  },
)

const gameItems = computed(() => [
  { value: null, title: t('speed.national') },
  ...[...GAMES].reverse().map((g) => ({ value: g.slug, title: g.title })),
])

function openPokemon(id: number): void {
  router.push({ name: 'pokemon', params: { id }, query: game.value ? { game: game.value } : {} })
}

function goBack(): void {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'home' })
}
</script>

<template>
  <DetailLayout :title="t('speed.title')" @back="goBack">
    <div class="d-flex flex-column ga-3">
      <p class="text-body-medium mb-0">{{ t('speed.intro') }}</p>
      <div class="speed-controls">
        <v-btn-toggle
          v-model="level"
          mandatory
          divided
          variant="outlined"
          density="compact"
          :aria-label="t('speed.level')"
        >
          <v-btn :value="50" size="small" :aria-pressed="level === 50">{{
            t('detail.statsAtLevel', { n: 50 })
          }}</v-btn>
          <v-btn :value="100" size="small" :aria-pressed="level === 100">{{
            t('detail.statsAtLevel', { n: 100 })
          }}</v-btn>
        </v-btn-toggle>
        <v-select
          v-model="game"
          :items="gameItems"
          :label="t('moves.game')"
          density="compact"
          variant="outlined"
          hide-details
        />
      </div>
      <div class="d-flex flex-wrap align-center gc-4">
        <v-switch
          v-model="modifiers.scarf"
          :label="t('speed.scarf')"
          color="primary"
          density="compact"
          hide-details
        />
        <v-switch
          v-model="modifiers.tailwind"
          :label="t('speed.tailwind')"
          color="primary"
          density="compact"
          hide-details
        />
        <v-switch
          v-model="modifiers.paralysis"
          :label="
            t('speed.paralysis', {
              n: modifiers.generation && modifiers.generation < 7 ? '¼' : '½',
            })
          "
          color="primary"
          density="compact"
          hide-details
        />
        <v-switch
          v-model="trickRoom"
          :label="t('speed.trickRoom')"
          color="primary"
          density="compact"
          hide-details
        />
        <div class="d-flex align-center ga-1">
          <v-btn
            icon="$minus"
            size="small"
            variant="tonal"
            :disabled="modifiers.stage <= -6"
            :aria-label="t('speed.stageDown')"
            @click="modifiers.stage--"
          />
          <span class="text-body-medium speed-stage" aria-live="polite">
            {{
              t('speed.stage', { n: modifiers.stage > 0 ? `+${modifiers.stage}` : modifiers.stage })
            }}
          </span>
          <v-btn
            icon="$plus"
            size="small"
            variant="tonal"
            :disabled="modifiers.stage >= 6"
            :aria-label="t('speed.stageUp')"
            @click="modifiers.stage++"
          />
        </div>
      </div>

      <v-card v-if="teamRows.length">
        <v-card-title tag="h2" class="text-title-medium">{{ t('speed.team') }}</v-card-title>
        <v-card-text>
          <ul class="speed-team">
            <li v-for="row in teamRows" :key="row.id" class="d-flex align-center ga-2">
              <PokemonAvatar :id="row.id" :name="row.name" :size="32" decorative />
              <span class="flex-grow-1">{{ formatPokemonName(row.name) }}</span>
              <span class="text-label-medium opacity-70">{{
                t('speed.rank', { n: row.rank, total: rows.length })
              }}</span>
              <span class="speed-num font-weight-medium">{{ row.maxPlus }}</span>
            </li>
          </ul>
        </v-card-text>
      </v-card>

      <SearchField
        v-model="search"
        :placeholder="t('speed.searchPlaceholder')"
        :label="t('speed.searchLabel')"
        density="compact"
      />

      <EmptyState
        v-if="!pokemonData.table.value && pokemonData.error.value"
        variant="error"
        :title="t('error.loadTable')"
        :action-label="t('common.retry')"
        @action="pokemonData.load().catch(() => {})"
      />
      <EmptyState
        v-else-if="dexStatus === 'error'"
        variant="error"
        :title="t('speed.loadError')"
        :action-label="t('common.retry')"
        @action="loadDex"
      />
      <v-card v-else>
        <v-skeleton-loader
          v-if="!pokemonData.table.value || dexStatus === 'loading' || !pokedex.index.length"
          aria-hidden="true"
          type="table-tbody"
        />
        <v-card-text v-else-if="!filtered.length" class="opacity-70">
          {{ t('speed.empty') }}
        </v-card-text>
        <template v-else>
          <v-table density="compact" class="speed-table">
            <caption class="d-sr-only">
              {{
                t(trickRoom ? 'speed.captionTrickRoom' : 'speed.caption', { level })
              }}
            </caption>
            <thead>
              <tr>
                <th scope="col">{{ t('speed.pokemon') }}</th>
                <th
                  v-for="column in COLUMNS"
                  :key="column"
                  scope="col"
                  class="text-end"
                  :class="{ 'd-none d-sm-table-cell': WIDE_ONLY.has(column) }"
                >
                  {{ t(`speed.column.${column}`) }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in filtered.slice(0, shown)"
                :key="row.id"
                :class="{ 'speed-table__team': team.includes(row.id) }"
              >
                <th scope="row" class="font-weight-regular">
                  <button type="button" class="speed-table__name" @click="openPokemon(row.id)">
                    <span class="speed-table__rank text-label-small opacity-70">{{
                      row.rank
                    }}</span>
                    <PokemonAvatar :id="row.id" :name="row.name" :size="28" decorative />
                    <span class="text-truncate">{{ formatPokemonName(row.name) }}</span>
                    <span class="text-label-small opacity-70">{{ row.base }}</span>
                    <span v-if="team.includes(row.id)" class="d-sr-only">{{
                      t('speed.inTeam')
                    }}</span>
                  </button>
                </th>
                <td
                  v-for="column in COLUMNS"
                  :key="column"
                  class="text-end speed-num"
                  :class="{ 'd-none d-sm-table-cell': WIDE_ONLY.has(column) }"
                >
                  {{ row[column] }}
                </td>
              </tr>
            </tbody>
          </v-table>
          <v-card-actions v-if="filtered.length > shown">
            <v-btn variant="text" @click="shown += PAGE">
              {{ t('movesPage.showMore', { n: filtered.length - shown }) }}
            </v-btn>
          </v-card-actions>
        </template>
      </v-card>
      <p class="text-body-small opacity-70 mb-0">{{ t('speed.legend') }}</p>
    </div>
  </DetailLayout>
</template>

<style scoped>
/* No celular o jogo desce para a linha de baixo, em vez de espremer o "Nível 100". */
.speed-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.speed-controls > .v-input {
  flex: 1 1 220px;
}

.speed-stage {
  min-width: 88px;
  text-align: center;
}

.speed-team {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.speed-num {
  font-variant-numeric: tabular-nums;
}

.speed-table :deep(th),
.speed-table :deep(td) {
  padding-inline: 6px !important;
}

.speed-table__name {
  display: flex;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  text-align: start;
}

.speed-table__rank {
  min-width: 28px;
  font-variant-numeric: tabular-nums;
}

.speed-table__team {
  background: rgba(var(--v-theme-primary), 0.12);
}
</style>
