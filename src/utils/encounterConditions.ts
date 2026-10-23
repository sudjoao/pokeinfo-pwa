import type { EncounterDetailDto } from '@/services/pokeapi/dto'
import type { ConditionVariant } from '@/types/pokemon'

/**
 * Categorias da PokéAPI (`/encounter-condition`) pelo prefixo dos valores. A busca é pelo prefixo
 * mais longo, por isso a lista fica em ordem decrescente de tamanho.
 */
const CATEGORIES = [
  'alolan-diglett-found',
  'first-party-pokemon',
  'great-marsh-daily-slot',
  'johto-safari-blocks',
  'bug-catching-contest',
  'special-encounter',
  'friend-safari-slot',
  'honey-tree-group',
  'berry-tree-type',
  'trash-can-type',
  'story-progress',
  'max-den-rarity',
  'max-den-rating',
  'headbutt-tree',
  'tv-option',
  'save-data',
  'weekday',
  'starter',
  'backlot',
  'weather',
  'season',
  'swarm',
  'radar',
  'slot2',
  'radio',
  'other',
  'trade',
  'coins',
  'item',
  'time',
].sort((a, b) => b.length - a.length)

/** Valores cujo prefixo não diz a categoria. */
const CATEGORY_EXCEPTIONS: Readonly<Record<string, string>> = {
  'defeated-ghetsis': 'story-progress',
  'other-complete-mt-battle': 'story-progress',
}

/** Estado do mundo que muda sozinho: a chance aparece separada por valor (manhã, verão…). */
const VARIABLE = new Set(['time', 'season', 'weekday'])

/**
 * Categorias que não viram rótulo: detalhes internos demais (raridade do covil, blocos do Safari,
 * moedas). Entram pelo maior valor, como antes de existir a separação por condição.
 */
const COLLAPSED = new Set([
  'max-den-rarity',
  'max-den-rating',
  'weather',
  'johto-safari-blocks',
  'great-marsh-daily-slot',
  'coins',
  'trade',
  'berry-tree-type',
  'trash-can-type',
  'alolan-diglett-found',
  'friend-safari-slot',
  'honey-tree-group',
])

/** "swarm-no", "radar-off", "slot2-none"…: o estado sem nada especial ligado. */
const DEFAULT_VALUE = /-(no|off|none|inactive|not-mentioned)$/

/**
 * Um gatilho (swarm, rádio, radar, slot2) só vira variante própria se o pokémon só aparece com
 * ele ou se a chance sobe pelo menos isto; senão é ruído (ex.: slot2 mexendo 4 pontos no Starly).
 */
const MIN_TRIGGER_GAIN = 10

/** Ordem de exibição dos valores variáveis; o resto fica na ordem alfabética. */
const VALUE_ORDER = [
  'time-morning',
  'time-day',
  'time-night',
  'time-04-00-to-19-59',
  'time-20-00-to-21-59',
  'time-21-00-to-03-59',
  'time-minute-00-to-19',
  'time-minute-20-to-39',
  'time-minute-40-to-59',
  'season-spring',
  'season-summer',
  'season-autumn',
  'season-winter',
  'weekday-sunday',
  'weekday-monday',
  'weekday-tuesday',
  'weekday-wednesday',
  'weekday-thursday',
  'weekday-friday',
  'weekday-saturday',
]

function valueRank(value: string): number {
  const index = VALUE_ORDER.indexOf(value)
  return index === -1 ? VALUE_ORDER.length : index
}

function compareValues(a: string, b: string): number {
  return valueRank(a) - valueRank(b) || a.localeCompare(b)
}

/** "time-morning" -> "time"; valor desconhecido vira a própria categoria. */
export function conditionCategory(value: string): string {
  return CATEGORY_EXCEPTIONS[value] ?? CATEGORIES.find((c) => value.startsWith(`${c}-`)) ?? value
}

/** Valores variáveis (hora, estação, dia) vistos numa área para uma versão, por categoria. */
export type ConditionDomain = ReadonlyMap<string, ReadonlySet<string>>

/**
 * Junta os valores variáveis de todos os detalhes de uma área: o Pidgey da Rota 29 só tem
 * manhã e dia, e é a noite do Rattata que mostra que ele falta à noite.
 */
