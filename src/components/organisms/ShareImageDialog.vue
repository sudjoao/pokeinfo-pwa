<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useOverlayFocusReturn } from '@/composables/useOverlayFocusReturn'

defineProps<{
  status: 'loading' | 'ready' | 'error'
  url: string | null
  /** Descrição da imagem para leitores de tela ("Imagem do time com Garchomp, …"). */
  alt: string
}>()

const open = defineModel<boolean>({ required: true })
useOverlayFocusReturn(open)

const emit = defineEmits<{ share: [] }>()

const { t } = useI18n()
</script>

<template>
  <v-dialog v-model="open" max-width="640" :aria-label="t('shareImage.title')">
    <v-card :title="t('shareImage.title')">
      <v-card-text>
        <v-skeleton-loader v-if="status === 'loading'" aria-hidden="true" type="image" />
        <p v-else-if="status === 'error'" class="mb-0">{{ t('shareImage.error') }}</p>
        <img v-else-if="url" :src="url" :alt="alt" class="share-image__preview" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="open = false">{{ t('common.close') }}</v-btn>
        <v-btn color="primary" variant="flat" :disabled="status !== 'ready'" @click="emit('share')">
          {{ t('common.share') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.share-image__preview {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 12px;
}
</style>
