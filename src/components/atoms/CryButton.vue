<script setup lang="ts">
import { mdiVolumeHigh, mdiVolumeOff } from '@mdi/js'
import { useI18n } from 'vue-i18n'

defineProps<{
  playing?: boolean
  muted?: boolean
}>()

const emit = defineEmits<{ play: [] }>()

const { t } = useI18n()
</script>

<template>
  <v-btn
    :icon="muted ? mdiVolumeOff : mdiVolumeHigh"
    variant="tonal"
    color="primary"
    :class="{ 'cry-button--playing': playing }"
    :aria-label="muted ? t('cry.muted') : t('cry.play')"
    :title="muted ? t('cry.muted') : t('cry.playShort')"
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
