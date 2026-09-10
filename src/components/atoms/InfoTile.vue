<script setup lang="ts">
defineProps<{ label: string; value?: string }>()
</script>

<template>
  <div class="info-tile">
    <span class="text-label-medium info-tile__label">{{ label }}</span>
    <div class="text-body-large font-weight-medium">
      <slot>{{ value ?? '—' }}</slot>
    </div>
  </div>
</template>

<style scoped>
.info-tile__label {
  display: block;
  opacity: 0.6;
  margin-bottom: 2px;
}
</style>
