<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  mdiArrowDownBold,
  mdiArrowUpBold,
  mdiCheckBold,
  mdiCloseThick,
  mdiSwapHorizontalBold,
  mdiVolumeHigh,
} from '@mdi/js'
import { usePokedexStore } from '@/stores/pokedex'
import { useDailyStore } from '@/stores/daily'
import { usePokemonData } from '@/composables/usePokemonData'
import { useCry } from '@/composables/useCry'
import { shareText } from '@/composables/useShare'
import { announce } from '@/composables/useAnnouncer'
import { formatHeight, formatPercent, formatPokemonName, formatWeight } from '@/utils/pokemon'
import {
  DAILY_MAX_GUESSES,
  DAILY_SPECIES,
  compareFacts,
  dailyAnswer,
  dayKey,
  dayNumber,
  emojiGrid,
  type DailyClues,
  type DailyFacts,
  type Direction,
  type TypeClue,
} from '@/utils/daily'
import DetailLayout from '@/components/templates/DetailLayout.vue'
import PokemonArtwork from '@/components/atoms/PokemonArtwork.vue'
import PokemonAvatar from '@/components/atoms/PokemonAvatar.vue'
import TypeChip from '@/components/atoms/TypeChip.vue'
import AppNotice from '@/components/molecules/AppNotice.vue'
import type { PokemonType } from '@/types/pokemon'

type Mode = 'daily' | 'practice'

const router = useRouter()
const { t, locale } = useI18n()
const pokedex = usePokedexStore()
const daily = useDailyStore()
const pokemonData = usePokemonData()
const cry = useCry()

/** Erros até liberar o grito como dica, e até mostrar a silhueta. */
const CRY_HINT_AFTER = 4
const SILHOUETTE_AFTER = 6

const mode = ref<Mode>('daily')
const today = ref(dayKey())
const notice = ref<string | null>(null)

// O dia vira à meia-noite do aparelho, mesmo com a tela aberta.
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  pokemonData.load().catch(() => {})
  timer = setInterval(() => {
    now.value = Date.now()
    today.value = dayKey()
  }, 30_000)
})
onBeforeUnmount(() => clearInterval(timer))

// ---- Partida --------------------------------------------------------------------------------

const practiceAnswer = ref(randomSpecies())
const practiceGuesses = ref<number[]>([])

function randomSpecies(): number {
  return 1 + Math.floor(Math.random() * DAILY_SPECIES)
}

const answer = computed(() =>
  mode.value === 'daily' ? dailyAnswer(today.value) : practiceAnswer.value,
)
// Abre (ou retoma) a partida do dia; na virada da meia-noite começa outra.
watch(today, (day) => daily.gameFor(day), { immediate: true })
const guesses = computed(() =>
  mode.value === 'daily'
    ? daily.game?.day === today.value
      ? daily.game.guesses
      : []
    : practiceGuesses.value,
)
const won = computed(() => guesses.value.includes(answer.value))
const done = computed(() => won.value || guesses.value.length >= DAILY_MAX_GUESSES)

function factsOf(id: number): DailyFacts | null {
  const row = pokemonData.table.value?.rows[id]
  const types = pokedex.typesOf(id)
  if (!row || !types) return null
  return {
    id,
    generation: row[8] as number,
    types: [types[0] ?? 'unknown', types[1] ?? null],
    height: row[6] as number,
    weight: row[7] as number,
    total: (row.slice(0, 6) as number[]).reduce((sum, value) => sum + value, 0),
  }
}

const ready = computed(
  () => !!pokemonData.table.value && pokedex.index.length > 0 && !!pokedex.typesOf(1),
)

interface GuessRow {
  facts: DailyFacts
  clues: DailyClues
}

const rows = computed<GuessRow[]>(() => {
  const target = factsOf(answer.value)
  if (!target) return []
  return guesses.value.flatMap((id) => {
    const facts = factsOf(id)
    return facts ? [{ facts, clues: compareFacts(facts, target) }] : []
  })
})

