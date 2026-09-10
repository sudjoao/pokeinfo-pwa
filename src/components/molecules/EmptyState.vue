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
