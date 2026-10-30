import { formatDexNumber, formatPokemonName } from '@/utils/pokemon'

/**
 * Exportação da lista para a área de transferência: texto para colar em notas e conversas, ou
 * tabela (colunas separadas por tab, que o Google Planilhas, o Excel e o Numbers dividem em
 * células ao colar).
 */
export type ExportFormat = 'text' | 'table'

/** Quais Pokémon entram: os que faltam, os capturados ou todos (com o estado de cada um). */
export type ExportScope = 'missing' | 'caught' | 'all'

export interface ExportEntry {
  /** Id da forma (o card); o número nacional mostrado é o da espécie. */
  id: number
  name: string
  /** Número na Pokédex regional; undefined na Nacional. */
  dexNumber?: number
  speciesId?: number
  /** Estado no jogo; undefined sem jogo (não há o que marcar). */
  caught?: boolean
  /** Tipos já traduzidos. */
  types?: readonly string[]
  /** Versão em que é exclusivo (ex.: "Scarlet"). */
  exclusiveTo?: string
  /** Link para a página do Pokémon (com o jogo, onde fica "Onde encontrar"). */
  url?: string
}

export interface ExportOptions {
  format: ExportFormat
  types: boolean
  exclusive: boolean
  links: boolean
  /** Marca de capturado/faltando em cada linha (só faz sentido exportando "todos"). */
  status: boolean
}

export interface ExportLabels {
  /** Primeira linha do texto (ex.: "PokeInfo · Scarlet / Violet · Paldea"). */
  title: string
  /** Segunda linha (ex.: "Faltam 87 de 400"); vazio omite. */
  summary: string
  national: string
  number: string
  name: string
  types: string
  caught: string
  exclusive: string
  link: string
  yes: string
  no: string
  /** Texto do exclusivo na linha (ex.: "só Scarlet"). */
  onlyIn: (version: string) => string
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'text',
  types: true,
  exclusive: true,
  links: false,
  status: true,
}

/** Marcas do texto: emoji renderiza igual no celular e no PC e se distingue sem cor. */
const MARK_CAUGHT = '✅'
const MARK_MISSING = '⬜'

function speciesOf(entry: ExportEntry): number {
  return entry.speciesId ?? entry.id
}

function numberOf(entry: ExportEntry): string {
  return entry.dexNumber !== undefined
    ? formatDexNumber(entry.dexNumber, 3)
    : formatDexNumber(entry.id)
}

/** Uma célula não pode ter tab nem quebra de linha (viraria outra coluna ou outra linha). */
function cell(value: string): string {
  return value.replace(/[\t\r\n]+/g, ' ')
}

function textLine(entry: ExportEntry, options: ExportOptions, labels: ExportLabels): string {
  let line = `${numberOf(entry)} ${formatPokemonName(entry.name)}`
  if (entry.dexNumber !== undefined)
    line += ` (${labels.national} ${formatDexNumber(speciesOf(entry))})`
  const extras: string[] = []
  if (options.types && entry.types?.length) extras.push(entry.types.join('/'))
  if (options.exclusive && entry.exclusiveTo) extras.push(labels.onlyIn(entry.exclusiveTo))
  if (extras.length) line += ` · ${extras.join(' · ')}`
  // O link vai separado por espaço: apps de notas e conversa só o reconhecem assim.
  if (options.links && entry.url) line += ` ${entry.url}`
  if (options.status && entry.caught !== undefined)
    line = `${entry.caught ? MARK_CAUGHT : MARK_MISSING} ${line}`
  return line
}

function tableRows(
  entries: readonly ExportEntry[],
  options: ExportOptions,
  labels: ExportLabels,
): string[][] {
  const regional = entries.some((entry) => entry.dexNumber !== undefined)
  const withStatus = options.status && entries.some((entry) => entry.caught !== undefined)
  const withExclusive = options.exclusive && entries.some((entry) => entry.exclusiveTo)
  const withLinks = options.links && entries.some((entry) => entry.url)

  const header = [labels.number]
  if (regional) header.push(labels.national)
  header.push(labels.name)
  if (options.types) header.push(labels.types)
  if (withStatus) header.push(labels.caught)
  if (withExclusive) header.push(labels.exclusive)
  if (withLinks) header.push(labels.link)

  const rows = entries.map((entry) => {
    const row = [numberOf(entry)]
    if (regional) row.push(formatDexNumber(speciesOf(entry)))
    row.push(formatPokemonName(entry.name))
    if (options.types) row.push(entry.types?.join('/') ?? '')
    if (withStatus) row.push(entry.caught ? labels.yes : labels.no)
    if (withExclusive) row.push(entry.exclusiveTo ?? '')
    if (withLinks) row.push(entry.url ?? '')
    return row
  })
  return [header, ...rows]
}

/** Texto pronto para a área de transferência. */
export function buildExport(
  entries: readonly ExportEntry[],
  options: ExportOptions,
  labels: ExportLabels,
): string {
  if (options.format === 'table') {
    return tableRows(entries, options, labels)
      .map((row) => row.map(cell).join('\t'))
      .join('\n')
  }
  const head = [labels.title, labels.summary].filter(Boolean)
  const lines = entries.map((entry) => textLine(entry, options, labels))
  return [...head, ...(head.length ? [''] : []), ...lines].join('\n')
}

/** Recorte da lista para o escopo pedido (sem jogo, não há estado: vai a lista toda). */
export function entriesInScope<T extends { caught?: boolean }>(
  entries: readonly T[],
  scope: ExportScope,
): T[] {
  if (scope === 'all') return [...entries]
  const caught = scope === 'caught'
  return entries.filter((entry) => entry.caught === undefined || entry.caught === caught)
}
