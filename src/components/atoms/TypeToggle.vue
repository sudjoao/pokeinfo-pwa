<script setup lang="ts">
import { mdiCheck } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import type { PokemonType } from '@/types/pokemon'
import { TYPE_COLORS, TYPE_TEXT_COLORS } from '@/utils/pokemon'

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
    :style="{ color: TYPE_TEXT_COLORS[type] }"
    role="button"
    :aria-pressed="selected"
    @click="emit('toggle', type)"
  >
    {{ t(`type.${type}`) }}
  </v-chip>
</template>

<style scoped>
/*
 * Mesma cara da TypeChip. A escolhida ganha o check e um anel duplo; as outras ficam com a cor
 * cheia: esmaecer (como antes) derrubava o contraste do texto abaixo de 4,5:1 em vários tipos.
 */
.type-toggle {
  font-weight: 600;
  letter-spacing: 0.02em;
  transition: box-shadow 0.15s ease;
}

.type-toggle--selected {
  box-shadow:
    0 0 0 2px rgb(var(--v-theme-surface)),
    0 0 0 4px rgb(var(--v-theme-on-surface));
}
</style>
