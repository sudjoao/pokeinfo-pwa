<script setup lang="ts">
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { announce } from '@/composables/useAnnouncer'
import { noticeTimeout } from '@/utils/notice'

const props = defineProps<{
  /** Texto do aviso; null fecha. */
  text: string | null
  location?: 'top' | 'bottom'
  color?: string
  /** Padrão: 4 s, ou até fechar quando o texto é longo (ver noticeTimeout). */
  timeout?: number
}>()

const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()

// O anúncio vai pela região viva do App.vue; o texto visual fica fora da árvore de acessibilidade
// para não ser lido duas vezes nos leitores que percebem a região do próprio snackbar.
watch(
  () => props.text,
  (text) => text && announce(text),
  { immediate: true },
)
</script>

<template>
  <v-snackbar
    :model-value="text !== null"
    :timeout="timeout ?? noticeTimeout(text)"
    :location="location"
    :color="color"
    @update:model-value="(open: boolean) => !open && emit('close')"
  >
    <span aria-hidden="true">{{ text }}</span>
    <template #actions>
      <v-btn variant="text" @click="emit('close')">{{ t('common.close') }}</v-btn>
    </template>
  </v-snackbar>
</template>
