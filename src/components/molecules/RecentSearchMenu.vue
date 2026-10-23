<script setup lang="ts">
import { mdiHistory } from '@mdi/js'
import { useI18n } from 'vue-i18n'

/** Menu de buscas recentes do SearchField (carregado só quando há o que mostrar). */
defineProps<{
  open: boolean
  activator: HTMLElement | null
  recent: readonly string[]
}>()

const emit = defineEmits<{ pick: [term: string]; clear: [] }>()

const { t } = useI18n()
</script>

<template>
  <v-menu
    :model-value="open"
    :activator="activator ?? undefined"
    :open-on-click="false"
    :close-on-content-click="false"
    location="bottom start"
    :scrim="false"
    :persistent="true"
    :capture-focus="false"
    :retain-focus="false"
    disable-initial-focus
  >
    <v-list density="compact" :aria-label="t('recent.searches')">
      <v-list-subheader>{{ t('recent.searches') }}</v-list-subheader>
      <!-- mousedown.prevent: o campo não perde o foco antes do clique contar. -->
      <v-list-item
        v-for="term in recent"
        :key="term"
        :prepend-icon="mdiHistory"
        :title="term"
        @mousedown.prevent
        @click="emit('pick', term)"
      />
      <v-list-item
        :title="t('recent.clearSearches')"
        class="text-primary-safe"
        @mousedown.prevent
        @click="emit('clear')"
      />
    </v-list>
  </v-menu>
</template>
