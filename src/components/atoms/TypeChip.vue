<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { PokemonType } from '@/types/pokemon'
import { TYPE_COLORS, TYPE_TEXT_COLORS } from '@/utils/pokemon'

defineProps<{
  type: PokemonType
  /** Os tamanhos do v-chip usados no app; o padrão é o `small` dos defaults do Vuetify. */
  size?: 'x-small' | 'small'
}>()

const { t } = useI18n()
</script>

<template>
  <!--
    Um <span> com o visual do v-chip (flat, label) e não o componente: a lista chega a mais de mil
    cards com até dois tipos cada, e cada v-chip é uma instância a mais com seus computeds.
  -->
  <span
    class="type-chip"
    :class="`type-chip--${size ?? 'small'}`"
    :style="{ backgroundColor: TYPE_COLORS[type], color: TYPE_TEXT_COLORS[type] }"
  >
    {{ t(`type.${type}`) }}
  </span>
</template>

<style scoped>
/* Mesmas medidas do v-chip (VChip.css): label, density default, sem borda nem sombra. */
.type-chip {
  display: inline-flex;
  align-items: center;
  position: relative;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  vertical-align: middle;
  white-space: nowrap;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.type-chip--x-small {
  height: 20px;
  padding: 0 8px;
  font-size: 0.625rem;
}

.type-chip--small {
  height: 26px;
  padding: 0 10px;
  font-size: 0.75rem;
}

@media (forced-colors: active) {
  .type-chip {
    border: thin solid;
  }
}
</style>
