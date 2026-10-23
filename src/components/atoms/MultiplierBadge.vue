<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatMultiplier } from '@/utils/typeChart'

const props = defineProps<{ multiplier: number }>()

const { n } = useI18n()

const label = computed(() => formatMultiplier(props.multiplier))
/** "0,25×" em pt-BR/es (o rótulo visual usa ¼ e ½). */
const spoken = computed(() => `${n(props.multiplier)}×`)

/**
 * Faixa do multiplicador, para a cor: fraqueza em vermelho, resistência em verde, imune em cinza.
 * Os tons foram escurecidos para o texto branco passar de 4,5:1 (o vermelho e o verde claros de antes
 * davam 3,8:1 e 2,3:1).
 */
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
    role="img"
    :aria-label="spoken"
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
  background: #dc2626;
}

.multiplier-badge--very-weak {
  background: #991b1b;
}

.multiplier-badge--resistant {
  background: #15803d;
}

.multiplier-badge--very-resistant {
  background: #14532d;
}

.multiplier-badge--immune {
  background: #4b5563;
}
</style>
