import {
  ITEM_BERRY,
  ITEM_CATEGORIES,
  ITEM_HAS_SPRITE,
  ITEMS,
  type ItemRow,
} from '@/data/generated/items'
import { formatPokemonName, itemSpriteUrl } from './pokemon'

/** Bolsos na ordem da mochila dos jogos recentes. */
export const ITEM_POCKETS = [
  'medicine',
  'pokeballs',
  'battle',
  'berries',
  'misc',
  'machines',
  'mail',
  'key',
] as const
export type ItemPocket = (typeof ITEM_POCKETS)[number]

export interface ItemEntry {
  slug: string
  category: string
  pocket: string
  /** Preço na loja (0 = não se compra). */
  cost: number
  nameEs: string | null
  berry: boolean
  /** null quando o repositório de sprites não tem imagem do item. */
  sprite: string | null
}

function toEntry(row: ItemRow): ItemEntry {
  const [slug, categoryIndex, cost, nameEs, bits] = row
  const [category, pocket] = ITEM_CATEGORIES[categoryIndex] ?? ['other', 'misc']
  return {
    slug,
    category,
    pocket,
    cost,
    nameEs: nameEs || null,
    berry: (bits & ITEM_BERRY) !== 0,
    sprite: bits & ITEM_HAS_SPRITE ? itemSpriteUrl(slug) : null,
  }
}

let entries: ItemEntry[] | null = null

/** Todos os itens que existem em algum jogo (tabela gerada, sem requisição). */
export function allItems(): ItemEntry[] {
  entries ??= ITEMS.map(toEntry)
  return entries
}

export function findItem(slug: string): ItemEntry | null {
  return allItems().find((item) => item.slug === slug) ?? null
}

/** Nome no idioma atual: espanhol da tabela, senão o inglês formatado (como nos jogos). */
export function itemName(item: Pick<ItemEntry, 'slug' | 'nameEs'>, locale: string): string {
  return (locale === 'es' && item.nameEs) || formatPokemonName(item.slug)
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Nome normalizado para a busca, por idioma e slug (uma vez, não a cada tecla nos ~1.600 itens). */
const searchNames = new Map<string, Map<string, string>>()

function searchName(item: ItemEntry, locale: string): string {
  let byLocale = searchNames.get(locale)
  if (!byLocale) {
    byLocale = new Map()
    searchNames.set(locale, byLocale)
  }
  let name = byLocale.get(item.slug)
  if (name === undefined) {
    name = `${normalize(itemName(item, locale))}|${normalize(item.slug.replace(/-/g, ' '))}`
    byLocale.set(item.slug, name)
  }
  return name
}

/** A mesma lista ordenada por nome, uma vez por idioma; filtrar depois mantém a ordem. */
const sortedByName = new WeakMap<readonly ItemEntry[], Map<string, readonly ItemEntry[]>>()

function byName(items: readonly ItemEntry[], locale: string): readonly ItemEntry[] {
  let byLocale = sortedByName.get(items)
  if (!byLocale) {
    byLocale = new Map()
    sortedByName.set(items, byLocale)
  }
  let sorted = byLocale.get(locale)
  if (!sorted) {
    const collator = new Intl.Collator(locale, { sensitivity: 'base' })
    sorted = [...items].sort((a, b) => collator.compare(itemName(a, locale), itemName(b, locale)))
    byLocale.set(locale, sorted)
  }
  return sorted
}

/** Filtra por nome (sem acento, no idioma atual ou pelo slug) e bolso, em ordem alfabética. */
export function filterItems(
  items: readonly ItemEntry[],
  query: string,
  pocket: string | null,
  locale: string,
): ItemEntry[] {
  const term = normalize(query.trim())
  return byName(items, locale).filter(
    (item) =>
      (!pocket || item.pocket === pocket) && (!term || searchName(item, locale).includes(term)),
  )
}
