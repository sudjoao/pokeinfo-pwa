import { describe, expect, it } from 'vitest'
import { allItems, filterItems, findItem, itemName } from '@/utils/items'

describe('itens', () => {
  it('Oran Berry: berry, com sprite, nome em espanhol e preço', () => {
    const oran = findItem('oran-berry')!
    expect(oran).toMatchObject({ berry: true, pocket: 'berries', cost: 80 })
    expect(oran.sprite).toContain('/items/oran-berry.png')
    expect(itemName(oran, 'es')).toBe('Baya Aranja')
    expect(itemName(oran, 'pt-BR')).toBe('Oran Berry')
  })

  it('filtra por bolso e por nome sem acento', () => {
    const balls = filterItems(allItems(), '', 'pokeballs', 'en')
    expect(balls.some((item) => item.slug === 'master-ball')).toBe(true)
    expect(balls.every((item) => item.pocket === 'pokeballs')).toBe(true)
    expect(filterItems(allItems(), 'baya aranja', null, 'es').map((i) => i.slug)).toEqual([
      'oran-berry',
    ])
  })
})
