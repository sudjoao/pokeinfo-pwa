<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { GAMES } from '@/data/games'
import { POKEMON_TYPES, type PokemonType } from '@/types/pokemon'
import { usePokedexStore } from '@/stores/pokedex'
import { useDebouncedRef } from '@/composables/useDebouncedRef'
import { announce } from '@/composables/useAnnouncer'
import { findGame } from '@/utils/games'
import { isPokemonType } from '@/utils/pokemon'
import { hasLearnset, loadLearnset, pokemonLearningAll } from '@/utils/learnsets'
import {
  filterMoves,
  moveInfo,
  moveList,
  moveName,
  type MoveCategory,
  type MoveInfo,
  type MoveSort,
} from '@/utils/moves'
import DetailLayout from '@/components/templates/DetailLayout.vue'
import SearchField from '@/components/molecules/SearchField.vue'
import PokemonButtonGrid from '@/components/molecules/PokemonButtonGrid.vue'
import TypeChip from '@/components/atoms/TypeChip.vue'

type Mode = 'list' | 'learn'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const pokedex = usePokedexStore()
/** Quantos golpes aparecem por vez (são ~900): "Mostrar mais" adiciona outro lote. */
const PAGE = 60
/** Golpes na busca "quem aprende" (como num moveset). */
const MAX_LEARN = 4
/** Jogo padrão do "quem aprende" quando nenhum vem da URL: o mais recente com golpes. */
const LEARN_GAMES = GAMES.filter((game) => hasLearnset(game.slug)).reverse()

const CATEGORIES: readonly MoveCategory[] = ['physical', 'special', 'status']
const SORTS: readonly MoveSort[] = ['name', 'power', 'accuracy', 'pp']
const BATTLE_TYPES = POKEMON_TYPES.filter((type) => type !== 'unknown' && type !== 'stellar')

const queryString = (key: string) =>
  typeof route.query[key] === 'string' ? (route.query[key] as string) : ''

// Estado inicial vindo da URL (`/moves?game=scarlet-violet&type=fire&sort=power`).
const mode = ref<Mode>(route.query.mode === 'learn' ? 'learn' : 'list')
const game = ref<string | null>(findGame(queryString('game'))?.slug ?? null)
const search = ref(queryString('q'))
const debouncedSearch = useDebouncedRef(search, 250)
const type = ref<PokemonType | null>(
  isPokemonType(queryString('type')) ? (queryString('type') as PokemonType) : null,
)
const category = ref<MoveCategory | null>(
  (CATEGORIES as readonly string[]).includes(queryString('cat'))
    ? (queryString('cat') as MoveCategory)
    : null,
)
const sort = ref<MoveSort>(
  (SORTS as readonly string[]).includes(queryString('sort'))
    ? (queryString('sort') as MoveSort)
    : 'name',
)
const learn = ref<string[]>(queryString('learn').split(',').filter(Boolean).slice(0, MAX_LEARN))
const shown = ref(PAGE)

/** No "quem aprende" o jogo é obrigatório (os learnsets são por jogo). */
const learnGame = computed(
  () => (game.value && hasLearnset(game.value) ? game.value : LEARN_GAMES[0]?.slug) ?? null,
)

watch(
  [mode, game, debouncedSearch, type, category, sort, learn],
  () => {
    const query: LocationQueryRaw = {}
    if (mode.value === 'learn') query.mode = 'learn'
    if (game.value) query.game = game.value
    const term = (debouncedSearch.value ?? '').trim()
    if (term) query.q = term
    if (type.value) query.type = type.value
    if (category.value) query.cat = category.value
    if (sort.value !== 'name') query.sort = sort.value
    if (learn.value.length) query.learn = learn.value.join(',')
    router.replace({ query })
  },
  { deep: true },
)

// Golpes do jogo selecionado (os do learnset), baixados sob demanda; sem jogo, todos.
const learnset = shallowRef<Readonly<Record<string, string>> | null>(null)
const learnsetStatus = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')

async function fetchLearnset(slug: string | null): Promise<void> {
  learnset.value = null
  const promise = slug ? loadLearnset(slug) : null
  if (!promise) {
    learnsetStatus.value = 'idle'
    return
  }
  learnsetStatus.value = 'loading'
  try {
    const data = await promise
    if (slug !== (mode.value === 'learn' ? learnGame.value : game.value)) return
    learnset.value = data
    learnsetStatus.value = 'ready'
  } catch {
    learnsetStatus.value = 'error'
  }
}

watch(
  () => (mode.value === 'learn' ? learnGame.value : game.value),
  (slug) => fetchLearnset(slug),
  { immediate: true },
)

