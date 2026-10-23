<script setup lang="ts">
import { mdiCheck } from '@mdi/js'
import { useI18n } from 'vue-i18n'
import type { Locale } from '@/plugins/i18n'
import { useOverlayFocusReturn } from '@/composables/useOverlayFocusReturn'

defineProps<{
  locales: readonly Locale[]
  selected: Locale
}>()

const emit = defineEmits<{ select: [locale: Locale] }>()

const open = defineModel<boolean>({ default: false })
useOverlayFocusReturn(open)

const { t } = useI18n()

function choose(locale: Locale): void {
  emit('select', locale)
  open.value = false
}
</script>

<template>
  <v-bottom-sheet v-model="open" inset :aria-label="t('language.title')">
    <v-card class="language-sheet" rounded="t-xl">
      <v-card-title class="text-title-large pt-4">{{ t('language.title') }}</v-card-title>
      <v-list
        class="language-sheet__list"
        density="comfortable"
        nav
        role="radiogroup"
        :aria-label="t('language.title')"
      >
        <v-list-item
          v-for="locale in locales"
          :key="locale"
          :active="locale === selected"
          role="radio"
          :aria-checked="locale === selected"
          :title="t(`language.${locale}`)"
          :subtitle="t(`language.${locale}-hint`)"
          :append-icon="locale === selected ? mdiCheck : undefined"
          :lang="locale"
          color="primary"
          rounded="lg"
          @click="choose(locale)"
        />
      </v-list>
    </v-card>
  </v-bottom-sheet>
</template>

<style scoped>
.language-sheet__list {
  padding-bottom: calc(8px + var(--safe-bottom));
}

/* No item ativo o texto fica na cor primária; o esmaecimento padrão do subtítulo derrubava o contraste. */
.language-sheet__list :deep(.v-list-item--active .v-list-item-subtitle) {
  opacity: 1;
}
</style>
