<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { mdiVolumeHigh } from '@mdi/js'
import { usePokedexStore } from '@/stores/pokedex'
import { useCry } from '@/composables/useCry'
import { usePokemonData } from '@/composables/usePokemonData'
import { GENERATIONS } from '@/utils/advancedFilters'
import { formatPokemonName } from '@/utils/pokemon'
import { readStorage, writeStorage } from '@/utils/storage'
import type { PokemonIndexEntry } from '@/types/pokemon'
import DetailLayout from '@/components/templates/DetailLayout.vue'
import PokemonArtwork from '@/components/atoms/PokemonArtwork.vue'

const BEST_KEY = 'pokeinfo:quiz-best:v1'
/** Só espécies (formas padrão): as formas alternativas confundem o "quem é". */
const LAST_SPECIES = 1025

const router = useRouter()
const { t } = useI18n()
const store = usePokedexStore()
const pokemonData = usePokemonData()
const cry = useCry()

onMounted(() => {
  store.load()
  pokemonData.load().catch(() => {})
})

/** Gerações do sorteio (vazio = todas). */
const generations = ref<number[]>([])

const pool = computed<PokemonIndexEntry[]>(() => {
  const rows = pokemonData.table.value?.rows
  return store.index.filter(
    (entry) =>
      entry.id <= LAST_SPECIES &&
      (!generations.value.length || (rows && generations.value.includes(rows[entry.id]?.[8] ?? 0))),
  )
})

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]!
}

const answer = ref<PokemonIndexEntry | null>(null)
const choices = ref<PokemonIndexEntry[]>([])
const guess = ref<number | null>(null)
const revealed = computed(() => guess.value !== null)
const streak = ref(0)
const best = ref(readStorage<number>(BEST_KEY) ?? 0)

function next(): void {
  const list = pool.value
  if (list.length < 4) return
  const target = pick(list)
  const others = new Set<PokemonIndexEntry>()
  while (others.size < 3) {
    const candidate = pick(list)
    if (candidate.id !== target.id) others.add(candidate)
  }
  answer.value = target
  choices.value = [target, ...others].sort(() => Math.random() - 0.5)
  guess.value = null
}

function choose(entry: PokemonIndexEntry): void {
  if (revealed.value || !answer.value) return
  guess.value = entry.id
  // O grito toca dentro do toque (iOS); revela junto com a imagem.
  cry.play(answer.value.id)
  if (entry.id === answer.value.id) {
    streak.value++
    if (streak.value > best.value) {
      best.value = streak.value
      writeStorage(BEST_KEY, best.value)
    }
  } else {
    streak.value = 0
  }
}

function hint(): void {
  if (answer.value) cry.play(answer.value.id)
}

watch([() => store.index.length, generations, () => pokemonData.table.value], () => {
  if (!answer.value || !pool.value.some((entry) => entry.id === answer.value?.id)) next()
})
onMounted(next)

const correct = computed(() => revealed.value && guess.value === answer.value?.id)

function goBack(): void {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'home' })
}
</script>

<template>
  <DetailLayout :title="t('quiz.title')" @back="goBack">
    <div class="quiz d-flex flex-column ga-4">
      <fieldset class="quiz__generations">
        <legend class="text-label-large mb-1">{{ t('filters.generation') }}</legend>
        <v-chip-group v-model="generations" multiple column selected-class="text-primary">
          <v-chip
            v-for="gen in GENERATIONS"
            :key="gen"
            :value="gen"
            filter
            variant="outlined"
            size="small"
          >
            {{ gen }}
          </v-chip>
        </v-chip-group>
      </fieldset>

      <v-card v-if="answer" class="quiz__card">
        <div class="quiz__art" :class="{ 'quiz__art--hidden': !revealed }">
          <PokemonArtwork
            :id="answer.id"
            :alt="revealed ? formatPokemonName(answer.name) : t('quiz.silhouette')"
            :size="220"
          />
        </div>
        <v-card-text class="d-flex flex-column ga-3">
          <p class="text-title-medium text-center mb-0" aria-live="polite">
            <template v-if="!revealed">{{ t('quiz.question') }}</template>
            <template v-else-if="correct">{{
              t('quiz.correct', { name: formatPokemonName(answer.name) })
            }}</template>
            <template v-else>{{
              t('quiz.wrong', { name: formatPokemonName(answer.name) })
            }}</template>
          </p>
          <div class="quiz__choices">
            <v-btn
              v-for="choice in choices"
              :key="choice.id"
              size="large"
              class="text-none"
              :variant="
                revealed && (choice.id === answer.id || choice.id === guess) ? 'flat' : 'tonal'
              "
              :color="
                revealed
                  ? choice.id === answer.id
                    ? 'success'
                    : choice.id === guess
                      ? 'error'
                      : undefined
                  : undefined
              "
              :aria-disabled="revealed"
              @click="choose(choice)"
            >
              {{ formatPokemonName(choice.name) }}
            </v-btn>
          </div>
          <div class="d-flex flex-wrap justify-space-between align-center ga-2">
            <v-btn
              v-if="!revealed && cry.supported"
              variant="text"
              :prepend-icon="mdiVolumeHigh"
              @click="hint"
            >
              {{ t('quiz.hint') }}
            </v-btn>
            <v-btn v-if="revealed" color="primary" @click="next">{{ t('quiz.next') }}</v-btn>
            <span class="text-label-large ms-auto">
              {{ t('quiz.streak', { n: streak }) }} · {{ t('quiz.best', { n: best }) }}
            </span>
          </div>
        </v-card-text>
      </v-card>
      <v-skeleton-loader v-else type="image, button@2" />
    </div>
  </DetailLayout>
</template>

<style scoped>
.quiz {
  max-width: 560px;
  margin: 0 auto;
}

.quiz__generations {
  border: 0;
  padding: 0;
  margin: 0;
}

.quiz__art {
  padding: 16px;
  background: radial-gradient(
    circle,
    rgb(var(--v-theme-surface)),
    color-mix(in srgb, rgb(var(--v-theme-primary)) 14%, rgb(var(--v-theme-surface)))
  );
}

/* Silhueta: a mesma imagem toda preta até a resposta. */
.quiz__art--hidden :deep(img) {
  filter: brightness(0);
}

:root .v-theme--dark .quiz__art--hidden :deep(img) {
  filter: brightness(0) invert(0.85);
}

.quiz__choices {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
</style>
