import { onActivated, onBeforeUnmount, onDeactivated, onMounted } from 'vue'

/** Controles que já usam as teclas (setas nas abas, nos grupos de botões, no slider). */
const KEY_OWNERS =
  '[role="tablist"], [role="radiogroup"], [role="listbox"], [role="menu"], [role="slider"], .v-slide-group, .v-btn-group'

/** Foco num campo de texto ou num controle com teclado próprio: ali a tecla não é atalho. */
function ownsKeys(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) ||
      target.closest(KEY_OWNERS) !== null)
  )
}

/**
 * Atalho de teclado da tela (ex.: "/" foca a busca, ←/→ trocam de Pokémon). Fica fora de campos de
 * texto, de combinações com Ctrl/⌘/Alt e de sheets e diálogos abertos (o aviso no rodapé não conta).
 * Liga e desliga junto com a tela, inclusive a Home em KeepAlive.
 */
export function useShortcut(keys: readonly string[], handler: (event: KeyboardEvent) => void) {
  function onKeydown(event: KeyboardEvent): void {
    if (!keys.includes(event.key) || event.defaultPrevented || event.repeat) return
    if (event.ctrlKey || event.metaKey || event.altKey || ownsKeys(event.target)) return
    if (document.querySelector('.v-overlay--active:not(.v-snackbar)')) return
    handler(event)
  }

  const on = () => document.addEventListener('keydown', onKeydown)
  const off = () => document.removeEventListener('keydown', onKeydown)
  onMounted(on)
  onActivated(on)
  onDeactivated(off)
  onBeforeUnmount(off)
}
