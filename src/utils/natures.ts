import { CHARACTERISTICS } from '@/data/generated/characteristics'
import { NATURES } from '@/data/generated/natures'
import type { StatName } from '@/types/pokemon'
import type { NatureEffect } from './stats'
import { formatPokemonName } from './pokemon'

export interface Nature {
  slug: string
  nameEs: string | null
  up: StatName | null
  down: StatName | null
  likes: string | null
  hates: string | null
}

/** As 25 naturezas (tabela gerada). As 5 neutras não mexem em stat nem têm sabor preferido. */
export const NATURE_LIST: readonly Nature[] = NATURES.map(
  ([slug, nameEs, up, down, likes, hates]) => ({
    slug,
    nameEs: nameEs || null,
    up: up as StatName | null,
    down: down as StatName | null,
    likes,
    hates,
  }),
)

/** Stats que a natureza afeta, na ordem do jogo (sem HP). */
export const NATURE_STATS: readonly StatName[] = [
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
]

export function findNature(slug: string | null | undefined): Nature | null {
  return NATURE_LIST.find((nature) => nature.slug === slug) ?? null
}

/** A natureza que sobe `up` e desce `down` (as 5 neutras têm os dois iguais na tabela 5×5). */
export function natureFor(up: StatName, down: StatName): Nature | null {
  if (up === down) {
    const neutral = NATURE_LIST.filter((nature) => !nature.up)
    return neutral[NATURE_STATS.indexOf(up)] ?? null
  }
  return NATURE_LIST.find((nature) => nature.up === up && nature.down === down) ?? null
}

export function natureEffect(nature: Nature | null, stat: StatName): NatureEffect {
  if (!nature) return 100
  if (nature.up === stat) return 110
  if (nature.down === stat) return 90
  return 100
}

/** Nome da natureza: espanhol da tabela, senão o inglês (como nos jogos em português). */
export function natureName(nature: Nature, locale: string): string {
  return (locale === 'es' && nature.nameEs) || formatPokemonName(nature.slug)
}

export interface Characteristic {
  stat: StatName
  mod5: number
  en: string
  es: string
}

export const CHARACTERISTIC_LIST: readonly Characteristic[] = CHARACTERISTICS.map(
  ([stat, mod5, en, es]) => ({ stat: stat as StatName, mod5, en, es }),
)
