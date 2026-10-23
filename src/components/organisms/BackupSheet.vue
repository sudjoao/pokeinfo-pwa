<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiContentCopy, mdiDownload, mdiShareVariant, mdiUpload } from '@mdi/js'
import type { BackupSummary } from '@/composables/useBackup'

defineProps<{
  summary: BackupSummary
  /** Web Share API disponível (iPhone, Android). */
  canShare: boolean
}>()

const open = defineModel<boolean>({ required: true })

const emit = defineEmits<{
  download: []
  copyLink: []
  share: []
  importFile: [file: File]
}>()

const { t } = useI18n()

const fileInput = useTemplateRef<HTMLInputElement>('file')

function onFile(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) emit('importFile', file)
}
</script>

<template>
  <v-bottom-sheet v-model="open" inset>
    <v-card rounded="t-xl" :title="t('backup.title')">
      <v-card-text class="d-flex flex-column ga-3">
        <p class="text-body-medium mb-0">{{ t('backup.intro') }}</p>
        <p class="text-label-large mb-0">{{ t('backup.summary', { ...summary }) }}</p>
        <div class="d-flex flex-wrap ga-2">
          <v-btn color="primary" :prepend-icon="mdiDownload" @click="emit('download')">
            {{ t('backup.download') }}
          </v-btn>
          <v-btn variant="tonal" :prepend-icon="mdiUpload" @click="fileInput?.click()">
            {{ t('backup.import') }}
          </v-btn>
          <v-btn variant="tonal" :prepend-icon="mdiContentCopy" @click="emit('copyLink')">
            {{ t('backup.copyLink') }}
          </v-btn>
          <v-btn
            v-if="canShare"
            variant="tonal"
            :prepend-icon="mdiShareVariant"
            @click="emit('share')"
          >
            {{ t('backup.share') }}
          </v-btn>
        </div>
        <p class="text-body-small opacity-70 mb-0">{{ t('backup.linkHint') }}</p>
        <input
          ref="file"
          type="file"
          accept="application/json,.json"
          class="d-none"
          :aria-label="t('backup.import')"
          @change="onFile"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="open = false">{{ t('common.done') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-bottom-sheet>
</template>
