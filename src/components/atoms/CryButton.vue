<script setup lang="ts">
import { mdiVolumeHigh } from '@mdi/js'
import { useI18n } from 'vue-i18n'

defineProps<{ playing?: boolean }>()

const emit = defineEmits<{ play: [] }>()

const { t } = useI18n()
</script>

<template>
  <v-btn
    :icon="mdiVolumeHigh"
    variant="tonal"
    color="primary"
    :class="{ 'cry-button--playing': playing }"
    :aria-label="t('cry.play')"
    :title="t('cry.playShort')"
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