const options = computed(() =>
  pokedex.index
    .filter((entry) => entry.id <= DAILY_SPECIES && !guesses.value.includes(entry.id))
    .map((entry) => ({ value: entry.id, title: formatPokemonName(entry.name) })),
)
const selection = ref<number | null>(null)
/** Texto digitado no autocomplete: limpo a cada palpite, senão o próximo é digitado em cima. */
const searchText = ref('')

function submit(id: number | null): void {
  if (!id || done.value) return
  if (mode.value === 'daily') daily.guess(today.value, id, answer.value)
  else practiceGuesses.value = [...practiceGuesses.value, id]
  selection.value = null
  // O Vuetify devolve o nome escolhido ao campo logo depois deste evento: limpa em seguida.
  nextTick(() => (searchText.value = ''))
  const name = formatPokemonName(pokedex.entryOf(id)?.name ?? '')
  if (id === answer.value) announce(t('daily.correct', { name }))
  else if (guesses.value.length >= DAILY_MAX_GUESSES)
    announce(t('daily.lost', { name: answerName.value }))
  else announce(t('daily.wrong', { name, left: DAILY_MAX_GUESSES - guesses.value.length }))
}

function newPractice(): void {
  practiceAnswer.value = randomSpecies()
  practiceGuesses.value = []
}

watch(mode, () => (selection.value = null))

const wrongCount = computed(() => guesses.value.filter((id) => id !== answer.value).length)
const answerName = computed(() => formatPokemonName(pokedex.entryOf(answer.value)?.name ?? ''))

// ---- Pistas na tela -------------------------------------------------------------------------

const DIRECTION_ICON: Record<Direction, string> = {
  equal: mdiCheckBold,
  higher: mdiArrowUpBold,
  lower: mdiArrowDownBold,
}
const TYPE_ICON: Record<TypeClue, string> = {
  correct: mdiCheckBold,
  swapped: mdiSwapHorizontalBold,
  wrong: mdiCloseThick,
}

function clueClass(clue: Direction | TypeClue): string {
  if (clue === 'equal' || clue === 'correct') return 'daily-clue--right'
  if (clue === 'swapped') return 'daily-clue--close'
  return 'daily-clue--off'
}

// ---- Resultado ------------------------------------------------------------------------------

const stats = computed(() => daily.stats)
const winRate = computed(() =>
  stats.value.played
    ? formatPercent((stats.value.won / stats.value.played) * 100, locale.value)
    : '—',
)
const maxBar = computed(() => Math.max(1, ...stats.value.distribution))

const countdown = computed(() => {
  const midnight = new Date(now.value)
  midnight.setHours(24, 0, 0, 0)
  const minutes = Math.max(0, Math.round((midnight.getTime() - now.value) / 60000))
  return t('daily.next', { h: Math.floor(minutes / 60), m: minutes % 60 })
})

async function share(): Promise<void> {
  const score = won.value ? guesses.value.length : 'X'
  const text = `${t('daily.shareTitle', { n: dayNumber(today.value), score, max: DAILY_MAX_GUESSES })}\n${emojiGrid(rows.value.map((r) => r.clues))}\n${window.location.origin}/daily`
  const result = await shareText(text)
  if (result === 'copied') notice.value = t('daily.copied')
  else if (result === 'failed') notice.value = t('common.shareFailed')
}

function goBack(): void {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'home' })
}
</script>

