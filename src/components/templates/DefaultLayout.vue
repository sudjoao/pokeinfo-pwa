<script setup lang="ts">
import AppHeader from '@/components/organisms/AppHeader.vue'

defineProps<{ extensionHeight?: number }>()
</script>

<template>
  <AppHeader title="PokéInfo" :extension-height="extensionHeight">
    <template v-if="$slots.actions" #actions>
      <slot name="actions" />
    </template>
    <template v-if="$slots.header" #extension>
      <slot name="header" />
    </template>
  </AppHeader>

  <v-main class="default-layout">
    <v-container class="default-layout__content" max-width="1280">
      <slot />
    </v-container>
  </v-main>
</template>

<style scoped>
.default-layout__content {
  padding-bottom: calc(16px + var(--safe-bottom));
  padding-left: calc(16px + var(--safe-left));
  padding-right: calc(16px + var(--safe-right));
}
</style>
