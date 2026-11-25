<script setup lang="ts">
import { computed, nextTick, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOverlayFocusReturn } from '@/composables/useOverlayFocusReturn'

/**
 * A cópia automática falhou (permissão, navegador antigo): mostra o texto já selecionado para a
 * pessoa copiar à mão. Aberto enquanto `text` não for null.
 */
const text = defineModel<string | null>({ default: null })

const { t } = useI18n()
const open = computed({
  get: () => text.value !== null,
  set: (value: boolean) => {
    if (!value) text.value = null
  },
})
useOverlayFocusReturn(open)

const area = useTemplateRef<{ $el: HTMLElement }>('area')

watch(text, async (value) => {
  if (value === null) return
  await nextTick()
  const input = area.value?.$el.querySelector('textarea')
  input?.focus()
  input?.select()
})
</script>

<template>
  <v-dialog v-model="open" max-width="480">
    <v-card :title="t('common.copyManually')">
      <v-card-text>
        <v-textarea
          ref="area"
          :model-value="text ?? ''"
          readonly
          auto-grow
          rows="3"
          max-rows="8"
          variant="outlined"
          hide-details
          :aria-label="t('common.copyManually')"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="text = null">{{ t('common.close') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
