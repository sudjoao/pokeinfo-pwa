<script setup lang="ts">
import {
  mdiContentCopy,
  mdiDeleteSweepOutline,
  mdiImport,
  mdiImageOutline,
  mdiShareVariant,
  mdiSpeedometer,
} from '@mdi/js'
import { computed, nextTick, useTemplateRef } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { TEAM_SIZE, type TeamMember } from '@/composables/useTeam'
import type { CounterSuggestion, CoverageRow, DefenseRow } from '@/utils/typeChart'
import TeamBench from '@/components/organisms/TeamBench.vue'
import TeamAnalysis from '@/components/organisms/TeamAnalysis.vue'

/** Time completo + análise: vai no painel lateral (desktop) ou no sheet aberto pela bandeja (celular). */
const props = defineProps<{
  members: readonly TeamMember[]
  defense: readonly DefenseRow[]
  threats: readonly DefenseRow[]
  coverage: readonly CoverageRow[]
  gaps: readonly CoverageRow[]
  suggestions: readonly CounterSuggestion[]
}>()

const emit = defineEmits<{
  select: [member: TeamMember]
  remove: [member: TeamMember]
  add: []
  clear: []
  addSuggestion: [id: number]
  exportShowdown: []
  importShowdown: []
  share: []
  shareImage: []
}>()

const { t } = useI18n()
const route = useRoute()

/** Speed tiers com o time destacado, no mesmo jogo do team builder. */
const speedRoute = computed(() => ({
  name: 'speed',
  query: {
    team: props.members.map((member) => member.id).join(','),
    ...(route.query.game ? { game: route.query.game } : {}),
  },
}))

// Remover um membro ou limpar o time tira o botão focado da tela: o foco vai para o título.
const heading = useTemplateRef<HTMLElement>('heading')
function removed(): void {
  nextTick(() => heading.value?.focus())
}

function remove(member: TeamMember): void {
  emit('remove', member)
  removed()
}

function clear(): void {
  emit('clear')
  removed()
}
</script>

<template>
  <div class="team-panel d-flex flex-column ga-4">
    <section :aria-label="t('team.heading')">
      <div class="d-flex align-center justify-space-between mb-2">
        <h2 ref="heading" class="team-panel__heading text-title-medium" tabindex="-1">
          {{ t('team.heading') }}
          <span class="team-panel__count opacity-70">
            {{ t('team.count', { n: members.length, max: TEAM_SIZE }) }}
          </span>
        </h2>
        <v-btn
          v-if="members.length"
          variant="text"
          size="small"
          :prepend-icon="mdiDeleteSweepOutline"
          @click="clear"
        >
          {{ t('team.clear') }}
        </v-btn>
      </div>
      <TeamBench
        :members="members"
        wrap
        @select="emit('select', $event)"
        @remove="remove"
        @add="emit('add')"
      />
      <div class="d-flex flex-wrap ga-2 mt-2">
        <v-btn
          v-if="members.length"
          variant="tonal"
          size="small"
          :prepend-icon="mdiShareVariant"
          @click="emit('share')"
        >
          {{ t('team.share') }}
        </v-btn>
        <v-btn
          v-if="members.length"
          variant="tonal"
          size="small"
          :prepend-icon="mdiImageOutline"
          aria-haspopup="dialog"
          @click="emit('shareImage')"
        >
          {{ t('shareImage.button') }}
        </v-btn>
        <v-btn
          v-if="members.length"
          variant="tonal"
          size="small"
          :prepend-icon="mdiContentCopy"
          @click="emit('exportShowdown')"
        >
          {{ t('team.export') }}
        </v-btn>
        <v-btn
          v-if="members.length"
          variant="tonal"
          size="small"
          :prepend-icon="mdiSpeedometer"
          :to="speedRoute"
        >
          {{ t('speed.fromTeam') }}
        </v-btn>
        <v-btn
          variant="tonal"
          size="small"
          :prepend-icon="mdiImport"
          aria-haspopup="dialog"
          @click="emit('importShowdown')"
        >
          {{ t('team.import') }}
        </v-btn>
      </div>
    </section>

    <p v-if="members.length === 0" class="text-body-medium opacity-70 mb-0">
      {{ t('team.analysisEmpty') }}
    </p>
    <TeamAnalysis
      v-else
      :members="members"
      :defense="defense"
      :threats="threats"
      :coverage="coverage"
      :gaps="gaps"
      :suggestions="suggestions"
      :full="members.length >= TEAM_SIZE"
      @add="emit('addSuggestion', $event)"
    />
  </div>
</template>

<style scoped>
.team-panel__count {
  font-variant-numeric: tabular-nums;
  font-weight: 400;
}
</style>
