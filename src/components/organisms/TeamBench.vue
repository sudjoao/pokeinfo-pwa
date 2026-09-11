<script setup lang="ts">
import { computed } from 'vue'
import { TEAM_SIZE, type TeamMember } from '@/composables/useTeam'
import TeamSlot from '@/components/molecules/TeamSlot.vue'

const props = defineProps<{
  members: readonly TeamMember[]
  /** Quebra em linhas (painel lateral e sheet) em vez de rolar na horizontal. */
  wrap?: boolean
}>()

const emit = defineEmits<{
  select: [member: TeamMember]
  remove: [member: TeamMember]
  add: []
}>()

/** Sempre 6 vagas: as vazias ficam no fim. */
const slots = computed<(TeamMember | null)[]>(() =>
  Array.from({ length: TEAM_SIZE }, (_, i) => props.members[i] ?? null),
)
</script>

<template>
  <div class="team-bench d-flex ga-2" :class="{ 'team-bench--wrap': wrap }">
    <TeamSlot
      v-for="(member, i) in slots"
      :key="member?.id ?? `empty-${i}`"
      :member="member"
      @select="emit('select', $event)"
      @remove="emit('remove', $event)"
      @add="emit('add')"
    />
  </div>
</template>

<style scoped>
/* Rola na horizontal por padrão; com `wrap`, vira uma grade que cabe na largura disponível. */
.team-bench {
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  padding: 2px;
  margin: -2px;
}

.team-bench::-webkit-scrollbar {
  display: none;
}

.team-bench--wrap {
  flex-wrap: wrap;
  overflow: visible;
}

.team-bench--wrap :deep(.team-slot) {
  flex: 1 1 96px;
  max-width: 140px;
}
</style>
