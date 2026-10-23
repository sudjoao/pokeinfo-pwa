import { computed, ref } from 'vue'
import { cryUrl } from '@/utils/pokemon'
import { initialSoundEnabled } from '@/utils/sound'
import { readStorage, removeStorage, writeStorage } from '@/utils/storage'

const SOUND_KEY = 'pokeinfo:sound:v1'
/** Chave antiga (guardava "mudo", com o som ligado por padrão); migrada e apagada no carregamento. */
const LEGACY_MUTED_KEY = 'pokeinfo:cry-muted:v1'
const HINT_KEY = 'pokeinfo:sound-hint:v1'
/** Janela em que um autoplay é ignorado se o mesmo Pokémon acabou de ser tocado pelo gesto. */
const RECENT_PLAY_WINDOW_MS = 4000
/** Quantos gritos ficam decodificados em memória (blobs de ~7 KB). */
const MAX_CACHED_CRIES = 30

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
const legacyMuted = readStorage<boolean>(LEGACY_MUTED_KEY)
const enabled = ref(initialSoundEnabled(readStorage<boolean>(SOUND_KEY), legacyMuted))
if (legacyMuted !== null) {
  writeStorage(SOUND_KEY, enabled.value)
  removeStorage(LEGACY_MUTED_KEY)
}
/** Se a pessoa já viu (e fechou) o aviso "toque aqui para ativar os sons". */
const hintSeen = ref(readStorage<boolean>(HINT_KEY) ?? false)
const playing = ref(false)
let lastPlay: { id: number; at: number } | null = null
/** Id do último pedido; respostas de pedidos anteriores são descartadas. */
let requestedId: number | null = null

const blobUrls = new Map<number, string>()
const downloads = new Map<number, Promise<string | null>>()

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

/** Toca o silêncio dentro do gesto para o elemento ficar liberado no iOS/Safari. */
function unlock(element: HTMLAudioElement): void {
  element.pause()
  element.src = SILENT_WAV
  element.play().catch(() => {})
}

async function playCry(
  id: number,
  url: string,
  withinGesture: boolean,
  force = false,
): Promise<boolean> {
  if (!supported || (!enabled.value && !force)) {
    debug('ignorado', { id, supported, enabled: enabled.value })
    return false
  }
  const element = getAudio()
  requestedId = id
  lastPlay = { id, at: Date.now() }

  const cached = blobUrls.get(id)
  if (cached) return start(element, id, cached)

  // Tudo até aqui roda de forma síncrona dentro do clique. Enquanto o arquivo baixa,
  // tocamos um silêncio para o elemento ficar liberado no iOS/Safari.
  if (withinGesture) unlock(element)

  const objectUrl = await download(id, url)
  if (!objectUrl || requestedId !== id) return false
  return start(element, id, objectUrl)
}

export function useCry() {
  /**
   * Som implícito de um gesto (tocar no card, ir ao vizinho): só toca com o som ligado. Deve ser
   * chamado de forma síncrona dentro do clique/toque para funcionar no iOS. Resolve `false` se
   * o som estiver desligado, o navegador recusar, o download falhar ou não houver suporte.
   */
  function play(id: number, url = cryUrl(id)): Promise<boolean> {
    return playCry(id, url, true)
  }

  /** Pedido explícito de ouvir o grito (botão do alto-falante): toca mesmo com o som desligado. */
  function listen(id: number, url = cryUrl(id)): Promise<boolean> {
    return playCry(id, url, true, true)
  }

  /** Tentativa de autoplay ao abrir a tela; pula se o mesmo Pokémon acabou de tocar. */
  function autoPlay(id: number, url?: string | null): Promise<boolean> {
    const recent =
      lastPlay && lastPlay.id === id && Date.now() - lastPlay.at < RECENT_PLAY_WINDOW_MS
    if (recent) return Promise.resolve(false)
    return playCry(id, url ?? cryUrl(id), false)
  }

  /** Liga/desliga os sons. Chamado no clique: ao ligar, já desbloqueia o áudio no iOS. */
  function setEnabled(value: boolean): void {
    enabled.value = value
    writeStorage(SOUND_KEY, value)
    if (value && supported) unlock(getAudio())
    else audio?.pause()
    dismissHint()
  }

  function dismissHint(): void {
    if (hintSeen.value) return
    hintSeen.value = true
    writeStorage(HINT_KEY, true)
  }

  return {
    supported,
    enabled: computed(() => enabled.value),
    playing: computed(() => playing.value),
    hintSeen: computed(() => hintSeen.value),
    play,
    listen,
    autoPlay,
    setEnabled,
    toggleEnabled: () => setEnabled(!enabled.value),
    dismissHint,
  }
}
