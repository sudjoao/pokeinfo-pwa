import { describe, expect, it } from 'vitest'
import { nameMatches, normalizeSearch, pickerLabel, searchNumber } from '@/utils/search'

describe('normalizeSearch', () => {
  it('tira acentos e maiúsculas', () => {
    expect(normalizeSearch('Flabébé')).toBe('flabebe')
    expect(normalizeSearch('PIKACHU')).toBe('pikachu')
  })

  it('troca espaço, ponto e apóstrofo por hífen', () => {
    expect(normalizeSearch('Mr. Mime')).toBe('mr-mime')
    expect(normalizeSearch("Farfetch'd")).toBe('farfetch-d')
    expect(normalizeSearch('Ho  Oh')).toBe('ho-oh')
    expect(normalizeSearch('Type: Null')).toBe('type-null')
    expect(normalizeSearch(' nidoran f ')).toBe('nidoran-f')
  })
})

describe('searchNumber', () => {
  it('aceita número puro e com prefixo', () => {
    expect(searchNumber('25')).toBe(25)
    expect(searchNumber('#025')).toBe(25)
    expect(searchNumber('nº 25')).toBe(25)
    expect(searchNumber('No. 25')).toBe(25)
  })

  it('não trata nome como número', () => {
    expect(searchNumber('pika')).toBeNull()
    expect(searchNumber('25a')).toBeNull()
    expect(searchNumber('')).toBeNull()
  })
})

describe('nameMatches', () => {
  it('casa trecho do slug e ignora hífens quando a busca não tem', () => {
    expect(nameMatches('mr-mime', 'mr-mime')).toBe(true)
    expect(nameMatches('mr-mime', 'mrmime')).toBe(true)
    expect(nameMatches('ho-oh', 'hooh')).toBe(true)
    expect(nameMatches('pikachu', 'pika')).toBe(true)
    expect(nameMatches('pikachu', 'chu')).toBe(true)
  })

  it('não casa o que não está no nome', () => {
    expect(nameMatches('pikachu', 'raichu')).toBe(false)
    expect(nameMatches('mr-mime', 'mr-rime')).toBe(false)
  })
})

describe('pickerLabel', () => {
  it('põe o número antes do nome; formas só o nome', () => {
    expect(pickerLabel(25, 'pikachu')).toBe('#25 Pikachu')
    expect(pickerLabel(10100, 'raichu-alola')).toBe('Raichu Alola')
  })
})
