import { nextTick, onActivated, onMounted, type Ref } from 'vue'
import type { Router } from 'vue-router'

/**
 * Vira true na primeira navegação dentro do app. Na abertura da página o foco fica onde o
 * navegador põe; só as trocas de tela seguintes movem o foco.
 */
let navigatedInApp = false

export function trackInAppNavigation(router: Router): void {
  router.afterEach((_to, from, failure) => {
    if (!failure && from.matched.length > 0) navigatedInApp = true
  })
}

/**
 * Ao entrar numa tela por navegação interna, leva o foco ao título (h1) dela. Numa SPA o leitor de
 * tela não percebe a troca de página sozinho, e o foco do teclado ficaria no link já desmontado.
 * `root` é a raiz do layout. Sem rolar: a posição é decidida pelo scrollBehavior do router.
 */
export function usePageFocus(root: Readonly<Ref<HTMLElement | null>>): void {
  function focusTitle(): void {
    if (!navigatedInApp) return
    nextTick(() => root.value?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true }))
  }

  onMounted(focusTitle)
  // A Home fica em KeepAlive: ao voltar ela é reativada, não montada de novo.
  onActivated(focusTitle)
}
