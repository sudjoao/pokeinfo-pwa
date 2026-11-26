<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { mdiExportVariant, mdiPlusBoxOutline } from '@mdi/js'
import { useOverlayFocusReturn } from '@/composables/useOverlayFocusReturn'

/** Como instalar no iPhone (o Safari não tem prompt): Compartilhar → Adicionar à Tela de Início. */
const open = defineModel<boolean>({ required: true })
useOverlayFocusReturn(open)

const { t } = useI18n()
</script>

<template>
  <v-bottom-sheet v-model="open" inset :aria-label="t('install.title')">
    <v-card rounded="t-xl" :title="t('install.title')">
      <v-card-text>
        <p class="text-body-medium">{{ t('install.iosIntro') }}</p>
        <ol class="install-steps text-body-medium">
          <li>
            <v-icon :icon="mdiExportVariant" size="small" class="me-2" aria-hidden="true" />
            {{ t('install.iosStep1') }}
          </li>
          <li>
            <v-icon :icon="mdiPlusBoxOutline" size="small" class="me-2" aria-hidden="true" />
            {{ t('install.iosStep2') }}
          </li>
        </ol>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" variant="flat" @click="open = false">{{ t('common.done') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-bottom-sheet>
</template>

<style scoped>
.install-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 20px;
  margin: 0;
}
</style>
