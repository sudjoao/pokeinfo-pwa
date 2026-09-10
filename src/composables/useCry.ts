import { computed, ref } from 'vue'
import { cryUrl } from '@/utils/pokemon'
import { readStorage, writeStorage } from '@/utils/storage'

const MUTED_KEY = 'pokeinfo:cry-muted:v1'
/** Janela em que um autoplay é ignorado se o mesmo Pokémon acabou de ser tocado pelo gesto. */
const RECENT_PLAY_WINDOW_MS = 4000
/** Quantos gritos ficam decodificados em memória (blobs de ~7 KB). */
const MAX_CACHED_CRIES = 30
/** Cache antigo do service worker que guardava respostas parciais; apagado uma vez. */
const LEGACY_SW_CACHE = 'pokeapi-cries'

/**
 * WAV de silêncio (16 amostras). Tocá-lo dentro do gesto do usuário "desbloqueia" o
 * elemento de áudio no Safari/iOS, que passa a aceitar play() fora de um gesto.
 */
const SILENT_WAV =
  'data:audio/wav;base64,UklGRjQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YRAAAAAAAAAAAAAAAAAAAAAAAAAA'

/**
 * Os cries da PokéAPI existem só em .ogg (Vorbis). Safari suporta a partir do
 * macOS 14.1 / iOS 17.4 (completo no 18.4); em navegadores sem suporte escondemos o botão.
 */
const supported =
  typeof Audio !== 'undefined' && new Audio().canPlayType('audio/ogg; codecs="vorbis"') !== ''

// Estado compartilhado por todos os usos do composable: um único elemento de áudio
// (desbloqueado no primeiro gesto do usuário) e um cache de blobs já baixados.
//
// Por que baixar com fetch e tocar por blob em vez de apontar o src para a URL?
// O Safari pede mídia por faixas (Range) e o service worker guardava a primeira
// resposta parcial, servindo 2 bytes para todas as faixas seguintes: o som nunca tocava.
// Com fetch a resposta é sempre completa e cacheável de forma íntegra.
let audio: HTMLAudioElement | null = null
const muted = ref(readStorage<boolean>(MUTED_KEY) ?? false)
const playing = ref(false)
let lastPlay: { id: number; at: number } | null = null
/** Id do último pedido; respostas de pedidos anteriores são descartadas. */
let requestedId: number | null = null

const blobUrls = new Map<number, string>()
const downloads = new Map<number, Promise<string | null>>()

if (typeof caches !== 'undefined') {
  caches.delete(LEGACY_SW_CACHE).catch(() => {})
}

function debug(...args: unknown[]): void {
  if (import.meta.env.DEV) console.debug('[cry]', ...args)
}

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio()
    audio.preload = 'auto'
    audio.addEventListener('play', () => (playing.value = true))
    audio.addEventListener('pause', () => (playing.value = false))
    audio.addEventListener('ended', () => (playing.value = false))
    if (import.meta.env.DEV)
      (window as unknown as { __cryAudio: HTMLAudioElement }).__cryAudio = audio
  }
  return audio
}

function rememberBlob(id: number, objectUrl: string): void {
  blobUrls.delete(id)
  blobUrls.set(id, objectUrl)
  while (blobUrls.size > MAX_CACHED_CRIES) {
    const [oldestId, oldestUrl] = blobUrls.entries().next().value as [number, string]
    blobUrls.delete(oldestId)
    URL.revokeObjectURL(oldestUrl)
  }
}

/** Baixa o .ogg (passa pelo service worker) e devolve uma URL de blob, ou null se falhar. */
function download(id: number, url: string): Promise<string | null> {
  const cached = blobUrls.get(id)
  if (cached) {
    rememberBlob(id, cached)
    return Promise.resolve(cached)
  }
  const pending = downloads.get(id)
  if (pending) return pending

  const request = fetch(url, { mode: 'cors' })
    .then(async (response) => {
      if (!response.ok) throw new Error(`status ${response.status}`)
      const blob = await response.blob()
      if (!blob.size) throw new Error('resposta vazia')
      const objectUrl = URL.createObjectURL(blob)
      rememberBlob(id, objectUrl)
      return objectUrl
    })
    .catch((error: unknown) => {
      debug('download falhou', id, error instanceof Error ? error.message : error)
      return null
    })
    .finally(() => downloads.delete(id))
  downloads.set(id, request)
  return request
}

function start(element: HTMLAudioElement, id: number, src: string): Promise<boolean> {
  element.pause()
  element.src = src
  element.currentTime = 0
  return element
    .play()
    .then(() => {
      debug('tocando', id)
      return true
    })
    .catch((error: unknown) => {
      debug(
        'play() recusado',
        id,
        error instanceof Error ? `${error.name}: ${error.message}` : error,
      )
      playing.value = false
      return false
    })
}

async function playCry(id: number, url: string, withinGesture: boolean): Promise<boolean> {
  if (!supported || muted.value) {
    debug('ignorado', { id, supported, muted: muted.value })
    return false
  }
  const element = getAudio()
  requestedId = id
  lastPlay = { id, at: Date.now() }

  const cached = blobUrls.get(id)
  if (cached) return start(element, id, cached)

  // Tudo até aqui roda de forma síncrona dentro do clique. Enquanto o arquivo baixa,
  // tocamos um silêncio para o elemento ficar liberado no iOS/Safari.
  if (withinGesture) {
    element.pause()
    element.src = SILENT_WAV
    element.play().catch(() => {})
  }

  const objectUrl = await download(id, url)
  if (!objectUrl || requestedId !== id) return false
  return start(element, id, objectUrl)
}

export function useCry() {
  /**
   * Toca o grito do Pokémon. Deve ser chamado de forma síncrona dentro de um
   * gesto do usuário (clique/toque) para funcionar no iOS. Resolve `false` se
   * o navegador recusar, o download falhar ou não houver suporte.
   */
  function play(id: number, url = cryUrl(id)): Promise<boolean> {
    return playCry(id, url, true)
  }

  /** Tentativa de autoplay ao abrir a tela; pula se o mesmo Pokémon acabou de tocar. */
  function autoPlay(id: number, url?: string | null): Promise<boolean> {
    const recent =
      lastPlay && lastPlay.id === id && Date.now() - lastPlay.at < RECENT_PLAY_WINDOW_MS
    if (recent) return Promise.resolve(false)
    return playCry(id, url ?? cryUrl(id), false)
  }

  function toggleMuted(): void {
    muted.value = !muted.value
    writeStorage(MUTED_KEY, muted.value)
    if (muted.value) audio?.pause()
  }

  return {
    supported,
    muted: computed(() => muted.value),
    playing: computed(() => playing.value),
    play,
    autoPlay,
    toggleMuted,
  }
}
