import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { useBackup } from '@/composables/useBackup'
import {
  cloudEnabled,
  getClient,
  hasStoredSession,
  storedSessionUser,
} from '@/services/cloud/client'
import {
  createCollection,
  deleteAccount as deleteRemoteAccount,
  fetchCollection,
  updateCollection,
  type RemoteCollection,
} from '@/services/cloud/collection.service'
import { safeNextPath } from '@/utils/authRedirect'
import { parseBackupData, type BackupData } from '@/utils/backup'
import { onLocalChange, withoutNotify } from '@/utils/localChanges'
import { readStorage, removeStorage, writeStorage } from '@/utils/storage'
import { canonicalData, isEmptyData, mergeData, sameData } from '@/utils/sync'

/** Estado da última sincronização deste aparelho: a `base` da mescla de 3 vias. */
interface SyncState {
  userId: string
  version: number
  base: BackupData
  syncedAt: string
}

export interface AccountUser {
  id: string
  email: string
  name: string
  avatar: string | null
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error'

/** Como juntar na primeira vez em que o aparelho e a conta já têm dados diferentes. */
export type FirstSyncChoice = 'merge' | 'cloud' | 'device'

const SYNC_KEY = 'pokeinfo:sync:v1'
/** Tela para voltar depois do login (o Google só devolve para /auth/callback). */
const NEXT_KEY = 'pokeinfo:auth-next:v1'

/** Espera depois de uma marcação antes de enviar: várias marcações seguidas viram um envio. */
const PUSH_DELAY = 2000
/** Ao voltar para o app, busca o que o outro aparelho mudou se a última sincronização for antiga. */
const PULL_AFTER = 30_000
const RETRY_DELAYS = [15_000, 60_000, 5 * 60_000]
/** Conflitos de versão seguidos (outro aparelho gravando junto) antes de desistir desta rodada. */
const MAX_ATTEMPTS = 3

function toAccountUser(user: User): AccountUser {
  const meta = user.user_metadata as Record<string, unknown>
  const text = (value: unknown) => (typeof value === 'string' ? value : '')
  return {
    id: user.id,
    email: user.email ?? '',
    name: text(meta.full_name) || text(meta.name),
    avatar: text(meta.avatar_url) || text(meta.picture) || null,
  }
}

/**
 * Conta Google (Supabase Auth) e sincronização da coleção. O app continua local-first: tudo é lido
 * e gravado no aparelho, e a conta recebe uma cópia em segundo plano. Uma sincronização lê a linha
 * da conta, mescla em 3 vias com o aparelho (base = última sincronização) e grava os dois lados com
 * trava otimista de versão.
 */
export const useAccountStore = defineStore('account', () => {
  const backup = useBackup()

  // Com sessão salva, a conta aparece já na abertura (sem esperar o SDK, e também offline).
  const stored = cloudEnabled ? storedSessionUser() : null
  const user = shallowRef<AccountUser | null>(stored ? toAccountUser(stored) : null)
  /** Há sessão salva e o SDK ainda está restaurando: o menu mostra "conectando" em vez de "entrar". */
  const restoring = ref(cloudEnabled && hasStoredSession() && !stored)
  const status = ref<SyncStatus>('idle')
  const lastSyncedAt = ref<string | null>(null)
  /** Primeira sincronização com dados dos dois lados: espera a pessoa escolher como juntar. */
  const firstSync = shallowRef<{ local: BackupData; remote: RemoteCollection } | null>(null)
  /** Acabou de voltar do Google com sucesso (o App.vue mostra o aviso e zera). */
  const justSignedIn = ref(false)

  const signedIn = computed(() => user.value !== null)

  let started = false
  let listening = false
  /** Há mudança no aparelho que ainda não foi para a conta. */
  let pending = false
  let pushTimer: ReturnType<typeof setTimeout> | undefined
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let retries = 0
  let running: Promise<void> | null = null
  let again = false

  /**
   * A base fica em memória por aba: ela precisa ser a ancestral da coleção *desta* aba. Lida do disco
   * a cada vez, uma aba com a coleção desatualizada (outra aba marcou algo) acharia que a marcação
   * da outra foi apagada aqui. O disco só serve para começar a sessão seguinte.
   */
  let state: SyncState | null = null

  function readState(userId: string): SyncState | null {
    if (state?.userId === userId) return state
    const saved = readStorage<SyncState>(SYNC_KEY)
    if (saved?.userId !== userId || !Number.isInteger(saved.version)) return null
    state = { ...saved, base: parseBackupData(saved.base) }
    return state
  }

  function writeState(userId: string, version: number, base: BackupData): void {
    const syncedAt = new Date().toISOString()
    state = { userId, version, base: canonicalData(base), syncedAt }
    writeStorage(SYNC_KEY, state)
    lastSyncedAt.value = syncedAt
  }

  /** Troca a coleção do aparelho pela mesclada, sem disparar um novo envio, e grava no disco já. */
  function applyLocal(data: BackupData): void {
    withoutNotify(() => backup.restore(data, 'replace'))
    backup.flush()
  }

  function onAuthChange(event: AuthChangeEvent, session: Session | null): void {
    const previous = user.value?.id
    user.value = session?.user ? toAccountUser(session.user) : null
    restoring.value = false
    if (!user.value) {
      status.value = 'idle'
      firstSync.value = null
      return
    }
    if (previous !== user.value.id || !lastSyncedAt.value)
      lastSyncedAt.value = readState(user.value.id)?.syncedAt ?? null
    // Fora do callback: o Supabase pede para não chamar o cliente de dentro dele (trava a sessão).
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') setTimeout(() => void sync(), 0)
  }

  async function listen(): Promise<void> {
    const client = await getClient()
    if (listening) return
    listening = true
    client.auth.onAuthStateChange(onAuthChange)
  }

  /** Chamado uma vez no App.vue. Só baixa o SDK se este aparelho já tem sessão. */
  function start(): void {
    if (!cloudEnabled || started) return
    started = true
    onLocalChange(schedulePush)
    window.addEventListener('online', () => {
      if (pending) void sync()
    })
    document.addEventListener('visibilitychange', () => {
      if (!user.value) return
      if (document.visibilityState === 'hidden') {
        // Saindo do app (trocar de app no iPhone): envia já o que estava esperando o debounce.
        if (pending) void sync()
        return
      }
      const last = lastSyncedAt.value ? Date.parse(lastSyncedAt.value) : 0
      if (Date.now() - last > PULL_AFTER) void sync()
    })
    if (hasStoredSession()) {
      listen().catch(() => {
        // SDK não carregou (offline e ainda fora do cache): a conta segue visível, sem sincronizar.
        restoring.value = false
        status.value = 'offline'
      })
    }
  }

  function schedulePush(): void {
    if (!user.value) return
    pending = true
    clearTimeout(pushTimer)
    pushTimer = setTimeout(() => void sync(), PUSH_DELAY)
  }

  function scheduleRetry(): void {
    clearTimeout(retryTimer)
    const delay = RETRY_DELAYS[Math.min(retries, RETRY_DELAYS.length - 1)]!
    retries++
    retryTimer = setTimeout(() => void sync(), delay)
  }

  /** Uma sincronização por vez; pedidos no meio viram uma rodada a mais no fim. */
  function sync(): Promise<void> {
    if (!user.value || firstSync.value) return Promise.resolve()
    if (running) {
      again = true
      return running
    }
    clearTimeout(pushTimer)
    clearTimeout(retryTimer)
    running = runSync().finally(() => {
      running = null
      if (again) {
        again = false
        void sync()
      }
    })
    return running
  }

  async function runSync(): Promise<void> {
    const userId = user.value!.id
    if (!navigator.onLine) {
      status.value = 'offline'
      return
    }
    status.value = 'syncing'
    pending = false
    try {
      const client = await getClient()
      let base = readState(userId)?.base ?? null
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const remote = await fetchCollection(client, userId)
        if (user.value?.id !== userId) return
        // Lido depois da resposta e sem await até o applyLocal: uma marcação feita enquanto a
        // requisição estava no ar entra na mescla em vez de ser sobrescrita.
        backup.flush()
        const local = backup.data()

        if (!remote) {
          const version = await createCollection(client, userId, local)
          if (version === null) continue
          writeState(userId, version, local)
          return finish()
        }

        if (
          !base &&
          !isEmptyData(local) &&
          !isEmptyData(remote.data) &&
          !sameData(local, remote.data)
        ) {
          firstSync.value = { local, remote }
          status.value = 'idle'
          return
        }

        const merged = mergeData(base, local, remote.data)
        if (!sameData(merged, local)) applyLocal(merged)
        let version = remote.version
        if (!sameData(merged, remote.data)) {
          const saved = await updateCollection(client, userId, merged, remote.version)
          if (saved === null) {
            // Outro aparelho gravou entre a leitura e a escrita: a versão dele descende da que
            // lemos, então ela vira a base da próxima tentativa.
            base = remote.data
            continue
          }
          version = saved
        }
        writeState(userId, version, merged)
        return finish()
      }
      throw new Error('Too many concurrent writes')
    } catch {
      pending = true
      status.value = navigator.onLine ? 'error' : 'offline'
      scheduleRetry()
    }
  }

  function finish(): void {
    retries = 0
    status.value = 'synced'
  }

  /** Resposta da pessoa no diálogo da primeira sincronização. */
  function resolveFirstSync(choice: FirstSyncChoice): void {
    const pendingChoice = firstSync.value
    if (!pendingChoice || !user.value) return
    firstSync.value = null
    const { remote } = pendingChoice
    const local = backup.data()
    const result =
      choice === 'merge'
        ? mergeData(null, local, remote.data)
        : choice === 'cloud'
          ? remote.data
          : local
    if (!sameData(result, local)) applyLocal(result)
    // Base = o que está na conta: a sincronização a seguir envia só a diferença escolhida.
    writeState(user.value.id, remote.version, remote.data)
    void sync()
  }

  /** Vai para o Google; a volta é pela tela /auth/callback. */
  async function signIn(next: string): Promise<void> {
    writeStorage(NEXT_KEY, safeNextPath(next))
    await listen()
    const client = await getClient()
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Deixa escolher a conta (quem tem mais de uma conta Google no aparelho).
        queryParams: { prompt: 'select_account' },
      },
    })
    if (error) throw error
  }

  /** Troca o código que o Google devolveu por uma sessão. Devolve a tela para onde voltar. */
  async function completeSignIn(params: URLSearchParams): Promise<string> {
    const next = safeNextPath(readStorage<string>(NEXT_KEY))
    removeStorage(NEXT_KEY)
    const code = params.get('code')
    if (!code) throw new Error(params.get('error_description') ?? 'Missing authorization code')
    await listen()
    const client = await getClient()
    const { error } = await client.auth.exchangeCodeForSession(code)
    if (error) throw error
    justSignedIn.value = true
    return next
  }

  async function signOut(): Promise<void> {
    if (pending && navigator.onLine) await sync()
    clearTimeout(pushTimer)
    clearTimeout(retryTimer)
    const client = await getClient()
    // Só este aparelho: o outro continua conectado. A coleção fica no aparelho.
    await client.auth.signOut({ scope: 'local' })
    user.value = null
    status.value = 'idle'
    firstSync.value = null
  }

  async function deleteAccount(): Promise<void> {
    const client = await getClient()
    await deleteRemoteAccount(client)
    state = null
    removeStorage(SYNC_KEY)
    await client.auth.signOut({ scope: 'local' }).catch(() => {})
    user.value = null
    status.value = 'idle'
    lastSyncedAt.value = null
  }

  return {
    enabled: cloudEnabled,
    user,
    signedIn,
    restoring,
    status,
    lastSyncedAt,
    firstSync,
    justSignedIn,
    start,
    sync,
    resolveFirstSync,
    signIn,
    completeSignIn,
    signOut,
    deleteAccount,
  }
})
