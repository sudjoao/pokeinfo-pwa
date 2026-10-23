<script setup lang="ts">
import { computed, defineAsyncComponent, ref, useTemplateRef } from 'vue'
import { mdiMagnify } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import { useMountOnOpen } from '@/composables/useMountOnOpen'

// Sob demanda: o v-menu puxaria VMenu + VOverlay (~11 KB gz) para a abertura do app.
const RecentSearchMenu = defineAsyncComponent(() => import('./RecentSearchMenu.vue'))

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
const menuMounted = useMountOnOpen(showRecent)

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
    <RecentSearchMenu
      v-if="menuMounted && recent?.length"
      :open="showRecent"
      :activator="root"
      :recent="recent"
      @pick="pick"
      @clear="emit('clearRecent')"
    />
  </div>
</template>
