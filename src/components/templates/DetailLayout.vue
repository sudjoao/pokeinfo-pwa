<script setup lang="ts">
import AppHeader from '@/components/organisms/AppHeader.vue'

defineProps<{
  title: string
  /** Altura da extensão do cabeçalho (px), quando o slot `header` é usado. */
  extensionHeight?: number
}>()

const emit = defineEmits<{ back: [] }>()
</script>

<template>
  <AppHeader :title="title" back :extension-height="extensionHeight" @back="emit('back')">
    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>
    <template v-if="$slots.header" #extension>
      <slot name="header" />
    </template>
  </AppHeader>

  <v-main class="detail-layout">
    <v-container class="detail-layout__content" max-width="1280">
      <slot />
    </v-container>
  </v-main>
</template>

<style scoped>
.detail-layout__content {
  padding-bottom: calc(16px + var(--safe-bottom));
  padding-left: calc(16px + var(--safe-left));
  padding-right: calc(16px + var(--safe-right));
}
</style>
