/**
 * Seleção por arrasto (como no Google Fotos): o intervalo vai do item onde o arrasto começou até
 * o item sob o dedo/ponteiro, na ordem da lista. Um movimento rápido não pula itens, e voltar o
 * arrasto devolve os que saíram do intervalo ao estado de antes.
 */
export interface DragRangeOptions {
  /** Ids na ordem da lista. */
  order: readonly number[]
  isSelected: (id: number) => boolean
  apply: (id: number, selected: boolean) => void
}

export interface DragRange {
  /** true = o arrasto seleciona; false = desmarca (começou num item já selecionado). */
  readonly selecting: boolean
  /** Leva o fim do intervalo para `id` (ignora ids fora da lista). */
  update: (id: number) => void
}

export function createDragRange(options: DragRangeOptions, startId: number): DragRange {
  const index = new Map(options.order.map((id, i) => [id, i]))
  const start = index.get(startId) ?? -1
  const selecting = !options.isSelected(startId)
  /** Estado de cada item antes de o arrasto passar por ele. */
  const before = new Map<number, boolean>()
  /** Intervalo atual, como índices na ordem da lista. */
  let current: [number, number] | null = null

  /** Só a diferença entre o intervalo antigo e o novo muda de estado (o arrasto chega a 120 Hz). */
  function update(id: number): void {
    const end = index.get(id)
    if (start < 0 || end === undefined) return
    const from = Math.min(start, end)
    const to = Math.max(start, end)
    if (current && current[0] === from && current[1] === to) return
    const inside = (i: number, span: [number, number] | null) =>
      span !== null && i >= span[0] && i <= span[1]
    if (current) {
      for (let i = current[0]; i <= current[1]; i++) {
        if (inside(i, [from, to])) continue
        const item = options.order[i]!
        options.apply(item, before.get(item) ?? false)
      }
    }
    for (let i = from; i <= to; i++) {
      if (inside(i, current)) continue
      const item = options.order[i]!
      if (!before.has(item)) before.set(item, options.isSelected(item))
      options.apply(item, selecting)
    }
    current = [from, to]
  }

  update(startId)
  return { selecting, update }
}

/** Ids entre `from` e `to` (inclusive), na ordem da lista; vazio se algum não estiver nela. */
export function rangeBetween(order: readonly number[], from: number, to: number): number[] {
  const a = order.indexOf(from)
  const b = order.indexOf(to)
  if (a < 0 || b < 0) return []
  return order.slice(Math.min(a, b), Math.max(a, b) + 1)
}
