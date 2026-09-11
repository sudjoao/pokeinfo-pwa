<script setup lang="ts">
import { computed } from 'vue'
import { mdiChevronUp } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { TEAM_SIZE, type TeamMember } from '@/composables/useTeam'
import { TYPE_COLORS } from '@/utils/pokemon'
import PokemonAvatar from '@/components/atoms/PokemonAvatar.vue'

/**
 * Bandeja fixa no rodapé (celular): os 6 slots em miniatura sempre à vista enquanto a lista rola.
 * Tocar abre o sheet com o time completo e a análise; remover fica lá, longe de toques acidentais.
 */
const props = defineProps<{ members: readonly TeamMember[] }>()

const emit = defineEmits<{ open: [] }>()

const { t } = useI18n()

const slots = computed<(TeamMember | null)[]>(() =>
  Array.from({ length: TEAM_SIZE }, (_, i) => props.members[i] ?? null),
)

/** Curto de propósito: ao lado dos 6 slots sobra pouco espaço num celular. */
const label = computed(() =>
  props.members.length
    ? t('team.count', { n: props.members.length, max: TEAM_SIZE })
    : t('team.trayEmpty'),
)
</script>

<template>
  <button type="button" class="team-tray" :aria-label="t('team.open')" @click="emit('open')">
    <div class="team-tray__inner d-flex align-center ga-3">
      <div class="d-flex ga-2" aria-hidden="true">
        <span
          v-for="(member, i) in slots"
          :key="member?.id ?? `empty-${i}`"
          class="team-tray__slot"
          :class="{ 'team-tray__slot--empty': !member }"
          :style="member ? { '--accent': TYPE_COLORS[member.types[0] ?? 'unknown'] } : undefined"
        >
          <PokemonAvatar v-if="member" :id="member.id" :name="member.name" :size="34" />
        </span>
      </div>
      <span class="team-tray__label text-label-large flex-grow-1 text-truncate">{{ label }}</span>
      <v-icon :icon="mdiChevronUp" />
    </div>
  </button>
</template>

<style scoped>
.team-tray {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1005;
  width: 100%;
  padding: 8px calc(16px + var(--safe-right)) calc(8px + var(--safe-bottom))
    calc(16px + var(--safe-left));
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
  text-align: start;
  cursor: pointer;
}

.team-tray__inner {
  max-width: 1280px;
  margin: 0 auto;
}

.team-tray__slot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--accent, transparent) 30%, rgb(var(--v-theme-surface)));
  box-shadow: 0 0 0 2px var(--accent, transparent);
}

.team-tray__slot :deep(.pokemon-avatar) {
  background: transparent;
}

.team-tray__slot--empty {
  border: 2px dashed rgba(var(--v-border-color), 0.5);
  box-shadow: none;
}

.team-tray__label {
  min-width: 0;
}

/* Em telas muito estreitas o rótulo cede espaço para os 6 slots. */
@media (max-width: 380px) {
  .team-tray__label {
    display: none;
  }
}
</style>
