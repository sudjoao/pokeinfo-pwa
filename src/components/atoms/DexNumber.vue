<script setup lang="ts">
import { computed } from 'vue'
import { formatDexNumber } from '@/utils/pokemon'

const props = defineProps<{ id: number }>()

const label = computed(() => formatDexNumber(props.id))
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
