<script setup lang="ts">
import { computed, defineAsyncComponent, ref, shallowRef, watch } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAppMenu } from '@/composables/useAppMenu'
import { useLocale } from '@/composables/useLocale'
import { useThemePreference } from '@/composables/useThemePreference'
import { useOnline } from '@/composables/useOnline'
import { summarize, useBackup, type BackupSummary } from '@/composables/useBackup'
import { announcement } from '@/composables/useAnnouncer'
import AppNotice from '@/components/molecules/AppNotice.vue'
import { decodeBackupParam, MAX_BACKUP_BYTES, parseBackup, type Backup } from '@/utils/backup'
import type { ImportMode } from '@/stores/gameSet'
import AppMenu from '@/components/organisms/AppMenu.vue'
import { useMountOnOpen } from '@/composables/useMountOnOpen'
import { useSyncStatusText } from '@/composables/useSyncStatusText'
import { useAccountStore, type FirstSyncChoice } from '@/stores/account'
import { storeToRefs } from 'pinia'
import { nativePageTransition } from '@/router/viewTransition'

// Sheets do menu: raros, carregados só na primeira abertura (BackupImportDialog também pode abrir
// por um link ?backup=, e aí carrega na hora).
const LanguageSheet = defineAsyncComponent(() => import('@/components/organisms/LanguageSheet.vue'))
const AboutSheet = defineAsyncComponent(() => import('@/components/organisms/AboutSheet.vue'))
const BackupSheet = defineAsyncComponent(() => import('@/components/organisms/BackupSheet.vue'))
const OfflineSheet = defineAsyncComponent(() => import('@/components/organisms/OfflineSheet.vue'))
const BackupImportDialog = defineAsyncComponent(
  () => import('@/components/organisms/BackupImportDialog.vue'),
)
const AccountSheet = defineAsyncComponent(() => import('@/components/organisms/AccountSheet.vue'))
const FirstSyncDialog = defineAsyncComponent(
  () => import('@/components/organisms/FirstSyncDialog.vue'),
)

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const menu = useAppMenu()
const languageMounted = useMountOnOpen(menu.languageOpen)
const aboutMounted = useMountOnOpen(menu.aboutOpen)
const backupMounted = useMountOnOpen(menu.backupOpen)
const offlineMounted = useMountOnOpen(menu.offlineOpen)
const accountMounted = useMountOnOpen(menu.accountOpen)
const { locale, locales, setLocale } = useLocale()
const { preference: theme, setPreference: setTheme } = useThemePreference()
const backup = useBackup()
/**
 * O resumo reencoda todos os jogos: só é recalculado com o sheet aberto. Fechado, mantém o último
 * valor (para a animação de saída) e não reage a cada captura marcada.
 */
let lastSummary: BackupSummary | null = null
const backupSummary = computed(() => {
  if (menu.backupOpen.value || !lastSummary) lastSummary = backup.summary.value
  return lastSummary
})
const online = useOnline()
/** Aviso de offline: abre a cada queda de conexão e pode ser fechado. */
const offlineOpen = ref(!online.value)
watch(online, (value) => (offlineOpen.value = !value))

// Conta Google e sincronização (o botão do cabeçalho some quando o build não tem Supabase).
const account = useAccountStore()
const { user: accountUser, status: syncStatus, lastSyncedAt, firstSync } = storeToRefs(account)
account.start()
const syncStatusText = useSyncStatusText(syncStatus, lastSyncedAt, online)
const accountBusy = ref<'signIn' | 'signOut' | 'delete' | null>(null)

function signIn(): void {
  accountBusy.value = 'signIn'
  // Em caso de sucesso a página vai para o Google; o "carregando" fica até lá.
  account.signIn(route.fullPath).catch(() => {
    accountBusy.value = null
    notice.value = t('account.signInError')
  })
}

