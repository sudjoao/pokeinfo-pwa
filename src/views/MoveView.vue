<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { GAMES } from '@/data/games'
import type { MoveDetail } from '@/services/pokeapi/move.service'
import { useReferenceStore } from '@/stores/reference'
import { usePokedexStore } from '@/stores/pokedex'
import { findGame } from '@/utils/games'
import { formatVersionGroup } from '@/utils/evolution'
import { formatPokemonName } from '@/utils/pokemon'
import { moveHistory, moveInfo, moveName } from '@/utils/moves'
import {
  decodeLearners,
  learnersByMethod,
  loadLearnset,
  type LearnersByMethod,
  type LearnMethod,
} from '@/utils/learnsets'
import DetailLayout from '@/components/templates/DetailLayout.vue'
import InfoTile from '@/components/atoms/InfoTile.vue'
import TypeChip from '@/components/atoms/TypeChip.vue'
import PokemonButtonGrid from '@/components/molecules/PokemonButtonGrid.vue'

const route = useRoute()
const router = useRouter()
const { t, te, locale } = useI18n()
const reference = useReferenceStore()
const pokedex = usePokedexStore()
const slug = computed(() => String(route.params.slug ?? ''))

/** Jogo da URL (valores daquele jogo); null = valores atuais e aprendizes de todos os jogos. */
const game = ref<string | null>(findGame(String(route.query.game ?? ''))?.slug ?? null)
watch(game, (value) => router.replace({ query: value ? { game: value } : {} }))

const info = computed(() => moveInfo(slug.value, game.value))
const title = computed(() =>
  info.value ? moveName(info.value, locale.value) : formatPokemonName(slug.value),
)
watch([title, locale], () => (document.title = t('app.detailTitle', { name: title.value })), {
  immediate: true,
})

const detail = shallowRef<MoveDetail | null>(null)
const status = ref<'loading' | 'ready' | 'error'>('loading')

async function load(): Promise<void> {
  const current = slug.value
  status.value = 'loading'
  try {
    const result = await reference.ensureMove(current)
    if (current !== slug.value) return
    detail.value = result
    status.value = 'ready'
  } catch {
    if (current === slug.value) status.value = 'error'
  }
}
watch(slug, load, { immediate: true })

/** Efeito no idioma atual e o idioma em que veio (a PokéAPI não tem pt-BR). */
const effect = computed(() => {
  const d = detail.value
  if (!d) return null
  if (locale.value === 'es') {
    const es = (game.value && d.effectEs[game.value]) || d.effectEsLatest
    if (es) return { text: es, lang: 'es' }
  }
  return d.effect ? { text: d.effect, lang: 'en' } : null
})

function label(group: string, value: string): string {
  return te(`movePage.${group}.${value}`)
    ? t(`movePage.${group}.${value}`)
    : formatPokemonName(value)
}

/** Efeitos secundários em frases curtas ("30% de chance de paralisar", "Recupera 50% do dano"). */
const secondary = computed(() => {
  const d = detail.value
  if (!d) return []
  const lines: string[] = []
  if (d.ailment) {
    lines.push(
      d.ailmentChance
        ? t('movePage.ailmentChance', {
            chance: d.ailmentChance,
            ailment: label('ailment', d.ailment),
          })
        : label('ailment', d.ailment),
    )
  }
  if (d.flinchChance) lines.push(t('movePage.flinch', { chance: d.flinchChance }))
  if (d.critRate) lines.push(t('movePage.crit', { stage: d.critRate }))
  if (d.drain > 0) lines.push(t('movePage.drain', { pct: d.drain }))
  if (d.drain < 0) lines.push(t('movePage.recoil', { pct: -d.drain }))
  if (d.healing > 0) lines.push(t('movePage.healing', { pct: d.healing }))
  if (d.hits && d.hits.max > 1) {
    lines.push(
      d.hits.min === d.hits.max
        ? t('movePage.hitsFixed', { n: d.hits.max })
        : t('movePage.hits', { min: d.hits.min, max: d.hits.max }),
    )
  }
  if (d.statChanges.length) {
    const changes = d.statChanges
      .map((c) => `${t(`stat.${c.stat}`)} ${c.change > 0 ? '+' : ''}${c.change}`)
      .join(', ')
    lines.push(d.statChance ? t('movePage.statChance', { chance: d.statChance, changes }) : changes)
  }
  return lines
})

