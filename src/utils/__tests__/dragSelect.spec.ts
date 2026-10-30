import { describe, expect, it } from 'vitest'
import { createDragRange, rangeBetween } from '@/utils/dragSelect'

function setup(initial: number[]) {
  const selected = new Set(initial)
  const options = {
    order: [1, 2, 3, 4, 5, 6],
    isSelected: (id: number) => selected.has(id),
    apply: (id: number, value: boolean) => (value ? selected.add(id) : selected.delete(id)),
  }
  return { selected, options }
}

describe('createDragRange', () => {
  it('seleciona o intervalo inteiro, mesmo pulando itens no movimento', () => {
    const { selected, options } = setup([])
    const drag = createDragRange(options, 2)
    expect(drag.selecting).toBe(true)
    expect([...selected]).toEqual([2])
    drag.update(5)
    expect([...selected].sort()).toEqual([2, 3, 4, 5])
  })

  it('voltar o arrasto devolve os itens ao estado de antes', () => {
    const { selected, options } = setup([4])
    const drag = createDragRange(options, 2)
    drag.update(6)
    drag.update(3)
    expect([...selected].sort()).toEqual([2, 3, 4])
  })

  it('para cima também vale, e começar num selecionado desmarca', () => {
    const { selected, options } = setup([3, 4, 5])
    const drag = createDragRange(options, 5)
    expect(drag.selecting).toBe(false)
    drag.update(3)
    expect([...selected]).toEqual([])
    drag.update(4)
    expect([...selected]).toEqual([3])
  })

  it('ignora ids fora da lista', () => {
    const { selected, options } = setup([])
    const drag = createDragRange(options, 1)
    drag.update(99)
    expect([...selected]).toEqual([1])
  })
})

describe('rangeBetween', () => {
  it('devolve o intervalo nos dois sentidos', () => {
    expect(rangeBetween([10, 20, 30, 40], 40, 20)).toEqual([20, 30, 40])
    expect(rangeBetween([10, 20], 10, 99)).toEqual([])
  })
})
