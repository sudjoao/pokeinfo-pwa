<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Game } from '@/data/games'
import type { LeagueSection, Trainer } from '@/types/trainers'
import { loadLeague } from '@/utils/league'
import { maxLevel } from '@/utils/trainers'
import { useConditionLabel } from '@/composables/useConditionLabel'
import TypeChip from '@/components/atoms/TypeChip.vue'
import TrainerDetails from '@/components/organisms/TrainerDetails.vue'

/** Aba "Líderes" da Home: ginásios, Elite 4 e campeão do jogo, um painel por treinador. */
const props = defineProps<{ game: Game }>()
const emit = defineEmits<{ select: [id: number] }>()

const { t } = useI18n()
const conditionLabel = useConditionLabel(() => props.game)

const sections = shallowRef<readonly LeagueSection[] | null>(null)
const status = ref<'loading' | 'ready' | 'error'>('loading')
const openPanel = ref<string | undefined>(undefined)

function load(): void {
  const slug = props.game.slug
  status.value = 'loading'
  sections.value = null
  openPanel.value = undefined
  loadLeague(slug)
    .then((league) => {
      if (props.game.slug !== slug) return
      sections.value = league
      status.value = 'ready'
    })
    .catch(() => {
      if (props.game.slug === slug) status.value = 'error'
    })
}

watch(() => props.game.slug, load, { immediate: true })

/** Chave do painel: o mesmo treinador aparece em duas seções (Larry no ginásio e na Elite 4). */
function panelKey(section: LeagueSection, trainer: Trainer): string {
  return `${section.key}:${trainer.page}`
}

/** Nível máximo da primeira luta, para o título do painel. */
function firstLevel(trainer: Trainer): number {
  return maxLevel(trainer.battles[0]?.teams[0]?.pokemon ?? [])
}
</script>

<template>
  <div>
    <v-skeleton-loader v-if="status === 'loading'" aria-hidden="true" type="list-item-two-line@6" />

    <div v-else-if="status === 'error'" class="d-flex flex-column align-start ga-2">
      <span>{{ t('league.loadError') }}</span>
      <v-btn color="primary" variant="tonal" size="small" @click="load">
        {{ t('common.retry') }}
      </v-btn>
    </div>

    <p v-else-if="!sections?.length" class="text-body-medium opacity-70 mb-0">
      {{ t('league.empty', { game: game.title }) }}
    </p>

    <template v-else>
      <section v-for="section in sections" :key="section.key" class="league-section">
        <h2 class="text-title-small mb-2">{{ t(`league.section.${section.key}`) }}</h2>
        <v-expansion-panels v-model="openPanel" variant="accordion">
          <v-expansion-panel
            v-for="trainer in section.trainers"
            :key="panelKey(section, trainer)"
            :value="panelKey(section, trainer)"
          >
            <v-expansion-panel-title>
              <div class="d-flex flex-column ga-1 min-width-0">
                <div class="d-flex align-center flex-wrap gc-2 gr-1">
                  <span class="text-body-medium font-weight-medium">{{ trainer.name }}</span>
                  <TypeChip v-if="trainer.type" :type="trainer.type" size="x-small" />
                  <span class="text-label-small opacity-70">
                    {{ t('league.maxLevel', { n: firstLevel(trainer) }) }}
                  </span>
                </div>
                <div class="d-flex align-center flex-wrap gc-2 text-label-small opacity-70">
                  <span v-if="trainer.location" lang="en">{{ trainer.location }}</span>
                  <span v-if="trainer.when" class="text-primary-safe">
                    {{ conditionLabel(trainer.when) }}
                  </span>
                </div>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <TrainerDetails :trainer="trainer" :game="game" @select="emit('select', $event)" />
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </section>
      <p class="text-label-small opacity-70 mt-4 mb-0">{{ t('league.source') }}</p>
    </template>
  </div>
</template>

<style scoped>
.league-section + .league-section {
  margin-top: 16px;
}

.min-width-0 {
  min-width: 0;
}
</style>