// TM/TR/HM do jogo selecionado: uma requisição pequena só para ele.
const machine = ref<string | null>(null)
watch(
  [detail, game],
  async ([d, g]) => {
    machine.value = null
    const url = d && g ? d.machines[g] : undefined
    if (!url) return
    const item = await reference.ensureMachineItem(url).catch(() => null)
    if (detail.value === d && game.value === g) machine.value = item?.toUpperCase() ?? null
  },
  { immediate: true },
)

function gameTitle(versionGroup: string): string {
  return findGame(versionGroup)?.title ?? formatVersionGroup(versionGroup)
}

const history = computed(() => moveHistory(slug.value))

// Aprendizes: com jogo, do learnset (por método e nível); sem jogo, quem aprende em algum jogo.
const learners = shallowRef<LearnersByMethod | null>(null)
const learnersStatus = ref<'loading' | 'ready' | 'error' | 'none'>('loading')

watch(
  [slug, game],
  async ([move, g]) => {
    learners.value = null
    if (!g) {
      learnersStatus.value = 'ready'
      return
    }
    const promise = loadLearnset(g)
    if (!promise) {
      learnersStatus.value = 'none'
      return
    }
    learnersStatus.value = 'loading'
    try {
      const learnset = await promise
      if (move !== slug.value || g !== game.value) return
      learners.value = learnersByMethod(decodeLearners(learnset[move]))
      learnersStatus.value = 'ready'
    } catch {
      learnersStatus.value = 'error'
    }
  },
  { immediate: true },
)

const METHODS: readonly LearnMethod[] = ['L', 'M', 'E', 'T', 'O']
const tab = ref<LearnMethod>('L')

function nameOf(id: number): string {
  return pokedex.entryOf(id)?.name ?? String(id)
}

const tabs = computed(() =>
  learners.value ? METHODS.filter((m) => learners.value![m].length) : [],
)
watch(tabs, (list) => {
  if (list.length && !list.includes(tab.value)) tab.value = list[0]!
})

const tabItems = computed(() => {
  const l = learners.value
  if (!l) return []
  if (tab.value === 'L') {
    return l.L.map(({ id, level }) => ({
      id,
      name: nameOf(id),
      note: level === 0 ? t('moves.evolve') : t('detail.level', { n: level }),
    }))
  }
  return l[tab.value].map((id) => ({ id, name: nameOf(id) }))
})

const allLearners = computed(() =>
  (detail.value?.learnedBy ?? [])
    .slice()
    .sort((a, b) => a - b)
    .map((id) => ({ id, name: nameOf(id) })),
)
const learnerCount = computed(() =>
  game.value
    ? new Set(
        METHODS.flatMap((m) =>
          (learners.value?.[m] ?? []).map((x) => (typeof x === 'number' ? x : x.id)),
        ),
      ).size
    : allLearners.value.length,
)

const gameItems = computed(() => [
  { value: null, title: t('movesPage.allGames') },
  ...[...GAMES].reverse().map((g) => ({ value: g.slug, title: g.title })),
])

function openPokemon(id: number): void {
  router.push({ name: 'pokemon', params: { id }, query: game.value ? { game: game.value } : {} })
}

function goBack(): void {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'moves' })
}

const dash = '—'
</script>

