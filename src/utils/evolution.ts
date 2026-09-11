import type { EvolutionRequirement } from '@/types/pokemon'
import { formatPokemonName, isPokemonType } from '@/utils/pokemon'

export type { EvolutionRequirement }

/** Função de tradução mínima (o `t` do vue-i18n serve direto). */
export type Translate = (key: string, values?: Record<string, unknown>) => string

/**
 * Itens ficam com o nome em inglês (como nos jogos), para facilitar a busca.
 * Só ajustamos slugs que perdem o apóstrofo na PokéAPI.
 */
const ITEM_LABELS: Record<string, string> = {
  'kings-rock': "King's Rock",
  'leaders-crest': "Leader's Crest",
}

export function formatItemName(name: string): string {
  return ITEM_LABELS[name] ?? formatPokemonName(name)
}

const TIMES_OF_DAY = ['day', 'night', 'dusk', 'full-moon']

const REGION_LABELS: Record<string, string> = {
  kanto: 'Kanto',
  johto: 'Johto',
  hoenn: 'Hoenn',
  sinnoh: 'Sinnoh',
  unova: 'Unova',
  kalos: 'Kalos',
  alola: 'Alola',
  galar: 'Galar',
  hisui: 'Hisui',
  paldea: 'Paldea',
}

function typeLabel(name: string, t: Translate): string {
  return isPokemonType(name) ? t(`type.${name}`) : formatPokemonName(name)
}

function formatMove(name: string): string {
  return formatPokemonName(name)
}

/** Frase principal, definida pelo gatilho da evolução. */
function baseSentence(r: EvolutionRequirement, t: Translate): string {
  const times = r.minMoveCount
    ? t('evolution.timesN', { n: r.minMoveCount })
    : t('evolution.timesMany')
  const move = r.usedMove ? formatMove(r.usedMove) : t('evolution.someMove')

  switch (r.trigger) {
    case 'level-up':
      if (r.minLevel) return t('evolution.level', { n: r.minLevel })
      if (r.minSteps) return t('evolution.letsGoSteps', { n: r.minSteps })
      return t('evolution.levelUp')
    case 'trade':
      return r.tradeSpecies
        ? t('evolution.tradeFor', { pokemon: formatPokemonName(r.tradeSpecies) })
        : t('evolution.trade')
    case 'use-item':
      return r.item
        ? t('evolution.useItem', { item: formatItemName(r.item) })
        : t('evolution.useAnyItem')
    case 'shed':
      return t('evolution.shed')
    case 'spin':
      return t('evolution.spin')
    case 'tower-of-darkness':
      return t('evolution.towerOfDarkness')
    case 'tower-of-waters':
      return t('evolution.towerOfWaters')
    case 'three-critical-hits':
      return t('evolution.threeCriticalHits')
    case 'take-damage':
      return t('evolution.takeDamage', { n: r.minDamageTaken ?? 49 })
    case 'agile-style-move':
      return t('evolution.agileStyleMove', { move, times })
    case 'strong-style-move':
      return t('evolution.strongStyleMove', { move, times })
    case 'recoil-damage':
      return t('evolution.recoilDamage', { n: r.minDamageTaken ?? 294 })
    case 'use-move':
      return t('evolution.useMove', { move, times })
    case 'three-defeated-bisharp':
      return t('evolution.threeDefeatedBisharp')
    case 'gimmighoul-coins':
      return t('evolution.gimmighoulCoins')
    case 'other':
      return r.minLevel ? t('evolution.otherAtLevel', { n: r.minLevel }) : t('evolution.other')
    default:
      return r.minLevel ? t('evolution.level', { n: r.minLevel }) : t('evolution.special')
  }
}

