<script setup lang="ts">
/**
 * Card com título e esqueleto, no lugar de um card carregado sob demanda (`defineAsyncComponent`)
 * enquanto o chunk dele baixa: sem isso a coluna ficava vazia e a página pulava quando o card
 * chegava.
 */
defineProps<{
  title: string
  /** Tipo do `v-skeleton-loader` (padrão: parágrafo). */
  type?: string
}>()
</script>

<template>
  <v-card>
    <v-card-title tag="h2" class="text-title-medium">{{ title }}</v-card-title>
    <v-skeleton-loader aria-hidden="true" :type="type ?? 'paragraph'" />
  </v-card>
</template>