function runAccountAction(kind: 'signOut' | 'delete', action: () => Promise<void>, done: string) {
  accountBusy.value = kind
  action()
    .then(() => {
      menu.accountOpen.value = false
      notice.value = t(done)
    })
    .catch(() => (notice.value = t('account.actionError')))
    .finally(() => (accountBusy.value = null))
}

watch(
  () => account.justSignedIn,
  (value) => {
    if (!value) return
    account.justSignedIn = false
    notice.value = t('account.signedIn')
  },
)

/** Resumos do aparelho e da conta para o diálogo da primeira sincronização. */
const firstSyncSummaries = computed(() =>
  firstSync.value
    ? { device: summarize(firstSync.value.local), cloud: summarize(firstSync.value.remote.data) }
    : null,
)
const firstSyncOpen = ref(false)
watch(firstSyncSummaries, (value) => (firstSyncOpen.value = value !== null), { immediate: true })

function chooseFirstSync(choice: FirstSyncChoice): void {
  account.resolveFirstSync(choice)
}

const notice = ref<string | null>(null)
const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

/** "Surpreenda-me": uma espécie qualquer (1..1025), como o botão da Pokédex oficial. */
function openRandom(): void {
  const id = 1 + Math.floor(Math.random() * 1025)
  router.push({ name: 'pokemon', params: { id } })
}

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
const importMounted = useMountOnOpen(importOpen)

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
  // Nem lê um arquivo grande demais para ser backup (evita travar a aba com um arquivo errado).
  if (file.size > MAX_BACKUP_BYTES) return askImport(null)
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
      @open-offline="menu.offlineOpen.value = true"
      @open-about="menu.aboutOpen.value = true"
      @random="openRandom"
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
      <!-- Lista ↔ detalhe com View Transition: a troca é imediata e o navegador anima (viewTransition.ts). -->
      <Transition name="page" :css="!nativePageTransition">
        <KeepAlive :include="['HomeView']">
          <component :is="Component" />
        </KeepAlive>
      </Transition>
    </RouterView>

    <LanguageSheet
      v-if="languageMounted"
      v-model="menu.languageOpen.value"
      :locales="locales"
      :selected="locale"
      @select="setLocale"
    />
    <AboutSheet v-if="aboutMounted" v-model="menu.aboutOpen.value" />
    <OfflineSheet v-if="offlineMounted" v-model="menu.offlineOpen.value" />
    <BackupSheet
      v-if="backupMounted"
      v-model="menu.backupOpen.value"
      :summary="backupSummary"
      :can-share="canShare"
      :link="backup.link"
      @download="backup.downloadFile"
      @copy-link="copyBackupLink"
      @share="shareBackupLink"
      @import-file="importFile"
    />
    <BackupImportDialog
      v-if="importMounted"
      v-model="importOpen"
      :summary="pending ? summarize(pending) : null"
      :exported-at="pending?.exportedAt ?? null"
      @confirm="confirmImport"
    />
    <AccountSheet
      v-if="accountMounted"
      v-model="menu.accountOpen.value"
      :user="accountUser"
      :status="syncStatus"
      :status-text="syncStatusText"
      :online="online"
      :busy="accountBusy"
      @sign-in="signIn"
      @sync-now="account.sync()"
      @sign-out="runAccountAction('signOut', account.signOut, 'account.signedOut')"
      @delete-account="runAccountAction('delete', account.deleteAccount, 'account.deleted')"
    />
    <FirstSyncDialog
      v-if="firstSyncSummaries"
      v-model="firstSyncOpen"
      :device="firstSyncSummaries.device"
      :cloud="firstSyncSummaries.cloud"
      @choose="chooseFirstSync"
    />
    <AppNotice
      :text="offlineOpen ? t('app.offline') : null"
      :timeout="-1"
      location="top"
      color="surface-variant"
      @close="offlineOpen = false"
    />
    <AppNotice :text="notice" @close="notice = null" />
    <p class="d-sr-only" aria-live="polite" aria-atomic="true">{{ announcement }}</p>
  </v-app>
</template>
