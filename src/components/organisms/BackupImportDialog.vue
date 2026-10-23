<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { BackupSummary } from '@/composables/useBackup'
import type { ImportMode } from '@/stores/gameSet'

const props = defineProps<{
  summary: BackupSummary | null
  exportedAt: string | null
}>()

const open = defineModel<boolean>({ required: true })

const emit = defineEmits<{ confirm: [mode: ImportMode] }>()

const { t, locale } = useI18n()

const mode = ref<ImportMode>('merge')

const date = computed(() => {
  if (!props.exportedAt) return ''
  const value = new Date(props.exportedAt)
  return Number.isNaN(value.getTime()) ? '' : value.toLocaleDateString(locale.value)
})

function confirm(): void {
  emit('confirm', mode.value)
  open.value = false
}
</script>

<template>
  <v-dialog v-model="open" max-width="480">
    <v-card
      :title="t('backup.importTitle')"
      :subtitle="date ? t('backup.importFrom', { date }) : undefined"
    >
      <v-card-text class="d-flex flex-column ga-3">
        <p v-if="summary" class="text-label-large mb-0">
          {{ t('backup.summary', { ...summary }) }}
        </p>
        <v-radio-group v-model="mode" hide-details>
          <v-radio value="merge">
            <template #label>
              <div>
                <div>{{ t('backup.merge') }}</div>
                <div class="text-body-small opacity-70">{{ t('backup.mergeHint') }}</div>
              </div>
            </template>
          </v-radio>
          <v-radio value="replace" class="mt-2">
            <template #label>
              <div>
                <div>{{ t('backup.replace') }}</div>
                <div class="text-body-small opacity-70">{{ t('backup.replaceHint') }}</div>
              </div>
            </template>
          </v-radio>
        </v-radio-group>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="open = false">{{ t('backup.cancel') }}</v-btn>
        <v-btn color="primary" variant="flat" @click="confirm">{{ t('backup.confirm') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
