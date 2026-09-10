<script setup lang="ts">
import { computed } from 'vue'
import { formatDexNumber } from '@/utils/pokemon'

const props = defineProps<{
  id: number
  /** Casas com zero à esquerda: 4 na Pokédex Nacional, 3 nas regionais. */
  digits?: number
}>()

const label = computed(() => formatDexNumber(props.id, props.digits ?? 4))
</script>

<template>
  <span class="dex-number text-label-medium">{{ label }}</span>
</template>

<style scoped>
.dex-number {
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
}
</style>
