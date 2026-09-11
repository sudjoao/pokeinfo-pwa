<script setup lang="ts">
import { computed } from 'vue'
import { mdiClose, mdiPlus } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import type { TeamMember } from '@/composables/useTeam'
import { artworkUrl, formatPokemonName, TYPE_COLORS } from '@/utils/pokemon'
import PokemonArtwork from '@/components/atoms/PokemonArtwork.vue'
import TypeChip from '@/components/atoms/TypeChip.vue'

const props = defineProps<{
  /** null = vaga vazia. */
  member: TeamMember | null
}>()

const emit = defineEmits<{
  select: [member: TeamMember]
  remove: [member: TeamMember]
  add: []
}>()

const { t } = useI18n()

const name = computed(() => (props.member ? formatPokemonName(props.member.name) : ''))
const accent = computed(() => TYPE_COLORS[props.member?.types[0] ?? 'unknown'])
</script>

<template>
  <v-card
    v-if="member"
    class="team-slot"
    :style="{ '--accent': accent }"
    hover
    :aria-label="t('team.open', { name })"
    @click="emit('select', member)"
  >
    <div class="team-slot__art pa-1">
      <PokemonArtwork :src="artworkUrl(member.id)" :alt="name" :size="72" />
      <v-btn
        :icon="mdiClose"
        size="x-small"
        variant="flat"
        color="surface"
        class="team-slot__remove"
        :aria-label="t('team.remove', { name })"
        @click.stop.prevent="emit('remove', member)"
      />
    </div>
    <div class="px-2 pb-2 pt-1">
      <div class="text-label-medium text-truncate" :title="name">{{ name }}</div>
      <div class="d-flex flex-wrap ga-1 mt-1">
        <TypeChip v-for="type in member.types" :key="type" :type="type" size="x-small" />
      </div>
    </div>
  </v-card>

  <v-card
    v-else
    variant="outlined"
    class="team-slot team-slot--empty d-flex flex-column align-center justify-center ga-1"
    :aria-label="t('team.addSlot')"
    @click="emit('add')"
  >
    <v-icon :icon="mdiPlus" size="28" />
    <span class="text-label-small">{{ t('team.emptySlot') }}</span>
  </v-card>
</template>

<style scoped>
.team-slot {
  width: 108px;
  min-height: 132px;
  flex-shrink: 0;
  overflow: hidden;
}

.team-slot__art {
  position: relative;
  background: color-mix(in srgb, var(--accent) 22%, rgb(var(--v-theme-surface)));
}

.team-slot__remove {
  position: absolute;
  top: 2px;
  right: 2px;
  opacity: 0.85;
}

.team-slot--empty {
  border-style: dashed;
  opacity: 0.6;
  cursor: pointer;
}
</style>
