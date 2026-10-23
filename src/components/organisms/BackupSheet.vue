<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { mdiContentCopy, mdiDownload, mdiQrcode, mdiShareVariant, mdiUpload } from '@mdi/js'
import type { BackupSummary } from '@/composables/useBackup'
import { useOverlayFocusReturn } from '@/composables/useOverlayFocusReturn'

const props = defineProps<{
  summary: BackupSummary
  /** Web Share API disponível (iPhone, Android). */
  canShare: boolean
  /** Link de backup atual (calculado só quando o QR é pedido). */
  link: () => string
}>()

const open = defineModel<boolean>({ required: true })
useOverlayFocusReturn(open)

const emit = defineEmits<{
  download: []
  copyLink: []
  share: []
  importFile: [file: File]
}>()

const { t } = useI18n()

const fileInput = useTemplateRef<HTMLInputElement>('file')

/** QR do link de backup, para passar os dados apontando a câmera do outro aparelho. */
const qr = ref<string | null>(null)
const qrStatus = ref<'hidden' | 'loading' | 'ready' | 'too-big'>('hidden')

async function toggleQr(): Promise<void> {
  if (qrStatus.value !== 'hidden') {
    qrStatus.value = 'hidden'
    qr.value = null
    return
  }
  qrStatus.value = 'loading'
  try {
    // Biblioteca pequena (~10 KB), baixada só aqui.
    const { renderSVG } = await import('uqr')
    qr.value = renderSVG(props.link(), { ecc: 'L', border: 2, pixelSize: 4 })
    qrStatus.value = 'ready'
  } catch {
    // Link maior que a capacidade do QR (muitos jogos marcados): o arquivo ou o link resolvem.
    qrStatus.value = 'too-big'
  }
}

watch(open, (value) => {
  if (!value) {
    qrStatus.value = 'hidden'
    qr.value = null
  }
})

function onFile(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) emit('importFile', file)
}
</script>

<template>
  <v-bottom-sheet v-model="open" inset :aria-label="t('backup.title')">
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
        <v-btn
          variant="text"
          :prepend-icon="mdiQrcode"
          class="align-self-start"
          :aria-expanded="qrStatus !== 'hidden'"
          @click="toggleQr"
        >
          {{ qrStatus === 'hidden' ? t('backup.showQr') : t('backup.hideQr') }}
        </v-btn>
        <div
          v-if="qrStatus === 'ready' && qr"
          class="backup-qr"
          role="img"
          :aria-label="t('backup.qrLabel')"
        >
          <!-- SVG gerado localmente pelo uqr a partir do próprio link: não há conteúdo de terceiros. -->
          <div class="backup-qr__code" v-html="qr" />
          <p class="text-body-small mb-0">{{ t('backup.qrHint') }}</p>
        </div>
        <p v-else-if="qrStatus === 'too-big'" class="text-body-small mb-0">
          {{ t('backup.qrTooBig') }}
        </p>
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

<style scoped>
.backup-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* Fundo branco fixo: câmeras leem mal QR em tema escuro (módulos claros sobre fundo escuro). */
.backup-qr__code {
  width: min(280px, 80vw);
  padding: 8px;
  border-radius: 12px;
  background: #fff;
}

.backup-qr__code :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
}
</style>
