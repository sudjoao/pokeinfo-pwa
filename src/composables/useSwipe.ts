import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/** Distância mínima (px) e quanto o gesto precisa ser mais horizontal que vertical. */
const MIN_DISTANCE = 70
const DIRECTION_RATIO = 1.8
/** Faixa nas bordas da tela onde começa o voltar/avançar do próprio iOS: dali o gesto é dele. */
const EDGE = 24

/** Áreas que rolam na horizontal: o gesto ali é rolagem, não troca de Pokémon. */
const IGNORE =
  '.v-slide-group, .v-table__wrapper, .v-tabs, .types-chart, .list-filters, input, textarea, .v-overlay'

/**
 * Gesto de deslizar para os lados (toque). Chama `onNext` ao deslizar para a esquerda e
 * `onPrevious` para a direita, como virar página. Só toque: no mouse continua a seleção de texto.
 */
export function useSwipe(
  target: Readonly<Ref<HTMLElement | null>>,
  handlers: { onNext: () => void; onPrevious: () => void },
): void {
  let start: { x: number; y: number } | null = null

  function onStart(event: TouchEvent): void {
    const touch = event.touches[0]
    const element = event.target as Element | null
    const fromEdge = touch && (touch.clientX < EDGE || touch.clientX > window.innerWidth - EDGE)
    start =
      touch && event.touches.length === 1 && !fromEdge && !element?.closest(IGNORE)
        ? { x: touch.clientX, y: touch.clientY }
        : null
  }

  function onEnd(event: TouchEvent): void {
    const touch = event.changedTouches[0]
    if (!start || !touch) return
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    start = null
    if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * DIRECTION_RATIO) return
    if (dx < 0) handlers.onNext()
    else handlers.onPrevious()
  }

  onMounted(() => {
    target.value?.addEventListener('touchstart', onStart, { passive: true })
    target.value?.addEventListener('touchend', onEnd, { passive: true })
  })
  onBeforeUnmount(() => {
    target.value?.removeEventListener('touchstart', onStart)
    target.value?.removeEventListener('touchend', onEnd)
  })
}
