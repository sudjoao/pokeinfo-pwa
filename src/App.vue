<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppMenu } from '@/composables/useAppMenu'
import { useLocale } from '@/composables/useLocale'
import { useThemePreference } from '@/composables/useThemePreference'
import { summarize, useBackup } from '@/composables/useBackup'
import { decodeBackupParam, parseBackup, type Backup } from '@/utils/backup'
import type { ImportMode } from '@/stores/gameSet'
import AppMenu from '@/components/organisms/AppMenu.vue'
import LanguageSheet from '@/components/organisms/LanguageSheet.vue'
import AboutSheet from '@/components/organisms/AboutSheet.vue'
import BackupSheet from '@/components/organisms/BackupSheet.vue'
import BackupImportDialog from '@/components/organisms/BackupImportDialog.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const menu = useAppMenu()
const { locale, locales, setLocale } = useLocale()
const { preference: theme, setPreference: setTheme } = useThemePreference()
const backup = useBackup()

const notice = ref<string | null>(null)
const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

function copyBackupLink(): void {
  navigator.clipboard
    .writeText(backup.link())
    .then(() => (notice.value = t('backup.linkCopied')))
    .catch(() => (notice.value = backup.link()))
}

function shareBackupLink(): void {
  navigator.share({ title: t('backup.title'), url: backup.link() }).catch(() => {})
}

/** Backup lido de arquivo ou link, aguardando a pessoa confirmar como importar. */
const pending = shallowRef<Backup | null>(null)
const importOpen = ref(false)

function askImport(value: Backup | null): void {
  if (!value) {
    notice.value = t('backup.invalid')
    return
  }
  pending.value = value
  importOpen.value = true
}

function importFile(file: File): void {
  menu.backupOpen.value = false
  file.text().then(
    (text) => askImport(parseBackup(text)),
    () => askImport(null),
  )
}

function confirmImport(mode: ImportMode): void {
  if (!pending.value) return
  backup.restore(pending.value, mode)
  pending.value = null
  notice.value = t('backup.restored')
}

// Link de backup (`/?backup=...`): pergunta como importar e tira o parâmetro da URL (é grande e
// não deve ficar no histórico nem ser compartilhado sem querer junto com um filtro).
watch(
  () => route.query.backup,
  (param) => {
    if (typeof param !== 'string' || !param) return
    askImport(decodeBackupParam(param))
    const query = { ...route.query }
    delete query.backup
    router.replace({ query })
  },
  { immediate: true },
)

/**
 * Pula o cabeçalho (ações, busca e chips de filtro) direto para a lista. É botão, não âncora
 * `#main-content`: o hash entraria na URL e passaria pelo router. Durante a transição entre telas
 * há dois v-main montados; o último é o da tela que está entrando.
 */
function skipToContent(): void {
  const mains = document.querySelectorAll<HTMLElement>('#main-content')
  mains[mains.length - 1]?.focus()
}
</script>

<template>
  <v-app>
    <button type="button" class="skip-link text-label-large" @click="skipToContent">
      {{ t('common.skipToContent') }}
    </button>
    <AppMenu
      v-model="menu.drawer.value"
      :theme="theme"
      @set-theme="setTheme"
      @open-language="menu.languageOpen.value = true"
      @open-backup="menu.backupOpen.value = true"
      @open-about="menu.aboutOpen.value = true"
    />
    <!-- A Home fica em KeepAlive para preservar o scroll infinito e a busca ao voltar do detalhe. -->
    <!--
      Transition fica fora do KeepAlive (ordem exigida pelo Vue Router). Sem mode="out-in": nessa
      versão do vue-router, out-in trava a navegação para as rotas com import() (detalhe e time) —
      o RouterView fica renderizando só o comentário do v-if, sem erro no console. Por isso o
      crossfade é simultâneo: main.css tira a página que está saindo do fluxo (position: absolute)
      pra a que está entrando não pular a página inteira durante os ~180ms de sobreposição.
      Sem :key no component: trocar de Pokémon dentro do detalhe (evolução, anterior/próximo)
      reaproveita a mesma instância de PokemonDetailView de propósito — ver usePokemonDetail.ts —
      então não repete a transição de página aqui; quem dá o feedback visual da troca é a entrada
      do sprite em PokemonArtwork.
    -->
    <RouterView v-slot="{ Component }">
      <Transition name="page">
        <KeepAlive :include="['HomeView']">
          <component :is="Component" />
        </KeepAlive>
      </Transition>
    </RouterView>

    <LanguageSheet
      v-model="menu.languageOpen.value"
      :locales="locales"
      :selected="locale"
      @select="setLocale"
    />
    <AboutSheet v-model="menu.aboutOpen.value" />
    <BackupSheet
      v-model="menu.backupOpen.value"
      :summary="backup.summary.value"
      :can-share="canShare"
      @download="backup.downloadFile"
      @copy-link="copyBackupLink"
      @share="shareBackupLink"
      @import-file="importFile"
    />
    <BackupImportDialog
      v-model="importOpen"
      :summary="pending ? summarize(pending) : null"
      :exported-at="pending?.exportedAt ?? null"
      @confirm="confirmImport"
    />
    <v-snackbar
      :model-value="notice !== null"
      :timeout="4000"
      @update:model-value="(open: boolean) => !open && (notice = null)"
    >
      {{ notice }}
    </v-snackbar>
  </v-app>
</template>
