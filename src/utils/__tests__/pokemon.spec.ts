import { describe, expect, it } from 'vitest'
import {
  artworkSrc,
  formatDexNumber,
  formatPokemonName,
  generationNumber,
  genderRatio,
  idFromResourceUrl,
  TYPE_TEXT_COLORS,
} from '@/utils/pokemon'

describe('formatação', () => {
  it('número da Pokédex', () => {
    expect(formatDexNumber(25)).toBe('#0025')
    expect(formatDexNumber(25, 3)).toBe('#025')
  })

  it('nome a partir do slug', () => {
    expect(formatPokemonName('mr-mime')).toBe('Mr Mime')
  })

  it('id a partir da URL do recurso', () => {
    expect(idFromResourceUrl('https://pokeapi.co/api/v2/pokemon/25/')).toBe(25)
    expect(idFromResourceUrl('https://pokeapi.co/api/v2/pokemon/')).toBeNaN()
  })

  it('geração em algarismos romanos', () => {
    expect(generationNumber('generation-iv')).toBe(4)
    expect(generationNumber('generation-ix')).toBe(9)
  })

  it('proporção de gênero', () => {
    expect(genderRatio(-1)).toBeNull()
    expect(genderRatio(1)).toEqual({ female: 12.5, male: 87.5 })
  })
})

describe('artworkSrc', () => {
  it('pede a menor largura que cobre o dobro do tamanho exibido', () => {
    expect(artworkSrc(25, 48)).toContain('&w=96&')
    expect(artworkSrc(25, 120)).toContain('&w=240&')
    expect(artworkSrc(25, 240)).toContain('&w=480&')
    expect(artworkSrc(25, 400)).toContain('&w=480&')
  })

  it('aponta para o artwork oficial do id', () => {
    expect(artworkSrc(6, 120)).toContain('official-artwork/6.png')
  })
})

describe('TYPE_TEXT_COLORS', () => {
  it('texto escuro nos tipos claros e branco nos escuros', () => {
    expect(TYPE_TEXT_COLORS.electric).toBe('#1a1a1a')
    expect(TYPE_TEXT_COLORS.ice).toBe('#1a1a1a')
    expect(TYPE_TEXT_COLORS.dragon).toBe('#ffffff')
    expect(TYPE_TEXT_COLORS.dark).toBe('#ffffff')
  })
})
