import { onBeforeUnmount, watch, type Ref } from 'vue'
import { createDragRange, rangeBetween, type DragRange } from '@/utils/dragSelect'

interface DragSelectOptions {
  /** Área da lista; os itens têm `data-pokemon-id`. */
  container: Readonly<Ref<HTMLElement | null>>
  /** Modo de seleção ligado: fora dele nada muda (o toque abre a ficha, o arrasto rola). */
  active: Readonly<Ref<boolean>>
  /** Ids na ordem da lista. */
  order: () => readonly number[]
  isSelected: (id: number) => boolean
  apply: (id: number, selected: boolean) => void
  /** Até onde a lista fica coberta em cima (cabeçalho e abas) e embaixo (barra da seleção). */
  topInset: () => number
  bottomInset: () => number
}

/** Quanto o ponteiro anda até um clique virar arrasto (mouse). */
const DRAG_THRESHOLD = 6
/** Segurar o dedo parado por esse tempo começa o arrasto (antes disso o dedo rola a lista). */
const LONG_PRESS_MS = 300
/** Mexer mais que isso antes do tempo é rolagem: cancela. */
const TOUCH_SLOP = 10
/** Faixa perto das bordas onde o arrasto rola a página, e a velocidade máxima (px por quadro). */
const EDGE = 72
const MAX_SPEED = 18

function itemAt(x: number, y: number, container: HTMLElement): number | null {
  const element = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-pokemon-id]')
  if (!element || !container.contains(element)) return null
  const id = Number(element.dataset.pokemonId)
  return Number.isFinite(id) ? id : null
}

/**
 * Seleção por arrasto na lista (cards e caixas), no estilo do Google Fotos: com o mouse, clicar e
 * arrastar; no toque, segurar um instante e arrastar (o arrasto simples continua rolando a página).
 * Perto do topo ou da barra de baixo, a página rola sozinha. Shift+clique seleciona o intervalo
 * desde o último item tocado: a alternativa ao arrasto para teclado e mouse (WCAG 2.5.7).
 */
