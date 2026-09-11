<script setup lang="ts">
import { mdiCheck } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import type { PokemonType } from '@/types/pokemon'
import { TYPE_COLORS } from '@/utils/pokemon'

defineProps<{
  type: PokemonType
  selected: boolean
}>()

const emit = defineEmits<{ toggle: [type: PokemonType] }>()

const { t } = useI18n()
</script>

<template>
  <v-chip
    :color="TYPE_COLORS[type]"
    variant="flat"
    size="default"
    :prepend-icon="selected ? mdiCheck : undefined"
    class="type-toggle"
    :class="{ 'type-toggle--selected': selected }"
    :aria-pressed="selected"
    @click="emit('toggle', type)"
  >
    {{ t(`type.${type}`) }}
  </v-chip>
</template>

<style scoped>
/* Mesma cara da TypeChip; a não selecionada fica esmaecida para a escolhida saltar aos olhos. */
.type-toggle {
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.25);
  opacity: 0.55;
  transition:
    opacity 0.15s ease,
    box-shadow 0.15s ease;
}

.type-toggle--selected {
  opacity: 1;
  box-shadow: 0 0 0 2px rgb(var(--v-theme-on-surface));
}
</style>