const available = computed(() => (learnset.value ? new Set(Object.keys(learnset.value)) : null))

/** Com jogo e learnset: só os golpes dele, com os valores dele. Jogo sem learnset (Z-A): valores do jogo. */
const allMoves = computed<MoveInfo[]>(() =>
  game.value && hasLearnset(game.value) && !available.value
    ? []
    : moveList(game.value, available.value),
)

const filtered = computed(() =>
  filterMoves(
    allMoves.value,
    {
      query: debouncedSearch.value ?? '',
      type: type.value,
      category: category.value,
      sort: sort.value,
      desc: sort.value !== 'name',
    },
    locale.value,
  ),
)
watch([debouncedSearch, type, category, sort, game], () => (shown.value = PAGE))
watch(
  () => filtered.value.length,
  (count) => {
    if (mode.value === 'list' && learnsetStatus.value !== 'loading')
      announce(t('movesPage.results', count))
  },
)

const gameItems = computed(() => [
  { value: null, title: t('movesPage.allGames') },
  ...[...GAMES].reverse().map((g) => ({ value: g.slug, title: g.title })),
])
const learnGameItems = LEARN_GAMES.map((g) => ({ value: g.slug, title: g.title }))
const typeItems = computed(() => [
  { value: null, title: t('movesPage.anyType') },
  ...BATTLE_TYPES.map((value) => ({ value, title: t(`type.${value}`) })),
])
const sortItems = computed(() =>
  SORTS.map((value) => ({ value, title: t(`movesPage.sort.${value}`) })),
)

function nameOf(slug: string): string {
  return moveName(moveInfo(slug) ?? { slug, nameEs: null }, locale.value)
}

// "Quem aprende": opções do autocomplete = golpes do jogo; resultado = interseção.
const learnOptions = computed(() =>
  available.value
    ? [...available.value]
        .map((slug) => ({ value: slug, title: nameOf(slug) }))
        .sort((a, b) => a.title.localeCompare(b.title, locale.value))
    : [],
)
const learners = computed(() => {
  if (!learnset.value || !learn.value.length) return []
  return [...pokemonLearningAll(learnset.value, learn.value)]
    .sort((a, b) => a - b)
    .map((id) => ({ id, name: pokedex.entryOf(id)?.name ?? String(id) }))
})
watch(
  () => learners.value.length,
  (count) => {
    if (mode.value === 'learn' && learn.value.length) announce(t('movesPage.learnResults', count))
  },
)

function setLearnGame(slug: string): void {
  game.value = slug
}
// Golpe que não existe no jogo novo sai da busca.
watch(available, (set) => {
  if (set && mode.value === 'learn') learn.value = learn.value.filter((slug) => set.has(slug))
})

function moveRoute(slug: string) {
  const g = mode.value === 'learn' ? learnGame.value : game.value
  return { name: 'move', params: { slug }, query: g ? { game: g } : {} }
}

function openPokemon(id: number): void {
  router.push({
    name: 'pokemon',
    params: { id },
    query: learnGame.value ? { game: learnGame.value } : {},
  })
}

function goBack(): void {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'home' })
}

const dash = '—'
</script>

