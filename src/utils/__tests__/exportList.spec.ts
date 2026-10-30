import { describe, expect, it } from 'vitest'
import {
  buildExport,
  DEFAULT_EXPORT_OPTIONS,
  entriesInScope,
  type ExportEntry,
  type ExportLabels,
} from '@/utils/exportList'

const labels: ExportLabels = {
  title: 'PokeInfo · Scarlet / Violet',
  summary: 'Faltam 2 de 3',
  national: 'Nac.',
  number: 'Nº',
  name: 'Nome',
  types: 'Tipos',
  caught: 'Capturado',
  exclusive: 'Exclusivo',
  link: 'Link',
  yes: 'Sim',
  no: 'Não',
  onlyIn: (version) => `só ${version}`,
}

const entries: ExportEntry[] = [
  { id: 906, name: 'sprigatito', dexNumber: 1, caught: true, types: ['Grama'] },
  {
    id: 10250,
    name: 'tauros-paldea-combat-breed',
    speciesId: 128,
    dexNumber: 223,
    caught: false,
    types: ['Lutador'],
    url: 'https://x/pokemon/10250',
  },
  {
    id: 984,
    name: 'great-tusk',
    dexNumber: 380,
    caught: false,
    types: ['Terra', 'Lutador'],
    exclusiveTo: 'Scarlet',
  },
]

describe('buildExport (texto)', () => {
  it('monta cabeçalho, número regional, nacional da espécie, tipos e exclusivo', () => {
    const text = buildExport(entries, DEFAULT_EXPORT_OPTIONS, labels)
    expect(text.split('\n')).toEqual([
      'PokeInfo · Scarlet / Violet',
      'Faltam 2 de 3',
      '',
      '✅ #001 Sprigatito (Nac. #0906) · Grama',
      '⬜ #223 Tauros Paldea Combat Breed (Nac. #0128) · Lutador',
      '⬜ #380 Great Tusk (Nac. #0984) · Terra/Lutador · só Scarlet',
    ])
  })

  it('omite marcas, tipos e exclusivo quando desligados e põe o link separado por espaço', () => {
    const text = buildExport(
      [entries[1]!],
      { format: 'text', types: false, exclusive: false, links: true, status: false },
      { ...labels, title: '', summary: '' },
    )
    expect(text).toBe('#223 Tauros Paldea Combat Breed (Nac. #0128) https://x/pokemon/10250')
  })

  it('na Nacional usa o número de 4 dígitos e não repete o nacional', () => {
    const text = buildExport(
      [{ id: 25, name: 'pikachu', types: ['Elétrico'] }],
      DEFAULT_EXPORT_OPTIONS,
      { ...labels, summary: '' },
    )
    expect(text.split('\n')).toEqual([
      'PokeInfo · Scarlet / Violet',
      '',
      '#0025 Pikachu · Elétrico',
    ])
  })
})

describe('buildExport (tabela)', () => {
  it('separa colunas por tab e só inclui as colunas com dado', () => {
    const text = buildExport(entries, { ...DEFAULT_EXPORT_OPTIONS, format: 'table' }, labels)
    expect(text.split('\n').map((row) => row.split('\t'))).toEqual([
      ['Nº', 'Nac.', 'Nome', 'Tipos', 'Capturado', 'Exclusivo'],
      ['#001', '#0906', 'Sprigatito', 'Grama', 'Sim', ''],
      ['#223', '#0128', 'Tauros Paldea Combat Breed', 'Lutador', 'Não', ''],
      ['#380', '#0984', 'Great Tusk', 'Terra/Lutador', 'Não', 'Scarlet'],
    ])
  })

  it('não deixa tab ou quebra de linha de um valor virar outra célula', () => {
    const text = buildExport(
      [{ id: 1, name: 'bulbasaur', exclusiveTo: 'A\tB\nC' }],
      { ...DEFAULT_EXPORT_OPTIONS, format: 'table', types: false },
      labels,
    )
    expect(text.split('\n')[1]).toBe('#0001\tBulbasaur\tA B C')
  })
})

describe('entriesInScope', () => {
  it('filtra capturados e faltantes; sem jogo (caught undefined) mantém todos', () => {
    expect(entriesInScope(entries, 'missing').map((e) => e.id)).toEqual([10250, 984])
    expect(entriesInScope(entries, 'caught').map((e) => e.id)).toEqual([906])
    expect(entriesInScope(entries, 'all')).toHaveLength(3)
    expect(entriesInScope([{ caught: undefined }], 'caught')).toHaveLength(1)
  })
})