export function useDragSelect(options: DragSelectOptions) {
  let range: DragRange | null = null
  /** Último item tocado: âncora do Shift+clique. */
  let anchor: number | null = null
  let pointer = { x: 0, y: 0 }
  let pending: { id: number; x: number; y: number } | null = null
  let pressTimer: ReturnType<typeof setTimeout> | undefined
  let scrollFrame = 0
  /** O clique que o navegador dispara ao soltar não pode desfazer o que o arrasto fez. */
  let suppressClick = false

  function begin(id: number): void {
    range = createDragRange(
      { order: options.order(), isSelected: options.isSelected, apply: options.apply },
      id,
    )
    anchor = id
    suppressClick = true
    autoScroll()
  }

  function move(x: number, y: number): void {
    pointer = { x, y }
    const container = options.container.value
    if (!range || !container) return
    const id = itemAt(x, y, container)
    if (id !== null) {
      range.update(id)
      anchor = id
    }
  }

  function finish(): void {
    clearTimeout(pressTimer)
    pending = null
    cancelAnimationFrame(scrollFrame)
    const dragged = range !== null
    range = null
    // O clique sai logo depois do pointerup/touchend; se não vier (soltou fora), libera depois.
    if (dragged) setTimeout(() => (suppressClick = false), 400)
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup', finish)
    document.removeEventListener('pointercancel', finish)
  }

  /** Rola enquanto o ponteiro está perto da borda, e reavalia o item sob ele a cada quadro. */
  function autoScroll(): void {
    cancelAnimationFrame(scrollFrame)
    scrollFrame = requestAnimationFrame(() => {
      if (!range) return
      const top = options.topInset()
      const bottom = window.innerHeight - options.bottomInset()
      let speed = 0
      if (pointer.y < top + EDGE) speed = -MAX_SPEED * Math.min(1, (top + EDGE - pointer.y) / EDGE)
      else if (pointer.y > bottom - EDGE)
        speed = MAX_SPEED * Math.min(1, (pointer.y - (bottom - EDGE)) / EDGE)
      if (speed) {
        window.scrollBy(0, speed)
        move(pointer.x, pointer.y)
      }
      autoScroll()
    })
  }

  // Mouse e caneta: o arrasto começa ao passar do limiar (abaixo dele é um clique comum).
  function onPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'touch' || event.button !== 0 || event.shiftKey) return
    const container = options.container.value
    const id = container ? itemAt(event.clientX, event.clientY, container) : null
    if (id === null) return
    pending = { id, x: event.clientX, y: event.clientY }
    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', finish)
    document.addEventListener('pointercancel', finish)
  }

  function onPointerMove(event: PointerEvent): void {
    if (pending && !range) {
      const distance = Math.hypot(event.clientX - pending.x, event.clientY - pending.y)
      if (distance < DRAG_THRESHOLD) return
      begin(pending.id)
    }
    move(event.clientX, event.clientY)
  }

  // Toque: segurar parado começa o arrasto; mexer antes disso é rolagem.
  function onTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return finish()
    const touch = event.touches[0]!
    const container = options.container.value
    const id = container ? itemAt(touch.clientX, touch.clientY, container) : null
    if (id === null) return
    pending = { id, x: touch.clientX, y: touch.clientY }
    pointer = { x: touch.clientX, y: touch.clientY }
    clearTimeout(pressTimer)
    pressTimer = setTimeout(() => {
      if (!pending) return
      navigator.vibrate?.(10)
      begin(pending.id)
    }, LONG_PRESS_MS)
  }

  function onTouchMove(event: TouchEvent): void {
    const touch = event.touches[0]
    if (!touch) return
    if (range) {
      // Arrastando: o dedo seleciona em vez de rolar a página.
      event.preventDefault()
      move(touch.clientX, touch.clientY)
      return
    }
    if (pending && Math.hypot(touch.clientX - pending.x, touch.clientY - pending.y) > TOUCH_SLOP)
      finish()
  }

  /** Segurar o dedo abriria o menu de contexto (Android) por cima do arrasto. */
  function onContextMenu(event: Event): void {
    if (pending || range) event.preventDefault()
  }

  function onClickCapture(event: MouseEvent): void {
    if (suppressClick) {
      suppressClick = false
      event.preventDefault()
      event.stopPropagation()
      return
    }
    const container = options.container.value
    const id = container ? itemAt(event.clientX, event.clientY, container) : null
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-pokemon-id]')
    const clicked = id ?? (target ? Number(target.dataset.pokemonId) : null)
    if (clicked === null || !Number.isFinite(clicked)) return
    if (event.shiftKey && anchor !== null && anchor !== clicked) {
      event.preventDefault()
      event.stopPropagation()
      for (const item of rangeBetween(options.order(), anchor, clicked)) options.apply(item, true)
    }
    anchor = clicked
  }

  const listeners: [string, EventListener, AddEventListenerOptions][] = [
    ['pointerdown', onPointerDown as EventListener, {}],
    ['touchstart', onTouchStart as EventListener, { passive: true }],
    ['touchmove', onTouchMove as EventListener, { passive: false }],
    ['touchend', finish, {}],
    ['touchcancel', finish, {}],
    ['contextmenu', onContextMenu, {}],
    ['click', onClickCapture as EventListener, { capture: true }],
  ]

  // Os ouvintes só existem no modo de seleção: o touchmove não passivo, fora dele, atrasaria a
  // rolagem da lista.
  watch(
    [options.container, options.active],
    ([container, active], _, onCleanup) => {
      if (!container || !active) return
      for (const [type, listener, opts] of listeners)
        container.addEventListener(type, listener, opts)
      onCleanup(() => {
        finish()
        anchor = null
        for (const [type, listener, opts] of listeners)
          container.removeEventListener(type, listener, opts)
      })
    },
    { immediate: true },
  )

  onBeforeUnmount(finish)
}