<template>
  <DetailLayout :title="t('daily.title')" @back="goBack">
    <div class="daily d-flex flex-column ga-4">
      <v-btn-toggle
        v-model="mode"
        mandatory
        divided
        variant="outlined"
        density="comfortable"
        class="align-self-start"
        :aria-label="t('daily.title')"
      >
        <v-btn value="daily" :aria-pressed="mode === 'daily'">
          {{ t('daily.modeDaily', { n: dayNumber(today) }) }}
        </v-btn>
        <v-btn value="practice" :aria-pressed="mode === 'practice'">{{
          t('daily.modePractice')
        }}</v-btn>
      </v-btn-toggle>

      <p class="text-body-medium mb-0">{{ t('daily.intro', { n: DAILY_MAX_GUESSES }) }}</p>

      <v-card v-if="!ready">
        <v-skeleton-loader aria-hidden="true" type="list-item-two-line@2" />
      </v-card>

      <template v-else>
        <v-card v-if="done || wrongCount >= SILHOUETTE_AFTER" class="daily__reveal">
          <v-card-text class="d-flex flex-column align-center ga-2">
            <div :class="{ 'daily__art--hidden': !done }">
              <PokemonArtwork
                :id="answer"
                :alt="done ? answerName : t('quiz.silhouette')"
                :size="160"
              />
            </div>
            <template v-if="done">
              <p class="text-title-medium mb-0" role="status">
                {{ won ? t('daily.wonTitle', guesses.length) : t('daily.lostTitle') }}
              </p>
              <RouterLink :to="{ name: 'pokemon', params: { id: answer } }" class="text-body-large">
                {{ answerName }}
              </RouterLink>
              <div class="d-flex flex-wrap justify-center ga-2 mt-2">
                <v-btn v-if="mode === 'daily'" color="primary" @click="share">{{
                  t('daily.share')
                }}</v-btn>
                <v-btn v-else color="primary" @click="newPractice">{{ t('daily.again') }}</v-btn>
              </div>
              <p v-if="mode === 'daily'" class="text-body-small opacity-70 mb-0">{{ countdown }}</p>
            </template>
            <p v-else class="text-body-small opacity-70 mb-0">{{ t('daily.silhouetteHint') }}</p>
          </v-card-text>
        </v-card>

        <div v-if="!done" class="d-flex flex-column ga-2">
          <v-autocomplete
            v-model="selection"
            v-model:search="searchText"
            :items="options"
            :label="t('daily.guessLabel', { n: guesses.length + 1, max: DAILY_MAX_GUESSES })"
            density="comfortable"
            variant="outlined"
            hide-details
            auto-select-first
            @update:model-value="submit"
          />
          <v-btn
            v-if="cry.supported && wrongCount >= CRY_HINT_AFTER"
            variant="tonal"
            :prepend-icon="mdiVolumeHigh"
            class="align-self-start"
            @click="cry.listen(answer)"
          >
            {{ t('daily.cryHint') }}
          </v-btn>
        </div>

        <ol v-if="rows.length" class="daily__guesses" :aria-label="t('daily.guesses')">
          <li v-for="row in [...rows].reverse()" :key="row.facts.id" class="daily-row">
            <div class="d-flex align-center ga-2 mb-2">
              <PokemonAvatar
                :id="row.facts.id"
                :name="pokedex.entryOf(row.facts.id)?.name ?? ''"
                :size="36"
                decorative
              />
              <span class="text-body-large font-weight-medium">
                {{ formatPokemonName(pokedex.entryOf(row.facts.id)?.name ?? '') }}
              </span>
            </div>
            <div class="daily-row__clues">
              <div class="daily-clue" :class="clueClass(row.clues.generation)">
                <span class="text-label-small">{{ t('daily.clue.generation') }}</span>
                <span class="daily-clue__value">
                  {{ row.facts.generation }}
                  <v-icon
                    :icon="DIRECTION_ICON[row.clues.generation]"
                    size="14"
                    aria-hidden="true"
                  />
                </span>
                <span class="d-sr-only">{{ t(`daily.direction.${row.clues.generation}`) }}</span>
              </div>
              <div
                v-for="slot in [0, 1] as const"
                :key="slot"
                class="daily-clue"
                :class="clueClass(slot === 0 ? row.clues.type1 : row.clues.type2)"
              >
                <span class="text-label-small">{{
                  t(slot === 0 ? 'daily.clue.type1' : 'daily.clue.type2')
                }}</span>
                <span class="daily-clue__value">
                  <TypeChip
                    v-if="row.facts.types[slot]"
                    :type="row.facts.types[slot] as PokemonType"
                    size="x-small"
                  />
                  <template v-else>—</template>
                  <v-icon
                    :icon="TYPE_ICON[slot === 0 ? row.clues.type1 : row.clues.type2]"
                    size="14"
                    aria-hidden="true"
                  />
                </span>
                <span class="d-sr-only">{{
                  t(`daily.type.${slot === 0 ? row.clues.type1 : row.clues.type2}`)
                }}</span>
              </div>
              <div class="daily-clue" :class="clueClass(row.clues.height)">
                <span class="text-label-small">{{ t('daily.clue.height') }}</span>
                <span class="daily-clue__value">
                  {{ formatHeight(row.facts.height / 10, locale) }}
                  <v-icon :icon="DIRECTION_ICON[row.clues.height]" size="14" aria-hidden="true" />
                </span>
                <span class="d-sr-only">{{ t(`daily.direction.${row.clues.height}`) }}</span>
              </div>
              <div class="daily-clue" :class="clueClass(row.clues.weight)">
                <span class="text-label-small">{{ t('daily.clue.weight') }}</span>
                <span class="daily-clue__value">
                  {{ formatWeight(row.facts.weight / 10, locale) }}
                  <v-icon :icon="DIRECTION_ICON[row.clues.weight]" size="14" aria-hidden="true" />
                </span>
                <span class="d-sr-only">{{ t(`daily.direction.${row.clues.weight}`) }}</span>
              </div>
              <div class="daily-clue" :class="clueClass(row.clues.total)">
                <span class="text-label-small">{{ t('daily.clue.total') }}</span>
                <span class="daily-clue__value">
                  {{ row.facts.total }}
                  <v-icon :icon="DIRECTION_ICON[row.clues.total]" size="14" aria-hidden="true" />
                </span>
                <span class="d-sr-only">{{ t(`daily.direction.${row.clues.total}`) }}</span>
              </div>
            </div>
          </li>
        </ol>

        <v-card v-if="mode === 'daily' && stats.played">
          <v-card-title tag="h2" class="text-title-medium">{{ t('daily.stats') }}</v-card-title>
          <v-card-text>
            <div class="daily__stats">
              <div>
                <div class="text-headline-small">{{ stats.played }}</div>
                <div class="text-label-small">{{ t('daily.played') }}</div>
              </div>
              <div>
                <div class="text-headline-small">{{ winRate }}</div>
                <div class="text-label-small">{{ t('daily.winRate') }}</div>
              </div>
              <div>
                <div class="text-headline-small">{{ stats.streak }}</div>
                <div class="text-label-small">{{ t('daily.streak') }}</div>
              </div>
              <div>
                <div class="text-headline-small">{{ stats.best }}</div>
                <div class="text-label-small">{{ t('daily.best') }}</div>
              </div>
            </div>
            <h3 class="text-title-small mt-4 mb-2">{{ t('daily.distribution') }}</h3>
            <ol class="daily__bars">
              <li
                v-for="(count, index) in stats.distribution"
                :key="index"
                class="d-flex align-center ga-2"
              >
                <span class="text-label-medium daily__bar-label" aria-hidden="true">{{
                  index + 1
                }}</span>
                <span
                  class="daily__bar text-label-small"
                  :style="{ width: `${Math.max(8, (count / maxBar) * 100)}%` }"
                  aria-hidden="true"
                >
                  {{ count }}
                </span>
                <span class="d-sr-only">{{
                  t('daily.distributionRow', { n: index + 1, count })
                }}</span>
              </li>
            </ol>
          </v-card-text>
        </v-card>
      </template>
    </div>
    <AppNotice :text="notice" :timeout="2500" @close="notice = null" />
  </DetailLayout>
</template>

<style scoped>
.daily__guesses {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.daily-row {
  padding: 12px;
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
}

.daily-row__clues {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.daily-clue {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  border-radius: 10px;
  border: 1px solid transparent;
}

.daily-clue__value {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

.daily-clue--right {
  background: rgba(34, 197, 94, 0.18);
  border-color: rgba(34, 197, 94, 0.6);
}

.daily-clue--close {
  background: rgba(234, 179, 8, 0.18);
  border-color: rgba(234, 179, 8, 0.6);
}

.daily-clue--off {
  background: rgba(var(--v-theme-on-surface), 0.05);
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

.daily__art--hidden :deep(img) {
  filter: brightness(0);
}

:root .v-theme--dark .daily__art--hidden :deep(img) {
  filter: brightness(0) invert(0.85);
}

.daily__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  text-align: center;
}

.daily__bars {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.daily__bar-label {
  width: 12px;
}

.daily__bar {
  padding: 2px 6px;
  border-radius: 4px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  text-align: end;
}
</style>
