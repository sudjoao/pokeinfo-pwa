<script setup lang="ts">
defineProps<{
  label: string
  value?: string
  /** Linha secundária pequena abaixo do valor (ex.: a altura em pés e polegadas). */
  hint?: string
}>()
</script>

<template>
  <div class="info-tile">
    <span class="text-label-medium info-tile__label">{{ label }}</span>
    <div class="text-body-large font-weight-medium">
      <slot>{{ value ?? '—' }}</slot>
    </div>
    <span v-if="hint" class="text-label-small info-tile__hint">{{ hint }}</span>
  </div>
</template>

<style scoped>
.info-tile__label {
  display: block;
  opacity: 0.7;
  margin-bottom: 2px;
}

.info-tile__hint {
  display: block;
  opacity: 0.7;
}
</style>
