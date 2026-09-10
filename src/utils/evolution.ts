import { POKEMON_TYPES, type PokemonType } from '@/types/pokemon'
import { formatPokemonName, TYPE_STYLES } from '@/utils/pokemon'

/**
 * Condições de uma evolução já normalizadas (só nomes/números), independentes
 * do formato da PokéAPI. `describeEvolution` transforma isso em texto pt-BR.
 */
export interface EvolutionRequirement {
  trigger: string | null
  item: string | null
  heldItem: string | null
  gender: number | null
  knownMove: string | null
  knownMoveType: string | null
  location: string | null
  minLevel: number | null
  minHappiness: number | null
  minBeauty: number | null
  minAffection: number | null
  nearSpecialRock: boolean
  needsMultiplayer: boolean
  needsOverworldRain: boolean
  partySpecies: string | null
  partyType: string | null
  relativePhysicalStats: number | null
  timeOfDay: string | null
  tradeSpecies: string | null
  turnUpsideDown: boolean
  region: string | null
  usedMove: string | null
  minMoveCount: number | null
  minSteps: number | null
  minDamageTaken: number | null
}

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

const TIME_OF_DAY_LABELS: Record<string, string> = {
  day: 'de dia',
  night: 'à noite',
  dusk: 'ao entardecer',
  'full-moon': 'em noite de lua cheia',
}

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

function typeLabel(name: string): string {
  return (POKEMON_TYPES as readonly string[]).includes(name)
    ? TYPE_STYLES[name as PokemonType].label
    : formatPokemonName(name)
}

function formatMove(name: string): string {
  return formatPokemonName(name)
}

/** Frase principal, definida pelo gatilho da evolução. */
function baseSentence(r: EvolutionRequirement): string {
  const times = r.minMoveCount ? `${r.minMoveCount} vezes` : 'várias vezes'
  const move = r.usedMove ? formatMove(r.usedMove) : 'um golpe específico'

  switch (r.trigger) {
    case 'level-up':
      if (r.minLevel) return `Nível ${r.minLevel}`
      if (r.minSteps) return `Andar ${r.minSteps} passos no modo Let's Go e subir de nível`
      return 'Subir de nível'
    case 'trade':
      return r.tradeSpecies ? `Trocar por ${formatPokemonName(r.tradeSpecies)}` : 'Trocar'
    case 'use-item':
      return r.item ? `Usar ${formatItemName(r.item)}` : 'Usar um item'
    case 'shed':
      return 'Evoluir Nincada com uma vaga no time e uma Poké Bola sobrando'
    case 'spin':
      return 'Girar o personagem segurando um Sweet (doce)'
    case 'tower-of-darkness':
      return 'Concluir a Torre das Trevas'
    case 'tower-of-waters':
      return 'Concluir a Torre das Águas'
    case 'three-critical-hits':
      return 'Acertar 3 golpes críticos em uma única batalha'
    case 'take-damage':
      return `Receber ${r.minDamageTaken ?? 49}+ de dano sem desmaiar e passar sob o arco de pedra em Dusty Bowl`
    case 'agile-style-move':
      return `Usar ${move} no estilo ágil ${times}`
    case 'strong-style-move':
      return `Usar ${move} no estilo forte ${times}`
    case 'recoil-damage':
      return `Acumular ${r.minDamageTaken ?? 294}+ de dano de recuo sem desmaiar`
    case 'use-move':
      return `Usar ${move} ${times}`
    case 'three-defeated-bisharp':
      return "Derrotar 3 Bisharp que lideram um bando, segurando Leader's Crest"
    case 'gimmighoul-coins':
      return 'Subir de nível com 999 Gimmighoul Coins'
    case 'other':
      return r.minLevel ? `Nível ${r.minLevel} (condição especial)` : 'Condição especial'
    default:
      return r.minLevel ? `Nível ${r.minLevel}` : 'Método especial'
  }
}

/** Condições extras, na ordem em que aparecem na frase. */
function extraConditions(r: EvolutionRequirement): string[] {
  const parts: string[] = []

  if (r.heldItem) parts.push(`segurando ${formatItemName(r.heldItem)}`)
  if (r.knownMove) parts.push(`conhecendo ${formatMove(r.knownMove)}`)
  if (r.knownMoveType) parts.push(`conhecendo um golpe do tipo ${typeLabel(r.knownMoveType)}`)
  if (r.minHappiness) parts.push('com alta amizade')
  if (r.minAffection) parts.push('com alta afeição')
  if (r.minBeauty) parts.push(`com beleza ${r.minBeauty}+`)
  if (r.relativePhysicalStats === 1) parts.push('com Ataque maior que Defesa')
  if (r.relativePhysicalStats === -1) parts.push('com Ataque menor que Defesa')
  if (r.relativePhysicalStats === 0) parts.push('com Ataque igual à Defesa')
  if (r.gender === 1) parts.push('sendo fêmea')
  if (r.gender === 2) parts.push('sendo macho')
  if (r.partySpecies) parts.push(`com ${formatPokemonName(r.partySpecies)} no time`)
  if (r.partyType) parts.push(`com um Pokémon do tipo ${typeLabel(r.partyType)} no time`)
  if (r.location) parts.push(`em ${formatPokemonName(r.location)}`)
  if (r.nearSpecialRock) parts.push('perto de uma Moss Rock ou Icy Rock')
  if (r.needsOverworldRain) parts.push('com chuva no mapa')
  if (r.needsMultiplayer) parts.push('em Union Circle (multijogador)')
  if (r.turnUpsideDown) parts.push('com o console de cabeça para baixo')
  if (r.minSteps && r.trigger !== 'level-up')
    parts.push(`após andar ${r.minSteps} passos no modo Let's Go`)
  if (r.timeOfDay) parts.push(TIME_OF_DAY_LABELS[r.timeOfDay] ?? r.timeOfDay)
  if (r.region) parts.push(`na região de ${REGION_LABELS[r.region] ?? formatPokemonName(r.region)}`)

  return parts
}

/** Monta uma frase curta em pt-BR: "Nível 16", "Usar Pedra da Água", "Trocar segurando Rocha do Rei"… */
export function describeEvolution(requirement: EvolutionRequirement): string {
  const extras = extraConditions(requirement)
  const base = baseSentence(requirement)
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
