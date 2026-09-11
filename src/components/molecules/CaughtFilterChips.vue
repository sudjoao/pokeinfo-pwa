<script setup lang="ts">
import { mdiPokeball } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import type { CaughtFilter } from '@/composables/usePokemonList'

defineProps<{
  selected: CaughtFilter
  caughtCount: number
  missingCount: number
}>()

const emit = defineEmits<{ select: [filter: CaughtFilter] }>()

const { t } = useI18n()

const OPTIONS: { value: Exclude<CaughtFilter, null>; labelKey: string }[] = [
  { value: 'caught', labelKey: 'home.caught' },
  { value: 'missing', labelKey: 'home.missing' },
]

/** Tocar na chip já selecionada volta para "todos". */
function pick(value: Exclude<CaughtFilter, null>, selected: CaughtFilter): void {
  emit('select', selected === value ? null : value)
}
</script>

<template>
  <v-chip
    v-for="option in OPTIONS"
    :key="option.value"
    size="default"
    :variant="option.value === selected ? 'flat' : 'tonal'"
    :prepend-icon="option.value === 'caught' ? mdiPokeball : undefined"
    class="caught-chip flex-shrink-0"
    :class="{ 'caught-chip--selected': option.value === selected }"
    :aria-pressed="option.value === selected"
    @click="pick(option.value, selected)"
  >
    {{ t(option.labelKey) }}
    <span class="caught-chip__count ms-1">
      {{ option.value === 'caught' ? caughtCount : missingCount }}
    </span>
  </v-chip>
</template>

<style scoped>
/* Mesmo tratamento das chips de dex: sobre o cabeçalho colorido, a selecionada inverte as cores. */
.caught-chip--selected {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
}

.caught-chip__count {
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
}
</style>
