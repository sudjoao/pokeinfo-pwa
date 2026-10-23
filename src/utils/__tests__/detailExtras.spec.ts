import { describe, expect, it } from 'vitest'
import type { PokemonDto } from '@/services/pokeapi/dto'
import {
  toHeldItems,
  toPastAbilities,
  toPastStats,
  toPastTypes,
  toSprites,
} from '@/services/pokeapi/pokemon.service'
import { findGame } from '@/utils/games'
import { heldItemsForGame, spriteTitle, spritesForGame } from '@/utils/detailExtras'

const ref = (name: string) => ({ name, url: '' })
const gen = (n: string) => ref(`generation-${n}`)
const sprite = (path: string) => `https://raw.githubusercontent.com/PokeAPI/sprites/${path}`

/** Só os campos que os mapeadores leem; o resto do `/pokemon/{id}` não importa aqui. */
function dto(extra: Partial<PokemonDto>): PokemonDto {
  return extra as PokemonDto
}

describe('toSprites', () => {
  const pikachu = dto({
    sprites: {
      versions: {
        'generation-ii': {
          crystal: {
            front_default: sprite('crystal/25.png'),
            front_shiny: sprite('crystal/shiny/25.png'),
            animated: { front_default: sprite('crystal/animated/25.gif'), front_shiny: null },
          },
          gold: { front_default: sprite('gold/25.png'), front_shiny: null },
        },
        'generation-i': { 'red-blue': { front_default: sprite('rb/25.png') } },
        'generation-v': { icons: { front_default: sprite('icons/25.png') } },
        'generation-viii': { 'legends-arceus': { front_default: null } },
      },
      other: { showdown: { front_default: sprite('showdown/25.gif'), front_shiny: null } },
    },
  })

  it('ordena por geração, ignora ícones e jogos sem imagem, e põe o Showdown no fim', () => {
    const list = toSprites(pikachu)
    expect(list.map((s) => s.key)).toEqual(['red-blue', 'crystal', 'gold', 'showdown'])
    expect(list[1]!.animated).toBe(sprite('crystal/animated/25.gif'))
    expect(list[3]).toMatchObject({ animated: sprite('showdown/25.gif'), front: null })
  })

  it('com jogo selecionado, os sprites dele vêm primeiro', () => {
    const list = spritesForGame(toSprites(pikachu), findGame('gold-silver'))
    expect(list.map((s) => s.key)).toEqual(['gold', 'red-blue', 'crystal', 'showdown'])
  })

  it('títulos: jogo, versão e casos especiais', () => {
    expect(spriteTitle('sword-shield')).toBe('Sword / Shield')
    expect(spriteTitle('gold')).toBe('Gold')
    expect(spriteTitle('showdown')).toBe('Showdown')
    expect(spriteTitle('red-green-japan')).toBe('Red / Green (JP)')
  })
})

describe('mudanças entre gerações', () => {
  it('Clefairy: Normal até a 5ª geração e Special na 1ª', () => {
    const clefairy = dto({
      past_types: [{ generation: gen('v'), types: [{ slot: 1, type: ref('normal') }] }],
      past_stats: [
        { generation: gen('i'), stats: [{ base_stat: 60, effort: 0, stat: ref('special') }] },
      ],
    })
    expect(toPastTypes(clefairy)).toEqual([{ until: 5, types: ['normal'] }])
    expect(toPastStats(clefairy)).toEqual([{ until: 1, name: 'special', value: 60 }])
  })

  it('ignora o "sem habilidade oculta" antes da 5ª geração', () => {
    const gengar = dto({
      past_abilities: [
        {
          generation: gen('vi'),
          abilities: [
            { ability: ref('levitate'), is_hidden: false, slot: 1 },
            { ability: null, is_hidden: true, slot: 3 },
          ],
        },
      ],
    })
    expect(toPastAbilities(gengar)).toEqual([
      { until: 6, slot: 1, ability: 'levitate', isHidden: false },
    ])
  })
})

describe('itens segurados', () => {
  const held = toHeldItems(
    dto({
      held_items: [
        {
          item: ref('oran-berry'),
          version_details: [
            { rarity: 50, version: ref('ruby') },
            { rarity: 50, version: ref('sapphire') },
          ],
        },
        {
          item: ref('light-ball'),
          version_details: [
            { rarity: 5, version: ref('sword') },
            { rarity: 1, version: ref('shield') },
            { rarity: 5, version: ref('ruby') },
            { rarity: 5, version: ref('black') },
            { rarity: 5, version: ref('x') },
          ],
        },
      ],
    }),
  )

  it('com jogo: mesma chance nas duas versões vira um valor só; item fora do jogo some', () => {
    expect(heldItemsForGame(held, findGame('ruby-sapphire'))).toEqual([
      { item: 'oran-berry', rarities: [{ label: null, rarity: 50 }], more: 0 },
      { item: 'light-ball', rarities: [{ label: null, rarity: 5 }], more: 0 },
    ])
    expect(heldItemsForGame(held, findGame('sword-shield'))).toEqual([
      {
        item: 'light-ball',
        rarities: [
          { label: 'Sword', rarity: 5 },
          { label: 'Shield', rarity: 1 },
        ],
        more: 0,
      },
    ])
  })

  it('sem jogo: os 3 jogos mais recentes e quantos sobram', () => {
    const [, light] = heldItemsForGame(held, null)
    expect(light!.rarities.map((r) => r.label)).toEqual([
      'Sword',
      'Shield',
      'X / Y',
      'Black / White',
    ])
    expect(light!.more).toBe(1)
  })
})