<template>
  <DetailLayout :title="title" @back="goBack">
    <div class="d-flex flex-column ga-4">
      <v-card v-if="!info" class="pa-4">
        <p class="mb-3">{{ t('movePage.notFound') }}</p>
        <v-btn color="primary" variant="tonal" :to="{ name: 'moves' }">{{
          t('movesPage.title')
        }}</v-btn>
      </v-card>

      <template v-else>
        <v-select
          v-model="game"
          :items="gameItems"
          :label="t('moves.game')"
          density="compact"
          variant="outlined"
          hide-details
          class="move-page__game"
        />

        <v-card>
          <v-card-text>
            <div class="d-flex align-center flex-wrap ga-2 mb-4">
              <TypeChip :type="info.type" />
              <span class="text-body-medium">{{ t(`moves.${info.category}`) }}</span>
              <span v-if="machine" class="text-label-large ms-auto">{{ machine }}</span>
            </div>
            <div class="move-page__tiles">
              <InfoTile :label="t('moves.power')" :value="String(info.power ?? dash)" />
              <InfoTile
                :label="t('moves.accuracy')"
                :value="info.accuracy ? `${info.accuracy}%` : dash"
              />
              <InfoTile :label="t('moves.pp')" :value="String(info.pp ?? dash)" />
              <InfoTile
                :label="t('movePage.priority')"
                :value="
                  detail
                    ? detail.priority > 0
                      ? `+${detail.priority}`
                      : String(detail.priority)
                    : undefined
                "
              />
              <InfoTile
                :label="t('movePage.targetLabel')"
                :value="detail ? label('target', detail.target) : undefined"
              />
            </div>

            <v-skeleton-loader
              v-if="status === 'loading'"
              aria-hidden="true"
              type="paragraph"
              class="mt-3"
            />
            <div v-else-if="status === 'error'" class="d-flex flex-column align-start ga-2 mt-4">
              <span>{{ t('movePage.loadError') }}</span>
              <v-btn color="primary" variant="tonal" size="small" @click="load">{{
                t('common.retry')
              }}</v-btn>
            </div>
            <template v-else>
              <p v-if="effect" class="text-body-medium mt-4 mb-0" :lang="effect.lang">
                {{ effect.text }}
              </p>
              <ul v-if="secondary.length" class="move-page__secondary mt-2">
                <li v-for="line in secondary" :key="line" class="text-body-small">{{ line }}</li>
              </ul>
            </template>
          </v-card-text>
        </v-card>

        <v-card v-if="history.length">
          <v-card-title tag="h2" class="text-title-medium">{{
            t('movePage.history')
          }}</v-card-title>
          <v-card-text>
            <ul class="move-page__history">
              <li v-for="change in history" :key="change.before" class="text-body-medium">
                <span class="text-label-large">{{
                  t('movePage.before', { game: gameTitle(change.before) })
                }}</span>
                <span class="ms-2">
                  <template v-if="change.type">
                    <TypeChip :type="change.type" size="x-small" class="me-1" />
                  </template>
                  {{
                    [
                      change.power !== null ? `${t('moves.power')} ${change.power || dash}` : null,
                      change.accuracy !== null
                        ? `${t('moves.accuracy')} ${change.accuracy ? `${change.accuracy}%` : dash}`
                        : null,
                      change.pp !== null ? `${t('moves.pp')} ${change.pp}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  }}
                </span>
              </li>
            </ul>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title tag="h2" class="text-title-medium">
            {{ t('movePage.learners') }}
            <span
              v-if="learnersStatus === 'ready' && (game || status === 'ready')"
              class="text-label-large opacity-70 ms-1"
            >
              ({{ learnerCount }})
            </span>
          </v-card-title>
          <v-card-text>
            <p v-if="learnersStatus === 'none'" class="opacity-70 mb-0">
              {{ t('movePage.noLearnset', { game: game ? gameTitle(game) : '' }) }}
            </p>
            <v-skeleton-loader
              v-else-if="learnersStatus === 'loading' || (!game && status === 'loading')"
              aria-hidden="true"
              type="list-item@4"
            />
            <div v-else-if="learnersStatus === 'error'" class="d-flex flex-column align-start ga-2">
              <span>{{ t('movesPage.loadError') }}</span>
            </div>
            <template v-else-if="game">
              <p v-if="!tabs.length" class="opacity-70 mb-0">
                {{ t('movePage.noneInGame', { game: gameTitle(game) }) }}
              </p>
              <template v-else>
                <v-tabs v-model="tab" density="compact" show-arrows class="mb-2">
                  <v-tab v-for="method in tabs" :key="method" :value="method" class="text-none">
                    {{ t(`movePage.method.${method}`) }} ({{ learners![method].length }})
                  </v-tab>
                </v-tabs>
                <PokemonButtonGrid :items="tabItems" @select="openPokemon" />
              </template>
            </template>
            <template v-else>
              <p class="text-body-small opacity-70">{{ t('movePage.allGamesHint') }}</p>
              <PokemonButtonGrid :items="allLearners" @select="openPokemon" />
            </template>
          </v-card-text>
        </v-card>
      </template>
    </div>
  </DetailLayout>
</template>

<style scoped>
.move-page__game {
  max-width: 360px;
}

.move-page__tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(96px, 1fr));
  gap: 16px 12px;
}

.move-page__secondary,
.move-page__history {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 0;
  margin: 0;
  list-style: none;
}
</style>
