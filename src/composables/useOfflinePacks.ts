import { ref } from 'vue'
import { mapLimit } from '@/utils/async'
import {
  chainUrl,
  OFFLINE_CACHES,
  OFFLINE_PACKS,
  packUrls,
  type OfflinePack,
} from '@/utils/offline'

/** Downloads ao mesmo tempo: o suficiente para ir rápido sem martelar a PokéAPI (fair use). */
const CONCURRENCY = 5

export interface OfflineProgress {
  done: number
  total: number
  failed: number
}

// Estado no módulo: o download continua mesmo com a sheet fechada, e reabrir mostra o progresso.
const running = ref(false)
const progress = ref<OfflineProgress>({ done: 0, total: 0, failed: 0 })
const saved = ref<Record<OfflinePack, number>>({ data: 0, images: 0, cries: 0 })
const usage = ref<{ used: number; quota: number } | null>(null)
let controller: AbortController | null = null

const supported = typeof window !== 'undefined' && 'caches' in window

async function refreshStatus(): Promise<void> {
  if (!supported) return
  const counts = await Promise.all(
    OFFLINE_PACKS.map(
      async (pack) => (await (await caches.open(OFFLINE_CACHES[pack])).keys()).length,
    ),
  )
  saved.value = Object.fromEntries(OFFLINE_PACKS.map((pack, i) => [pack, counts[i]!])) as Record<
    OfflinePack,
    number
  >
  const estimate = await navigator.storage?.estimate?.().catch(() => null)
  usage.value =
    estimate?.usage != null ? { used: estimate.usage, quota: estimate.quota ?? 0 } : null
}

/** Guarda a resposta no cache do pacote; devolve a resposta (para a espécie levar à cadeia). */
async function store(cache: Cache, url: string, signal: AbortSignal): Promise<Response | null> {
  const cached = await cache.match(url)
  if (cached) return cached
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  await cache.put(url, response.clone())
  return response
}

/**
 * Baixa os pacotes escolhidos para as espécies informadas, pulando o que já está salvo (dá para
 * retomar depois de cancelar). Falhas isoladas não param o resto: entram em `failed`.
 */
async function download(packs: readonly OfflinePack[], ids: readonly number[]): Promise<void> {
  if (!supported || running.value) return
  controller = new AbortController()
  const { signal } = controller
  running.value = true
  const tasks = packs.flatMap((pack) =>
    ids.flatMap((id) => packUrls(pack, id).map((url) => ({ pack, url }))),
  )
  progress.value = { done: 0, total: tasks.length, failed: 0 }
  const packCaches = Object.fromEntries(
    await Promise.all(packs.map(async (pack) => [pack, await caches.open(OFFLINE_CACHES[pack])])),
  ) as Record<OfflinePack, Cache>

  try {
    await mapLimit(tasks, CONCURRENCY, async ({ pack, url }) => {
      if (signal.aborted) return
      try {
        const response = await store(packCaches[pack], url, signal)
        // A espécie diz qual é a cadeia de evolução: baixa junto, no mesmo pacote.
        if (response && url.includes('/pokemon-species/')) {
          const chain = chainUrl(await response.clone().json())
          if (chain) await store(packCaches[pack], chain, signal)
        }
        progress.value = { ...progress.value, done: progress.value.done + 1 }
      } catch {
        if (signal.aborted) return
        progress.value = {
          ...progress.value,
          done: progress.value.done + 1,
          failed: progress.value.failed + 1,
        }
      }
    })
  } finally {
    running.value = false
    controller = null
    await refreshStatus()
  }
}

function cancel(): void {
  controller?.abort()
}

async function clear(): Promise<void> {
  cancel()
  await Promise.all(OFFLINE_PACKS.map((pack) => caches.delete(OFFLINE_CACHES[pack])))
  await refreshStatus()
}

/** Download opcional de tudo para usar sem internet (ver utils/offline.ts). */
export function useOfflinePacks() {
  return { supported, running, progress, saved, usage, refreshStatus, download, cancel, clear }
}
