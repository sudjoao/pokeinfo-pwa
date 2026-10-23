<script setup lang="ts">
import { mdiContentCopy, mdiDeleteSweepOutline, mdiImport, mdiShareVariant } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { TEAM_SIZE, type TeamMember } from '@/composables/useTeam'
import type { CounterSuggestion, CoverageRow, DefenseRow } from '@/utils/typeChart'
import TeamBench from '@/components/organisms/TeamBench.vue'
import TeamAnalysis from '@/components/organisms/TeamAnalysis.vue'

/** Time completo + análise: vai no painel lateral (desktop) ou no sheet aberto pela bandeja (celular). */
defineProps<{
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
}>()

const { t } = useI18n()
</script>

<template>
  <div class="team-panel d-flex flex-column ga-4">
    <section :aria-label="t('team.heading')">
      <div class="d-flex align-center justify-space-between mb-2">
        <h2 class="text-title-medium">
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
          @click="emit('clear')"
        >
          {{ t('team.clear') }}
        </v-btn>
      </div>
      <TeamBench
        :members="members"
        wrap
        @select="emit('select', $event)"
        @remove="emit('remove', $event)"
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
          :prepend-icon="mdiContentCopy"
          @click="emit('exportShowdown')"
        >
          {{ t('team.export') }}
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
