<script setup lang="ts">
import { mdiMagnify } from '@mdi/js'
import { useI18n } from 'vue-i18n'

const model = defineModel<string>({ default: '' })

const { t } = useI18n()
</script>

<template>
  <v-text-field
    v-model="model"
    :prepend-inner-icon="mdiMagnify"
    :placeholder="t('home.searchPlaceholder')"
    :aria-label="t('home.searchLabel')"
    type="search"
    inputmode="search"
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck="false"
    clearable
    hide-details
  />
</template>
