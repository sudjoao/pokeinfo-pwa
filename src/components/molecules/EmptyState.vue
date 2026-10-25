<script setup lang="ts">
import { onMounted } from 'vue'
import { mdiAlertCircleOutline, mdiPokeball, mdiRefresh } from '@mdi/js'
import { announce } from '@/composables/useAnnouncer'

const props = defineProps<{
  variant?: 'empty' | 'error'
  title: string
  message?: string
  actionLabel?: string
  /** Ícone do botão; padrão: "tentar de novo". */
  actionIcon?: string
}>()

const emit = defineEmits<{ action: [] }>()

// Um erro no lugar do conteúdo (ex.: o detalhe não carregou) precisa ser avisado ao leitor de tela.
onMounted(() => {
  if (props.variant === 'error') announce([props.title, props.message].filter(Boolean).join('. '))
})
</script>

<template>
  <v-empty-state
    :icon="variant === 'error' ? mdiAlertCircleOutline : mdiPokeball"
    :headline="title"
    :text="message"
    :color="variant === 'error' ? 'error' : 'primary'"
  >
    <template v-if="actionLabel" #actions>
      <v-btn
        color="primary"
        variant="tonal"
        :prepend-icon="actionIcon ?? mdiRefresh"
        @click="emit('action')"
      >
        {{ actionLabel }}
      </v-btn>
    </template>
  </v-empty-state>
</template>

<style scoped>
/* O headline padrão do v-empty-state é grande demais para telas de celular. */
:deep(.v-empty-state__headline) {
  font-size: clamp(1.5rem, 7vw, 2.5rem);
  line-height: 1.2;
  overflow-wrap: anywhere;
}
</style>
