<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { TeamMember } from '@/composables/useTeam'
import type { DefenseRow } from '@/utils/typeChart'
import TypeChip from '@/components/atoms/TypeChip.vue'
import PokemonAvatar from '@/components/atoms/PokemonAvatar.vue'
import MultiplierBadge from '@/components/atoms/MultiplierBadge.vue'

defineProps<{
  members: readonly TeamMember[]
  rows: readonly DefenseRow[]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="team-defense">
    <v-table density="compact" class="team-defense__table">
      <thead>
        <tr>
          <th class="text-left">{{ t('team.attack') }}</th>
          <th v-for="member in members" :key="member.id" class="text-center px-1">
            <PokemonAvatar :id="member.id" :name="member.name" :size="28" />
          </th>
          <th class="text-center px-1 team-defense__count text-label-small">
            {{ t('team.weak') }}
          </th>
          <th class="text-center px-1 team-defense__count text-label-small">
            {{ t('team.resist') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.type">
          <td class="pe-1"><TypeChip :type="row.type" size="x-small" /></td>
          <td v-for="(multiplier, i) in row.multipliers" :key="i" class="text-center px-1">
            <MultiplierBadge :multiplier="multiplier" />
          </td>
          <td class="text-center px-1 team-defense__count" :class="{ 'text-error': row.weak }">
            {{ row.weak || '·' }}
          </td>
          <td
            class="text-center px-1 team-defense__count"
            :class="{ 'text-success': row.resistant }"
          >
            {{ row.resistant || '·' }}
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<style scoped>
.team-defense {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Colunas estreitas para a tabela (tipo + 6 membros + 2 contagens) caber num celular. */
.team-defense__table :deep(th),
.team-defense__table :deep(td) {
  white-space: nowrap;
  padding-left: 3px !important;
  padding-right: 3px !important;
}

.team-defense__table :deep(th:first-child),
.team-defense__table :deep(td:first-child) {
  padding-left: 12px !important;
}

.team-defense__count {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
</style>
