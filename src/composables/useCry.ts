import { computed, ref } from 'vue'
import { cryUrl } from '@/utils/pokemon'
import { readStorage, writeStorage } from '@/utils/storage'

const MUTED_KEY = 'pokeinfo:cry-muted:v1'
/** Janela em que um autoplay é ignorado se o mesmo Pokémon acabou de ser tocado pelo gesto. */
const RECENT_PLAY_WINDOW_MS = 4000

/**
 * Os cries da PokéAPI existem só em .ogg (Vorbis). Safari suporta a partir do
 * macOS 14.1 / iOS 17.4 (completo no 18.4); em navegadores sem suporte escondemos o botão.
 */
const supported =
  typeof Audio !== 'undefined' && new Audio().canPlayType('audio/ogg; codecs="vorbis"') !== ''

// Estado compartilhado por todos os usos do composable: um único elemento de áudio
// "desbloqueado" no primeiro gesto do usuário (exigência do iOS) e reaproveitado depois.
let audio: HTMLAudioElement | null = null
const muted = ref(readStorage<boolean>(MUTED_KEY) ?? false)
const playing = ref(false)
let lastPlay: { id: number; at: number } | null = null

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio()
    audio.preload = 'auto'
    audio.addEventListener('play', () => (playing.value = true))
    audio.addEventListener('pause', () => (playing.value = false))
    audio.addEventListener('ended', () => (playing.value = false))
  }
  return audio
}

export function useCry() {
  /**
   * Toca o grito do Pokémon. Deve ser chamado de forma síncrona dentro de um
   * gesto do usuário (clique/toque) para funcionar no iOS. Resolve `false` se
   * o navegador recusar ou não houver suporte.
   */
  function play(id: number, url = cryUrl(id)): Promise<boolean> {
    if (!supported || muted.value) return Promise.resolve(false)
    const element = getAudio()
    element.pause()
    element.src = url
    element.currentTime = 0
    lastPlay = { id, at: Date.now() }
    return element
      .play()
      .then(() => true)
      .catch(() => {
        playing.value = false
        return false
      })
  }

  /** Tentativa de autoplay ao abrir a tela; pula se o mesmo Pokémon acabou de tocar. */
  function autoPlay(id: number, url?: string | null): Promise<boolean> {
    const recent =
      lastPlay && lastPlay.id === id && Date.now() - lastPlay.at < RECENT_PLAY_WINDOW_MS
    if (recent) return Promise.resolve(false)
    return play(id, url ?? undefined)
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
