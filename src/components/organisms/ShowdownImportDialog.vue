<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useOverlayFocusReturn } from '@/composables/useOverlayFocusReturn'

const open = defineModel<boolean>({ required: true })
useOverlayFocusReturn(open)

const emit = defineEmits<{ import: [text: string] }>()

const { t } = useI18n()

const text = ref('')
watch(open, (value) => {
  if (value) text.value = ''
})

function confirm(): void {
  emit('import', text.value)
  open.value = false
}
</script>

<template>
  <v-dialog v-model="open" max-width="520" :aria-label="t('team.importTitle')">
    <v-card :title="t('team.importTitle')">
      <v-card-text>
        <p class="text-body-medium">{{ t('team.importHint') }}</p>
        <v-textarea
          v-model="text"
          :label="t('team.importLabel')"
          rows="8"
          variant="outlined"
          auto-grow
          hide-details
          autofocus
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="open = false">{{ t('backup.cancel') }}</v-btn>
        <v-btn color="primary" variant="flat" :disabled="!text.trim()" @click="confirm">
          {{ t('backup.confirm') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
