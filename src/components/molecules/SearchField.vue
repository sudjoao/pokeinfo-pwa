<script setup lang="ts">
import { mdiMagnify } from '@mdi/js'

const model = defineModel<string>({ default: '' })
</script>

<template>
  <v-text-field
    v-model="model"
    :prepend-inner-icon="mdiMagnify"
    placeholder="Buscar por nome ou número"
    aria-label="Buscar Pokémon"
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
