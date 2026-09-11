<script setup lang="ts">
import { computed } from 'vue'
import { formatMultiplier } from '@/utils/typeChart'

const props = defineProps<{ multiplier: number }>()

const label = computed(() => formatMultiplier(props.multiplier))

/** Faixa do multiplicador, para a cor: fraqueza em vermelho, resistência em verde, imune em cinza. */
const level = computed(() => {
  const m = props.multiplier
  if (m === 0) return 'immune'
  if (m >= 4) return 'very-weak'
  if (m > 1) return 'weak'
  if (m <= 0.25) return 'very-resistant'
  if (m < 1) return 'resistant'
  return 'neutral'
})
</script>

<template>
  <span
    class="multiplier-badge text-label-medium"
    :class="`multiplier-badge--${level}`"
    :aria-label="`${multiplier}×`"
  >
    {{ label || '·' }}
  </span>
</template>

<style scoped>
.multiplier-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 22px;
  padding: 0 3px;
  border-radius: 6px;
  color: #fff;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.multiplier-badge--neutral {
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.25;
}

.multiplier-badge--weak {
  background: #ef4444;
}

.multiplier-badge--very-weak {
  background: #b91c1c;
}

.multiplier-badge--resistant {
  background: #22c55e;
}

.multiplier-badge--very-resistant {
  background: #15803d;
}

.multiplier-badge--immune {
  background: #6b7280;
}
</style>
