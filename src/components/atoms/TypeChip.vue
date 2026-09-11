<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { PokemonType } from '@/types/pokemon'
import { TYPE_COLORS } from '@/utils/pokemon'

defineProps<{ type: PokemonType }>()

const { t } = useI18n()
</script>

<template>
  <v-chip :color="TYPE_COLORS[type]" variant="flat" class="type-chip">
    {{ t(`type.${type}`) }}
  </v-chip>
</template>

<style scoped>
.type-chip {
  color: #fff;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.25);
}
</style>
