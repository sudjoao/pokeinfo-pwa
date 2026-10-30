<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { TeamActions } from '@/composables/useTeamActions'
import AppNotice from '@/components/molecules/AppNotice.vue'
import ShowdownImportDialog from '@/components/organisms/ShowdownImportDialog.vue'
import ShareImageDialog from '@/components/organisms/ShareImageDialog.vue'

/** Avisos (time completo, desfazer…) e diálogos (Showdown, imagem) das ações do painel do time. */
const props = defineProps<{ actions: TeamActions }>()

const { t } = useI18n()
const a = props.actions
</script>

<template>
  <AppNotice
    :text="a.fullNotice.value ? t('team.full') : null"
    :timeout="2500"
    location="top"
    @close="a.fullNotice.value = false"
  />
  <AppNotice :text="a.notice.value" location="top" @close="a.notice.value = null" />
  <AppNotice
    :text="a.undo.value?.text ?? null"
    location="top"
    :action-label="t('common.undo')"
    @action="a.applyUndo"
    @close="a.undo.value = null"
  />
  <ShowdownImportDialog v-model="a.importOpen.value" @import="a.pasteShowdown" />
  <ShareImageDialog
    v-model="a.shareImage.open.value"
    :status="a.shareImage.status.value"
    :url="a.shareImage.url.value"
    :alt="a.shareImageAlt.value"
    @share="a.sendShareImage"
  />
</template>
