<script setup lang="ts">
import { mdiArrowLeft, mdiPokeball } from '@mdi/js'

defineProps<{
  title: string
  /** Mostra um botão de voltar no lugar do ícone do app. */
  back?: boolean
  /** Altura da extensão (px); precisa bater com o conteúdo para o v-main compensar. */
  extensionHeight?: number
}>()

const emit = defineEmits<{ back: [] }>()
</script>

<template>
  <v-app-bar color="primary" flat class="app-header" :extension-height="extensionHeight ?? 48">
    <template #prepend>
      <v-btn v-if="back" :icon="mdiArrowLeft" aria-label="Voltar" @click="emit('back')" />
      <v-icon v-else :icon="mdiPokeball" size="28" class="ms-2" />
    </template>
    <v-app-bar-title class="font-weight-bold">{{ title }}</v-app-bar-title>
    <template v-if="$slots.actions" #append>
      <slot name="actions" />
    </template>
    <template v-if="$slots.extension" #extension>
      <div class="app-header__extension w-100 px-4 pb-3">
        <slot name="extension" />
      </div>
    </template>
  </v-app-bar>
</template>

<style scoped>
.app-header {
  padding-top: var(--safe-top);
}

.app-header__extension {
  max-width: 1280px;
  margin: 0 auto;
}
</style>
