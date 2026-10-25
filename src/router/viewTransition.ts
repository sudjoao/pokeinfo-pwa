import { nextTick, ref } from 'vue'
import { START_LOCATION, type RouteLocationNormalized, type Router } from 'vue-router'
import { appleWebKit } from '@/utils/platform'

/**
 * Transição "compartilhada" entre a lista e o detalhe: o artwork do card voa até o topo do
 * detalhe (e volta ao card no "voltar"), com a View Transitions API (Safari 18+, Chrome 111+).
 * Sem suporte, com movimento reduzido ou no gesto de voltar do iOS (que já anima a troca de página),
 * fica a transição de página do App.vue. No Safari (ver `appleWebKit`) a troca é imediata.
 */

/** Enquanto true, o <Transition> de página do App.vue troca as telas sem CSS: quem anima é o navegador (ou ninguém). */
export const nativePageTransition = ref(false)

const ARTWORK_NAME = 'pokemon-artwork'
/** Classe no <html> que mostra o artwork do detalhe já no primeiro quadro (sem a entrada própria). */
const ACTIVE_CLASS = 'artwork-transition'
/**
 * Classe da volta à lista: os cards (com `content-visibility: auto`) são medidos de verdade antes de
 * a posição ser restaurada. Sem isso, com o desenho pausado pela transição, os cards acima da tela
 * ficavam com a altura estimada e a lista escorregava ~400 px ao terminar.
 */
const RESTORING_CLASS = 'list-restoring'
/** Quanto a troca de tela pode esperar pela ficha e pela imagem do detalhe antes de animar. */
const WAIT_BUDGET_MS = 300

// O voltar por gesto (Safari) já desliza a página: animar de novo por cima fica duplicado. O
// listener é registrado antes do router (este módulo é avaliado antes do createRouter), então o
// valor está certo quando os guards do popstate rodam.
let browserAnimated = false
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', (event) => {
    browserAnimated = Boolean(
      (event as PopStateEvent & { hasUAVisualTransition?: boolean }).hasUAVisualTransition,
    )
  })
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function pokemonIdOf(route: RouteLocationNormalized): number | null {
  const id = Number(route.params.id)
  return Number.isInteger(id) && id > 0 ? id : null
}

function isVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect()
  return rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0
}

function cardArtwork(id: number): HTMLElement | null {
  const img = document.querySelector<HTMLElement>(`[data-pokemon-id="${id}"] .pokemon-artwork__img`)
  return img && isVisible(img) ? img : null
}

function heroArtwork(): HTMLImageElement | null {
  return document.querySelector<HTMLImageElement>('[data-hero-artwork] .pokemon-artwork__img')
}

/** Espera a ficha montar o artwork do detalhe e a imagem decodificar, dentro do prazo. */
async function heroReady(deadline: number): Promise<HTMLImageElement | null> {
  let img = heroArtwork()
  while (!img && performance.now() < deadline) {
    await sleep(16)
    img = heroArtwork()
  }
  if (img && !img.complete) {
    await Promise.race([img.decode().catch(() => {}), sleep(deadline - performance.now())])
  }
  return img
}

function canAnimate(to: RouteLocationNormalized, from: RouteLocationNormalized): boolean {
  if (typeof document.startViewTransition !== 'function') return false
  if (from === START_LOCATION || browserAnimated) return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  return isListDetail(to, from)
}

function isListDetail(to: RouteLocationNormalized, from: RouteLocationNormalized): boolean {
  return (
    (from.name === 'home' && to.name === 'pokemon') ||
    (from.name === 'pokemon' && to.name === 'home')
  )
}

/** Resolve quando a navegação termina (afterEach); o prazo cobre uma cancelada ou redirecionada. */
function navigationEnd(router: Router): Promise<void> {
  return Promise.race([
    new Promise<void>((resolve) => {
      const stop = router.afterEach(() => {
        stop()
        resolve()
      })
    }),
    sleep(1000),
  ])
}

export function installArtworkTransition(router: Router): void {
  router.afterEach(() => {
    browserAnimated = false
  })

  router.beforeResolve((to, from) => {
    if (appleWebKit && from !== START_LOCATION && isListDetail(to, from)) {
      // WebKit da Apple (ver utils/platform.ts): quando a troca muda a rolagem da janela (a lista
      // rolada vai para o detalhe no topo, ou volta restaurando a posição), o compositor só aplica a
      // rolagem nova alguns quadros depois de começar a desenhar a View Transition, e nesse
      // intervalo a camada dela fica fora da tela: a tela some inteira (ou metade). O crossfade do
      // App.vue também não serve: a página que sai aparece já rolada para o topo, com o cabeçalho
      // cortado. Medido no Safari do simulador do iPhone gravando a tela; sem mudar a rolagem não
      // acontece, mas lista↔detalhe quase sempre muda.
      nativePageTransition.value = true
      void navigationEnd(router)
        .then(() => nextTick())
        .then(() => {
          nativePageTransition.value = false
        })
      return
    }
    if (!canAnimate(to, from)) return
    const forward = to.name === 'pokemon'
    const id = pokemonIdOf(forward ? to : from)
    if (id === null) return

    const named: HTMLElement[] = []
    const name = (element: HTMLElement | null) => {
      if (!element) return
      element.style.viewTransitionName = ARTWORK_NAME
      named.push(element)
    }
    // Estado de saída: o card tocado (ida) ou o artwork do detalhe (volta).
    name(forward ? cardArtwork(id) : heroArtwork())

    const navigated = navigationEnd(router)

    nativePageTransition.value = true
    document.documentElement.classList.add(ACTIVE_CLASS)
    return new Promise<void>((resolve) => {
      const transition = document.startViewTransition(async () => {
        const deadline = performance.now() + WAIT_BUDGET_MS
        resolve()
        if (!forward) document.documentElement.classList.add(RESTORING_CLASS)
        await navigated
        await nextTick()
        // O router restaura a posição da lista logo depois do nextTick.
        await sleep(0)
        for (const element of named.splice(0)) element.style.viewTransitionName = ''
        name(forward ? await heroReady(deadline) : cardArtwork(id))
      })
      transition.finished.finally(() => {
        for (const element of named.splice(0)) element.style.viewTransitionName = ''
        document.documentElement.classList.remove(ACTIVE_CLASS, RESTORING_CLASS)
        nativePageTransition.value = false
      })
    })
  })
}