export function conditionDomain(details: Iterable<EncounterDetailDto>): ConditionDomain {
  const domain = new Map<string, Set<string>>()
  for (const detail of details) {
    for (const { name } of detail.condition_values) {
      const category = conditionCategory(name)
      if (!VARIABLE.has(category)) continue
      if (!domain.has(category)) domain.set(category, new Set())
      domain.get(category)!.add(name)
    }
  }
  return domain
}

/** Todas as combinações de um valor por categoria variável (ex.: manhã/dia/noite). */
function combinations(domain: ConditionDomain): string[][] {
  let combos: string[][] = [[]]
  for (const values of domain.values()) {
    combos = combos.flatMap((combo) => [...values].sort(compareValues).map((v) => [...combo, v]))
  }
  return combos
}

/**
 * Variações de chance de um método numa versão. Modelo da PokéAPI: um detalhe sem condição vale
 * sempre; detalhes com valores da mesma categoria são alternativas, e a chance num estado do
 * mundo é a soma dos detalhes cujas condições ele satisfaz (Route 201 em Diamond: base +
 * swarm + radar + slot2 + hora = 100%).
 */
export function methodVariants(
  details: readonly EncounterDetailDto[],
  domain: ConditionDomain,
): ConditionVariant[] {
  const parsed = details.map((detail) => ({
    chance: detail.chance,
    conditions: detail.condition_values.map(({ name }) => ({
      value: name,
      category: conditionCategory(name),
    })),
  }))

  // Só as categorias variáveis que este método usa; os valores vêm da área inteira.
  const used = new Set(
    parsed.flatMap((d) => d.conditions.map((c) => c.category)).filter((c) => VARIABLE.has(c)),
  )
  const localDomain = new Map([...domain].filter(([category]) => used.has(category)))
  const combos = combinations(localDomain)

  // Estados: o padrão (nada ligado) e cada conjunto de gatilhos que algum detalhe exige.
  const states = new Map<string, string[]>([['', []]])
  for (const detail of parsed) {
    const triggers = detail.conditions
      .filter((c) => !VARIABLE.has(c.category) && !DEFAULT_VALUE.test(c.value))
      .map((c) => c.value)
      .sort()
    states.set(triggers.join('+'), triggers)
  }

  function chanceIn(triggers: readonly string[], combo: readonly string[]): number {
    const activeCategories = new Set(triggers.map(conditionCategory))
    let total = 0
    for (const detail of parsed) {
      const satisfied = detail.conditions.every(({ value, category }) => {
        if (VARIABLE.has(category)) return combo.includes(value)
        if (DEFAULT_VALUE.test(value)) return !activeCategories.has(category)
        return triggers.includes(value)
      })
      if (satisfied) total += detail.chance
    }
    return total
  }

  const defaultChances = combos.map((combo) => chanceIn([], combo))
  const defaultMax = Math.max(0, ...defaultChances)

  const variants = new Map<string, ConditionVariant>()
  function add(conditions: string[], chance: number): void {
    const key = conditions.join('+')
    const current = variants.get(key)
    if (!current || chance > current.chance) variants.set(key, { conditions, chance })
  }

  for (const triggers of states.values()) {
    const chances = triggers.length
      ? combos.map((combo) => chanceIn(triggers, combo))
      : defaultChances
    const max = Math.max(0, ...chances)
    if (max === 0) continue
    if (triggers.length && defaultMax > 0 && max - defaultMax < MIN_TRIGGER_GAIN) continue

    const labels = triggers.filter((value) => !COLLAPSED.has(conditionCategory(value)))
    if (chances.every((chance) => chance === max)) {
      add(labels, max)
    } else if (localDomain.size === 1) {
      // Uma categoria variável: junta os valores com a mesma chance ("manhã/dia 55%").
      const byChance = new Map<number, string[]>()
      combos.forEach((combo, index) => {
        const chance = chances[index]!
        if (chance === 0) return
        byChance.set(chance, [...(byChance.get(chance) ?? []), ...combo])
      })
      for (const [chance, values] of byChance) add([...labels, ...values], chance)
    } else {
      combos.forEach((combo, index) => {
        if (chances[index]! > 0) add([...labels, ...combo], chances[index]!)
      })
    }
  }

  return [...variants.values()].sort((a, b) => b.chance - a.chance)
}