/** Condições extras, na ordem em que aparecem na frase. */
function extraConditions(r: EvolutionRequirement, t: Translate): string[] {
  const parts: string[] = []

  if (r.heldItem) parts.push(t('evolution.holding', { item: formatItemName(r.heldItem) }))
  if (r.knownMove) parts.push(t('evolution.knowingMove', { move: formatMove(r.knownMove) }))
  if (r.knownMoveType)
    parts.push(t('evolution.knowingMoveType', { type: typeLabel(r.knownMoveType, t) }))
  if (r.minHappiness) parts.push(t('evolution.highHappiness'))
  if (r.minAffection) parts.push(t('evolution.highAffection'))
  if (r.minBeauty) parts.push(t('evolution.beauty', { n: r.minBeauty }))
  if (r.relativePhysicalStats === 1) parts.push(t('evolution.attackGreater'))
  if (r.relativePhysicalStats === -1) parts.push(t('evolution.attackLower'))
  if (r.relativePhysicalStats === 0) parts.push(t('evolution.attackEqual'))
  if (r.gender === 1) parts.push(t('evolution.female'))
  if (r.gender === 2) parts.push(t('evolution.male'))
  if (r.partySpecies)
    parts.push(t('evolution.partySpecies', { pokemon: formatPokemonName(r.partySpecies) }))
  if (r.partyType) parts.push(t('evolution.partyType', { type: typeLabel(r.partyType, t) }))
  if (r.location) parts.push(t('evolution.atLocation', { location: formatPokemonName(r.location) }))
  if (r.nearSpecialRock) parts.push(t('evolution.nearSpecialRock'))
  if (r.needsOverworldRain) parts.push(t('evolution.overworldRain'))
  if (r.needsMultiplayer) parts.push(t('evolution.multiplayer'))
  if (r.turnUpsideDown) parts.push(t('evolution.upsideDown'))
  if (r.minSteps && r.trigger !== 'level-up')
    parts.push(t('evolution.afterSteps', { n: r.minSteps }))
  if (r.timeOfDay)
    parts.push(
      TIMES_OF_DAY.includes(r.timeOfDay) ? t(`evolution.timeOfDay.${r.timeOfDay}`) : r.timeOfDay,
    )
  if (r.region)
    parts.push(
      t('evolution.inRegion', { region: REGION_LABELS[r.region] ?? formatPokemonName(r.region) }),
    )

  return parts
}

/** Monta a frase curta no idioma atual: "Nível 16", "Usar Water Stone", "Trade holding King's Rock"… */
export function describeEvolution(requirement: EvolutionRequirement, t: Translate): string {
  const extras = extraConditions(requirement, t)
  const base = baseSentence(requirement, t)
  return extras.length ? `${base} ${extras.join(', ')}` : base
}

/** "lycanroc-midday" (espécie "lycanroc") -> "Midday" */
export function formLabel(pokemonName: string, speciesName: string): string {
  const suffix = pokemonName.startsWith(`${speciesName}-`)
    ? pokemonName.slice(speciesName.length + 1)
    : pokemonName
  return formatPokemonName(suffix)
}

const VERSION_GROUP_LABELS: Record<string, string> = {
  'red-blue': 'Red/Blue',
  yellow: 'Yellow',
  'gold-silver': 'Gold/Silver',
  crystal: 'Crystal',
  'ruby-sapphire': 'Ruby/Sapphire',
  emerald: 'Emerald',
  'firered-leafgreen': 'FireRed/LeafGreen',
  'diamond-pearl': 'Diamond/Pearl',
  platinum: 'Platinum',
  'heartgold-soulsilver': 'HeartGold/SoulSilver',
  'black-white': 'Black/White',
  'black-2-white-2': 'Black 2/White 2',
  'x-y': 'X/Y',
  'omega-ruby-alpha-sapphire': 'Omega Ruby/Alpha Sapphire',
  'sun-moon': 'Sun/Moon',
  'ultra-sun-ultra-moon': 'Ultra Sun/Ultra Moon',
  'lets-go-pikachu-lets-go-eevee': "Let's Go Pikachu/Eevee",
  'sword-shield': 'Sword/Shield',
  'the-isle-of-armor': 'Isle of Armor',
  'the-crown-tundra': 'Crown Tundra',
  'brilliant-diamond-and-shining-pearl': 'Brilliant Diamond/Shining Pearl',
  'legends-arceus': 'Legends: Arceus',
  'scarlet-violet': 'Scarlet/Violet',
  'the-teal-mask': 'The Teal Mask',
  'the-indigo-disk': 'The Indigo Disk',
}

/** "sword-shield" -> "Sword/Shield" */
export function formatVersionGroup(name: string): string {
  return VERSION_GROUP_LABELS[name] ?? formatPokemonName(name)
}
