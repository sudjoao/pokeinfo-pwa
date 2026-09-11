<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { TeamMember } from '@/composables/useTeam'
import type { CoverageRow } from '@/utils/typeChart'
import TypeChip from '@/components/atoms/TypeChip.vue'
import PokemonAvatar from '@/components/atoms/PokemonAvatar.vue'

defineProps<{
  members: readonly TeamMember[]
  rows: readonly CoverageRow[]
}>()

const { t } = useI18n()
</script>

<template>
  <ul class="team-coverage pa-0">
    <li
      v-for="row in rows"
      :key="row.type"
      class="team-coverage__row d-flex align-center ga-2"
      :class="{ 'team-coverage__row--gap': row.coveredBy.length === 0 }"
    >
      <TypeChip :type="row.type" size="x-small" class="flex-shrink-0" />
      <span v-if="row.coveredBy.length === 0" class="text-label-small opacity-60">
        {{ t('team.gaps') }}
      </span>
      <span v-else class="d-inline-flex flex-wrap ga-1">
        <PokemonAvatar
          v-for="index in row.coveredBy"
          :key="index"
          :id="members[index]!.id"
          :name="members[index]!.name"
          :size="24"
        />
      </span>
    </li>
  </ul>
</template>

<style scoped>
.team-coverage {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 6px 12px;
}

.team-coverage__row {
  min-height: 28px;
  align-items: flex-start;
}

.team-coverage__row--gap :deep(.type-chip) {
  opacity: 0.6;
}
</style>
