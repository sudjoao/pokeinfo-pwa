<script setup lang="ts">
import { mdiPokeball } from '@mdi/js'

defineProps<{
  src: string
  alt: string
  size?: number | string
}>()
</script>

<template>
  <v-img :src="src" :alt="alt" :height="size ?? 120" contain :draggable="false">
    <template #placeholder>
      <div class="d-flex align-center justify-center fill-height">
        <v-progress-circular indeterminate size="24" width="2" color="primary" />
      </div>
    </template>
    <template #error>
      <div class="d-flex align-center justify-center fill-height">
        <v-icon :icon="mdiPokeball" size="48" color="grey" />
      </div>
    </template>
  </v-img>
</template>
