<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { TeamMember } from '@/composables/useTeam'
import type { CoverageRow, DefenseRow } from '@/utils/typeChart'
import { TYPE_COLORS } from '@/utils/pokemon'
import TypeChip from '@/components/atoms/TypeChip.vue'
import TeamDefenseTable from '@/components/organisms/TeamDefenseTable.vue'
import TeamCoverage from '@/components/organisms/TeamCoverage.vue'

/** Fraquezas, tabela defensiva e cobertura ofensiva de um time já analisado (utils/typeChart). */
defineProps<{
  members: readonly TeamMember[]
  defense: readonly DefenseRow[]
  threats: readonly DefenseRow[]
  coverage: readonly CoverageRow[]
  gaps: readonly CoverageRow[]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <v-card>
      <v-card-title class="text-title-medium">{{ t('team.threats') }}</v-card-title>
      <v-card-text>
        <p v-if="threats.length === 0" class="mb-0 opacity-70">{{ t('team.noThreats') }}</p>
        <div v-else class="d-flex flex-wrap ga-2">
          <v-chip
            v-for="row in threats"
            :key="row.type"
            :color="TYPE_COLORS[row.type]"
            variant="flat"
            class="team-analysis__threat"
          >
            {{ t(`type.${row.type}`) }} · {{ t('team.weakMembers', row.weak) }}
          </v-chip>
        </div>
      </v-card-text>
    </v-card>

    <v-card>
      <v-card-title class="text-title-medium">{{ t('team.defense') }}</v-card-title>
      <v-card-subtitle class="text-wrap">{{ t('team.defenseHint') }}</v-card-subtitle>
      <TeamDefenseTable :members="members" :rows="defense" class="mt-2" />
    </v-card>

    <v-card>
      <v-card-title class="text-title-medium">{{ t('team.coverage') }}</v-card-title>
      <v-card-subtitle class="text-wrap">{{ t('team.coverageHint') }}</v-card-subtitle>
      <v-card-text>
        <div v-if="gaps.length" class="d-flex align-center flex-wrap ga-2 mb-4">
          <span class="text-label-large">{{ t('team.gaps') }}:</span>
          <TypeChip v-for="row in gaps" :key="row.type" :type="row.type" />
        </div>
        <p v-else class="mb-4 opacity-70">{{ t('team.noGaps') }}</p>
        <TeamCoverage :members="members" :rows="coverage" />
      </v-card-text>
    </v-card>

    <p class="text-body-small opacity-60 mb-0">{{ t('team.chartNote') }}</p>
  </div>
</template>

<style scoped>
.team-analysis__threat {
  color: #fff;
  font-weight: 600;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.25);
}
</style>
