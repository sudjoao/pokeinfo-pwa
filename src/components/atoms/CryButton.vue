<script setup lang="ts">
import { mdiVolumeHigh, mdiVolumeOff } from '@mdi/js'

defineProps<{
  playing?: boolean
  muted?: boolean
}>()

const emit = defineEmits<{ play: [] }>()
</script>

<template>
  <v-btn
    :icon="muted ? mdiVolumeOff : mdiVolumeHigh"
    variant="tonal"
    color="primary"
    :class="{ 'cry-button--playing': playing }"
    :aria-label="muted ? 'Som desativado' : 'Ouvir o grito do Pokémon'"
    :title="muted ? 'Som desativado' : 'Ouvir o grito'"
    @click="emit('play')"
  />
</template>

<style scoped>
.cry-button--playing {
  animation: cry-pulse 0.6s ease-in-out infinite alternate;
}

@keyframes cry-pulse {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.12);
  }
}
</style>
