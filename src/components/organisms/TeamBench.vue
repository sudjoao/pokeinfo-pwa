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
  <TransitionGroup
    tag="div"
    name="team-slot"
    class="team-bench d-flex ga-2"
    :class="{ 'team-bench--wrap': wrap }"
  >
    <TeamSlot
      v-for="(member, i) in slots"
      :key="member?.id ?? `empty-${i}`"
      :member="member"
      @select="emit('select', $event)"
      @remove="emit('remove', $event)"
      @add="emit('add')"
    />
  </TransitionGroup>
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

/*
 * Membro entra com um pop, sai encolhendo, e os vizinhos deslizam pro lugar (FLIP do
 * TransitionGroup). leave-active vira position: absolute pra não empurrar quem tá ao lado
 * enquanto ainda está saindo — assim o slide e o fade acontecem juntos, não em sequência.
 */
.team-slot-move {
  transition: transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.team-slot-enter-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.team-slot-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
  position: absolute;
}

.team-slot-enter-from {
  opacity: 0;
  transform: scale(0.4) translateY(12px);
}

.team-slot-leave-to {
  opacity: 0;
  transform: scale(0.4);
}
</style>
