<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { mdiHistory, mdiMagnify } from '@mdi/js'
import { useI18n } from 'vue-i18n'

const model = defineModel<string>({ default: '' })
/** Textos do campo; sem eles, os da busca de pokémon da Home. */
const props = defineProps<{
  placeholder?: string
  label?: string
  /** Buscas recentes, mostradas num menu ao focar o campo vazio (só a Home usa). */
  recent?: readonly string[]
}>()

const emit = defineEmits<{ clearRecent: [] }>()

const { t } = useI18n()

const root = useTemplateRef<HTMLElement>('root')
const focused = ref(false)
const showRecent = computed(() => focused.value && !model.value && !!props.recent?.length)

function pick(term: string): void {
  model.value = term
  focused.value = false
}

// O blur vem antes do clique no item: ao sair do campo, espera um instante para o clique contar.
function onFocused(value: boolean): void {
  if (value) focused.value = true
  else setTimeout(() => (focused.value = false), 150)
}
</script>

<template>
  <div ref="root">
    <v-text-field
      v-model="model"
      :prepend-inner-icon="mdiMagnify"
      :placeholder="placeholder ?? t('home.searchPlaceholder')"
      :aria-label="label ?? t('home.searchLabel')"
      type="search"
      inputmode="search"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      clearable
      hide-details
      @update:focused="onFocused"
    />
    <v-menu
      v-if="recent?.length"
      :model-value="showRecent"
      :activator="root ?? undefined"
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
        <v-list-item
          v-for="term in recent"
          :key="term"
          :prepend-icon="mdiHistory"
          :title="term"
          @mousedown.prevent
          @click="pick(term)"
        />
        <v-list-item
          :title="t('recent.clearSearches')"
          class="text-primary"
          @mousedown.prevent
          @click="emit('clearRecent')"
        />
      </v-list>
    </v-menu>
  </div>
</template>
