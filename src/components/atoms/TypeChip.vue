<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { PokemonType } from '@/types/pokemon'
import { TYPE_COLORS, TYPE_TEXT_COLORS } from '@/utils/pokemon'

defineProps<{ type: PokemonType }>()

const { t } = useI18n()
</script>

<template>
  <v-chip
    :color="TYPE_COLORS[type]"
    variant="flat"
    class="type-chip"
    :style="{ color: TYPE_TEXT_COLORS[type] }"
  >
    {{ t(`type.${type}`) }}
  </v-chip>
</template>

<style scoped>
.type-chip {
  font-weight: 600;
  letter-spacing: 0.02em;
}
</style>
