<script setup lang="ts">
import { mdiPokeball } from '@mdi/js'

defineProps<{
  caught: boolean
  /** Tamanho do botão; o padrão cabe no canto do card e mantém área de toque confortável. */
  size?: 'small' | 'default'
}>()

const emit = defineEmits<{ toggle: [] }>()
</script>

<template>
  <v-btn
    :icon="mdiPokeball"
    :size="size ?? 'small'"
    :variant="caught ? 'flat' : 'text'"
    :color="caught ? 'primary' : undefined"
    class="catch-toggle"
    :class="{ 'catch-toggle--caught': caught }"
    :aria-pressed="caught"
    :aria-label="caught ? 'Desmarcar como capturado' : 'Marcar como capturado'"
    :title="caught ? 'Capturado' : 'Marcar como capturado'"
    @click.stop.prevent="emit('toggle')"
  />
</template>

<style scoped>
.catch-toggle {
  opacity: 0.4;
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.catch-toggle--caught {
  opacity: 1;
}

.catch-toggle:active {
  transform: scale(0.9);
}
</style>
