<script setup lang="ts">
import type { GameDex } from '@/data/games'
import { useDexLabel } from '@/composables/useDexLabel'

defineProps<{
  dexes: GameDex[]
  selected: string
}>()

const emit = defineEmits<{ select: [slug: string] }>()

const { dexLabel } = useDexLabel()
</script>

<template>
  <v-chip
    v-for="dex in dexes"
    :key="dex.slug"
    size="default"
    :variant="dex.slug === selected ? 'flat' : 'tonal'"
    class="dex-chip flex-shrink-0"
    :class="{ 'dex-chip--selected': dex.slug === selected }"
    :aria-pressed="dex.slug === selected"
    @click="emit('select', dex.slug)"
  >
    {{ dexLabel(dex) }}
  </v-chip>
</template>

<style scoped>
/* As chips ficam sobre o cabeçalho colorido: a selecionada inverte as cores para se destacar. */
.dex-chip--selected {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
}
</style>
