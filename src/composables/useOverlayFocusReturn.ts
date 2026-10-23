import { nextTick, watch, type Ref } from 'vue'
import { focusPageTitle } from './usePageFocus'

function usable(element: HTMLElement | null): element is HTMLElement {
  return (
    !!element && element.isConnected && !element.closest('[inert]') && element.checkVisibility()
  )
}

/**
 * Devolve o foco a quem abriu o sheet/dialog quando ele fecha. O Vuetify só faz isso quando o
 * overlay tem `activator`; aqui todos abrem por `v-model`, e o foco caía no `<body>`. Se o
 * elemento de origem sumiu (ex.: item do menu lateral, que fica inerte ao fechar), vai para o h1.
 */
export function useOverlayFocusReturn(open: Readonly<Ref<boolean>>): void {
  let origin: HTMLElement | null = null
  let wasOpen = false

  // flush 'pre' (padrão): roda antes do Vuetify mover o foco para dentro do conteúdo. `immediate`
  // cobre o sheet montado já aberto (carregado sob demanda no primeiro toque).
  watch(
    open,
    (value) => {
      if (value) {
        wasOpen = true
        const active = document.activeElement
        origin = active instanceof HTMLElement && active !== document.body ? active : null
        return
      }
      if (!wasOpen) return
      wasOpen = false
      restore()
    },
    { immediate: true },
  )

  function restore(): void {
    const target = origin
    origin = null
    nextTick(() => {
      // Só corrige o foco que ficou "perdido" (no body ou no overlay que está saindo).
      const active = document.activeElement
      if (active && active !== document.body && !active.closest('.v-overlay')) return
      if (usable(target)) target.focus({ preventScroll: true })
      else focusPageTitle()
    })
  }
}
