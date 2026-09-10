<script setup lang="ts">
import { mdiAlertCircleOutline, mdiPokeball, mdiRefresh } from '@mdi/js'

defineProps<{
  variant?: 'empty' | 'error'
  title: string
  message?: string
  actionLabel?: string
}>()

const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <v-empty-state
    :icon="variant === 'error' ? mdiAlertCircleOutline : mdiPokeball"
    :headline="title"
    :text="message"
    :color="variant === 'error' ? 'error' : 'primary'"
  >
    <template v-if="actionLabel" #actions>
      <v-btn color="primary" variant="tonal" :prepend-icon="mdiRefresh" @click="emit('action')">
        {{ actionLabel }}
      </v-btn>
    </template>
  </v-empty-state>
</template>

<style scoped>
/* O headline padrão do v-empty-state é grande demais para telas de celular. */
:deep(.v-empty-state__headline) {
  font-size: clamp(1.5rem, 7vw, 2.5rem);
  line-height: 1.2;
  overflow-wrap: anywhere;
}
</style>
