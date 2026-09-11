<script setup lang="ts">
import { mdiDeleteSweepOutline } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { TEAM_SIZE, type TeamMember } from '@/composables/useTeam'
import type { CoverageRow, DefenseRow } from '@/utils/typeChart'
import TeamBench from '@/components/organisms/TeamBench.vue'
import TeamAnalysis from '@/components/organisms/TeamAnalysis.vue'

/** Time completo + análise: vai no painel lateral (desktop) ou no sheet aberto pela bandeja (celular). */
defineProps<{
  members: readonly TeamMember[]
  defense: readonly DefenseRow[]
  threats: readonly DefenseRow[]
  coverage: readonly CoverageRow[]
  gaps: readonly CoverageRow[]
}>()

const emit = defineEmits<{
  select: [member: TeamMember]
  remove: [member: TeamMember]
  add: []
  clear: []
}>()

const { t } = useI18n()
</script>

<template>
  <div class="team-panel d-flex flex-column ga-4">
    <section :aria-label="t('team.heading')">
      <div class="d-flex align-center justify-space-between mb-2">
        <h2 class="text-title-medium">
          {{ t('team.heading') }}
          <span class="team-panel__count opacity-60">
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
    />
  </div>
</template>

<style scoped>
.team-panel__count {
  font-variant-numeric: tabular-nums;
  font-weight: 400;
}
</style>
