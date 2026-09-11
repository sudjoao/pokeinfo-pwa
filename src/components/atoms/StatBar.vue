<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { StatName } from '@/types/pokemon'
import { MAX_BASE_STAT, statColor } from '@/utils/pokemon'

const props = defineProps<{ name: StatName; value: number }>()

const { t } = useI18n()

const label = computed(() => t(`stat.${props.name}`))
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
