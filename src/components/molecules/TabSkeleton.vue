<script setup lang="ts">
/**
 * Esqueleto das abas carregadas sob demanda (Rotas, Líderes, Time): sem ele a aba ficava em branco
 * enquanto o chunk baixava na primeira abertura.
 */
defineProps<{
  /** Tipo do v-skeleton-loader; o padrão imita uma lista de painéis. */
  type?: string
}>()
</script>

<template>
  <v-skeleton-loader aria-hidden="true" :type="type ?? 'list-item-two-line@6'" />
</template>
