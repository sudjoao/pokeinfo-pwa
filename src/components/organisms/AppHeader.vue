<script setup lang="ts">
import { mdiArrowLeft, mdiMenu } from '@mdi/js'
import { useAppMenu } from '@/composables/useAppMenu'
import { useI18n } from 'vue-i18n'

defineProps<{
  title: string
  /** Mostra um botão de voltar no lugar do ícone do app. */
  back?: boolean
  /** Altura da extensão (px); precisa bater com o conteúdo para o v-main compensar. */
  extensionHeight?: number
}>()

const emit = defineEmits<{ back: [] }>()

const { t } = useI18n()
const { drawer } = useAppMenu()
</script>

<template>
  <v-app-bar color="primary" flat class="app-header" :extension-height="extensionHeight ?? 48">
    <template #prepend>
      <v-btn
        v-if="back"
        :icon="mdiArrowLeft"
        :aria-label="t('common.back')"
        @click="emit('back')"
      />
      <v-btn
        v-else
        :icon="mdiMenu"
        :aria-label="t('menu.open')"
        aria-haspopup="dialog"
        @click="drawer = true"
      />
    </template>
    <v-app-bar-title tag="h1" tabindex="-1" class="app-header__title font-weight-bold">
      {{ title }}
    </v-app-bar-title>
    <template v-if="$slots.actions" #append>
      <slot name="actions" />
    </template>
    <template v-if="$slots.extension" #extension>
      <div class="app-header__extension w-100 px-4 pb-3">
        <slot name="extension" />
      </div>
    </template>
  </v-app-bar>
</template>

<style scoped>
.app-header {
  padding-top: var(--safe-top);
}

.app-header__title {
  margin-block: 0;
}

.app-header__extension {
  max-width: 1280px;
  margin: 0 auto;
}
</style>
