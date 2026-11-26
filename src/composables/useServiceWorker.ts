import { ref } from 'vue'
import { registerSW } from 'virtual:pwa-register'
import { whenIdle } from '@/utils/idle'

/** De quanto em quanto tempo o app volta a procurar uma versão nova ao ganhar foco. */
const CHECK_INTERVAL = 60 * 60 * 1000
/** Guarda de recarga única quando um chunk da versão antiga sumiu do servidor. */
const RELOAD_KEY = 'pokeinfo:chunk-reload'

/** Há uma versão nova do app esperando (o service worker novo instalou e aguarda). */
const needRefresh = ref(false)
let update: ((reloadPage?: boolean) => Promise<void>) | null = null

/**
 * Registra o service worker quando o navegador fica ocioso (o precache de ~1 MB não disputa a
 * primeira visita) e avisa quando há versão nova. Com `registerType: 'prompt'` a versão nova só
 * assume ao tocar em "Atualizar": no iPhone instalado o app quase nunca é fechado de verdade,
 * então sem isso uma atualização podia esperar dias.
 */
export function startServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return
  whenIdle(() => {
    update = registerSW({
      onNeedRefresh: () => (needRefresh.value = true),
      onRegisteredSW(_url, registration) {
        if (!registration) return
        // Uma SPA quase não navega, e o navegador só confere o sw.js nas navegações: ao voltar
        // ao app (no máximo uma vez por hora), confere por conta própria.
        let checkedAt = Date.now()
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState !== 'visible') return
          if (Date.now() - checkedAt < CHECK_INTERVAL) return
          checkedAt = Date.now()
          registration.update().catch(() => {})
        })
      },
    })
  })
}

/**
 * Aplica a versão nova: o service worker que esperava assume (skipWaiting) e a página recarrega
 * quando ele passa a controlá-la. O recarregar é daqui, não do workbox-window: ele só recarrega
 * quando a atualização foi achada no primeiro minuto depois do registro, e o caso comum é o
 * contrário (o app aberto há horas e o deploy depois).
 */
export function applyUpdate(): void {
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), {
    once: true,
  })
  update?.(true).catch(() => {})
}

/**
 * Um chunk sob demanda da versão antiga pode não existir mais depois de um deploy (abrir uma tela
 * nova com a aba aberta há dias): recarrega uma vez para pegar a versão nova em vez de uma tela
 * quebrada. A guarda evita recarregar em loop se o problema for outro.
 */
export function reloadOnStaleChunk(): void {
  window.addEventListener('vite:preloadError', (event) => {
    let reloaded = false
    try {
      reloaded = sessionStorage.getItem(RELOAD_KEY) === '1'
      if (!reloaded) sessionStorage.setItem(RELOAD_KEY, '1')
    } catch {
      // Sem sessionStorage (modo privado antigo): recarrega assim mesmo, uma vez por carga.
    }
    if (reloaded) return
    event.preventDefault()
    window.location.reload()
  })
}

export function useServiceWorker() {
  return { needRefresh, applyUpdate }
}
