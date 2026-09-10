<script setup lang="ts">
import { computed } from 'vue'
import type { StatName } from '@/types/pokemon'
import { MAX_BASE_STAT, STAT_LABELS, statColor } from '@/utils/pokemon'

const props = defineProps<{ name: StatName; value: number }>()

const label = computed(() => STAT_LABELS[props.name].label)
const percent = computed(() => Math.min(100, (props.value / MAX_BASE_STAT) * 100))
const color = computed(() => statColor(props.value))
</script>

<template>
  <div class="stat-bar d-flex align-center ga-3">
    <span class="stat-bar__label text-body-medium">{{ label }}</span>
    <span class="stat-bar__value text-label-large font-weight-bold">{{ value }}</span>
    <v-progress-linear
      :model-value="percent"
      :color="color"
      height="8"
      rounded
      class="flex-grow-1"
      :aria-label="`${label}: ${value}`"
    />
  </div>
</template>

<style scoped>
.stat-bar__label {
  flex: 0 0 8.5rem;
  opacity: 0.8;
}

.stat-bar__value {
  flex: 0 0 2.5rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 400px) {
  .stat-bar__label {
    flex-basis: 7rem;
  }
}
</style>