<template>
  <DetailLayout :title="t('movesPage.title')" @back="goBack">
    <div class="d-flex flex-column ga-4">
      <v-btn-toggle
        v-model="mode"
        mandatory
        divided
        variant="outlined"
        density="comfortable"
        class="align-self-start"
        :aria-label="t('movesPage.title')"
      >
        <v-btn value="list" :aria-pressed="mode === 'list'">{{ t('movesPage.modeList') }}</v-btn>
        <v-btn value="learn" :aria-pressed="mode === 'learn'">{{ t('movesPage.modeLearn') }}</v-btn>
      </v-btn-toggle>

      <template v-if="mode === 'list'">
        <div class="moves-filters">
          <SearchField
            v-model="search"
            :placeholder="t('movesPage.searchPlaceholder')"
            :label="t('movesPage.searchLabel')"
            density="compact"
            class="moves-filters__search"
          />
          <v-select
            v-model="game"
            :items="gameItems"
            :label="t('moves.game')"
            density="compact"
            variant="outlined"
            hide-details
          />
          <v-select
            v-model="type"
            :items="typeItems"
            :label="t('movesPage.type')"
            density="compact"
            variant="outlined"
            hide-details
          />
          <v-select
            v-model="sort"
            :items="sortItems"
            :label="t('movesPage.sortLabel')"
            density="compact"
            variant="outlined"
            hide-details
          />
        </div>
        <v-chip-group
          v-model="category"
          :aria-label="t('movesPage.category')"
          selected-class="text-primary-safe"
        >
          <v-chip
            v-for="value in CATEGORIES"
            :key="value"
            :value="value"
            filter
            variant="outlined"
            role="button"
            :aria-pressed="category === value"
          >
            {{ t(`moves.${value}`) }}
          </v-chip>
        </v-chip-group>

        <v-card>
          <v-skeleton-loader
            v-if="learnsetStatus === 'loading'"
            aria-hidden="true"
            type="table-tbody"
          />
          <v-card-text
            v-else-if="learnsetStatus === 'error'"
            class="d-flex flex-column align-start ga-2"
          >
            <span>{{ t('movesPage.loadError') }}</span>
            <v-btn color="primary" variant="tonal" size="small" @click="fetchLearnset(game)">
              {{ t('common.retry') }}
            </v-btn>
          </v-card-text>
          <v-card-text v-else-if="!filtered.length" class="opacity-70">{{
            t('movesPage.empty')
          }}</v-card-text>
          <template v-else>
            <v-table density="compact">
              <caption class="d-sr-only">
                {{
                  t('movesPage.results', filtered.length)
                }}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{{ t('moves.move') }}</th>
                  <th scope="col" class="text-end">{{ t('moves.power') }}</th>
                  <th scope="col" class="text-end">{{ t('moves.accuracy') }}</th>
                  <th scope="col" class="text-end">{{ t('moves.pp') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="move in filtered.slice(0, shown)" :key="move.slug">
                  <td>
                    <RouterLink
                      :to="moveRoute(move.slug)"
                      class="moves-table__link font-weight-medium"
                    >
                      {{ moveName(move, locale) }}
                    </RouterLink>
                    <div class="d-flex align-center ga-1 my-1">
                      <TypeChip :type="move.type" size="x-small" />
                      <span class="text-label-small opacity-70">{{
                        t(`moves.${move.category}`)
                      }}</span>
                    </div>
                  </td>
                  <td class="text-end moves-table__num">{{ move.power ?? dash }}</td>
                  <td class="text-end moves-table__num">
                    {{ move.accuracy ? `${move.accuracy}%` : dash }}
                  </td>
                  <td class="text-end moves-table__num">{{ move.pp ?? dash }}</td>
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
      </template>

      <template v-else>
        <p class="text-body-medium mb-0">{{ t('movesPage.learnIntro', { n: MAX_LEARN }) }}</p>
        <div class="moves-filters">
          <v-select
            :model-value="learnGame"
            :items="learnGameItems"
            :label="t('moves.game')"
            density="compact"
            variant="outlined"
            hide-details
            @update:model-value="setLearnGame"
          />
          <v-autocomplete
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            v-model="learn"
            :items="learnOptions"
            :label="t('movesPage.learnMoves')"
            :disabled="!available"
            multiple
            chips
            closable-chips
            density="compact"
            variant="outlined"
            hide-details
            auto-select-first
            class="moves-filters__search"
            @update:model-value="learn = $event.slice(0, MAX_LEARN)"
          />
        </div>
        <v-card>
          <v-skeleton-loader
            v-if="learnsetStatus === 'loading'"
            aria-hidden="true"
            type="list-item@4"
          />
          <v-card-text
            v-else-if="learnsetStatus === 'error'"
            class="d-flex flex-column align-start ga-2"
          >
            <span>{{ t('movesPage.loadError') }}</span>
            <v-btn color="primary" variant="tonal" size="small" @click="fetchLearnset(learnGame)">
              {{ t('common.retry') }}
            </v-btn>
          </v-card-text>
          <v-card-text v-else-if="!learn.length" class="opacity-70">{{
            t('movesPage.learnEmpty')
          }}</v-card-text>
          <v-card-text v-else>
            <p class="text-label-large mb-2">{{ t('movesPage.learnResults', learners.length) }}</p>
            <div class="d-flex flex-wrap ga-2 mb-3">
              <RouterLink
                v-for="slug in learn"
                :key="slug"
                :to="moveRoute(slug)"
                class="moves-table__link text-body-small"
              >
                {{ nameOf(slug) }}
              </RouterLink>
            </div>
            <PokemonButtonGrid v-if="learners.length" :items="learners" @select="openPokemon" />
          </v-card-text>
        </v-card>
      </template>
    </div>
  </DetailLayout>
</template>

<style scoped>
.moves-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.moves-filters__search {
  grid-column: 1 / -1;
}

.moves-table__num {
  font-variant-numeric: tabular-nums;
}

.moves-table__link {
  color: inherit;
  text-decoration: underline;
  text-decoration-color: rgba(var(--v-theme-on-surface), 0.4);
  text-underline-offset: 3px;
}
</style>
