import { describe, expect, it } from 'vitest'
import type { EncounterDetailDto, LocationAreaDto } from '@/services/pokeapi/dto'
import { GAMES } from '@/data/games'
import { conditionCategory, conditionDomain, methodVariants } from '@/utils/encounterConditions'
import { toRoutePokemon } from '@/utils/routes'

const ref = (name: string) => ({ name, url: '' })

/** Detalhe de encontro com só o que o cálculo usa (formato de `/location-area`). */
function detail(chance: number, conditions: string[] = [], method = 'walk'): EncounterDetailDto {
  return {
    chance,
    min_level: 2,
    max_level: 4,
    method: ref(method),
    condition_values: conditions.map(ref),
  }
}

const TIME = new Map([['time', new Set(['time-morning', 'time-day', 'time-night'])]])
const SEASONS = new Map([
  ['season', new Set(['season-spring', 'season-summer', 'season-autumn', 'season-winter'])],
])

describe('conditionCategory', () => {
  it('usa o prefixo mais longo e as exceções', () => {
    expect(conditionCategory('time-morning')).toBe('time')
    expect(conditionCategory('max-den-rarity-common')).toBe('max-den-rarity')
    expect(conditionCategory('story-progress-national-dex')).toBe('story-progress')
    expect(conditionCategory('defeated-ghetsis')).toBe('story-progress')
    expect(conditionCategory('algo-novo')).toBe('algo-novo')
  })
})

describe('conditionDomain', () => {
  it('junta só as categorias variáveis da área', () => {
    const domain = conditionDomain([
      detail(10, ['time-day']),
      detail(10, ['time-night', 'radio-off']),
      detail(5, ['swarm-yes']),
    ])
    expect([...domain.keys()]).toEqual(['time'])
    expect([...domain.get('time')!]).toEqual(['time-day', 'time-night'])
  })
})

describe('methodVariants', () => {
  it('sem condição: uma variante que vale sempre', () => {
    expect(methodVariants([detail(20), detail(10)], TIME)).toEqual([{ conditions: [], chance: 30 }])
  })

  it('Pidgey na Rota 29 (Gold): 55% de manhã e de dia, nada à noite', () => {
    const details = [30, 20, 4, 1].flatMap((c) => [
      detail(c, ['time-day']),
      detail(c, ['time-morning']),
    ])
    expect(methodVariants(details, TIME)).toEqual([
      { conditions: ['time-morning', 'time-day'], chance: 55 },
    ])
  })

  it('Rattata na Rota 29 (Gold): mais comum à noite', () => {
    const details = [
      detail(10, ['time-night']),
      detail(5, ['time-day']),
      detail(5, ['time-morning']),
      detail(5, ['time-night']),
    ]
    expect(methodVariants(details, TIME)).toEqual([
      { conditions: ['time-night'], chance: 15 },
      { conditions: ['time-morning', 'time-day'], chance: 5 },
    ])
  })

  it('mesma chance o dia todo: sem rótulo de hora', () => {
    const details = ['time-morning', 'time-day', 'time-night'].map((t) => detail(10, [t]))
    expect(methodVariants(details, TIME)).toEqual([{ conditions: [], chance: 10 }])
  })

  it('Starly na Route 201 (Diamond): soma base, swarm, radar e slot2 padrão; ignora ruído', () => {
    const details = [
      detail(20, ['swarm-no']),
      detail(10, ['time-morning']),
      detail(10, ['time-day']),
      detail(11, ['radar-off']),
      detail(5),
      detail(4, ['slot2-none']),
      ...['ruby', 'sapphire', 'emerald', 'leafgreen'].map((g) => detail(8, [`slot2-${g}`])),
    ]
    expect(methodVariants(details, TIME)).toEqual([
      { conditions: ['time-morning', 'time-day'], chance: 50 },
      { conditions: ['time-night'], chance: 40 },
    ])
  })

  it('Doduo na Route 201 (Diamond): só aparece com swarm', () => {
    expect(methodVariants([detail(40, ['swarm-yes'])], TIME)).toEqual([
      { conditions: ['swarm-yes'], chance: 40 },
    ])
  })

  it('Qwilfish na Rota 32 (HGSS): swarm sobe muito a chance e vira variante', () => {
    const details = [detail(90, ['swarm-yes'], 'super-rod'), detail(10, [], 'super-rod')]
    expect(methodVariants(details, TIME)).toEqual([
      { conditions: ['swarm-yes'], chance: 100 },
      { conditions: [], chance: 10 },
    ])
  })

  it('Bellsprout na Rota 32 (HGSS): rádio desligado é o padrão, combinado com a hora', () => {
    const details = [
      detail(20, ['time-morning']),
      detail(20, ['time-day']),
      detail(10, ['radio-off', 'time-morning']),
      detail(10, ['radio-off', 'time-day']),
      detail(20, ['radio-off', 'time-night']),
    ]
    expect(methodVariants(details, TIME)).toEqual([
      { conditions: ['time-morning', 'time-day'], chance: 30 },
      { conditions: ['time-night'], chance: 20 },
    ])
  })

  it('Linoone na Rota 32 (HGSS): só com o rádio de Hoenn', () => {
    expect(methodVariants([detail(20, ['radio-hoenn'])], TIME)).toEqual([
      { conditions: ['radio-hoenn'], chance: 20 },
    ])
  })

  it('estações em Unova: só no inverno', () => {
    expect(methodVariants([detail(15, ['season-winter'])], SEASONS)).toEqual([
      { conditions: ['season-winter'], chance: 15 },
    ])
  })

  it('árvores de Headbutt: cada tipo de árvore é uma variante', () => {
    const details = [
      detail(50, ['headbutt-tree-common'], 'headbutt'),
      detail(80, ['headbutt-tree-rare'], 'headbutt'),
    ]
    expect(methodVariants(details, TIME)).toEqual([
      { conditions: ['headbutt-tree-rare'], chance: 80 },
      { conditions: ['headbutt-tree-common'], chance: 50 },
    ])
  })

  it('covis de Dynamax: raridade e estrelas não viram rótulo, fica o maior valor', () => {
    const details = [
      detail(40, ['max-den-rarity-common', 'max-den-rating-1-star'], 'max-raid'),
      detail(20, ['max-den-rarity-rare', 'max-den-rating-1-star'], 'max-raid'),
    ]
    expect(methodVariants(details, new Map())).toEqual([{ conditions: [], chance: 40 }])
  })
})

describe('toRoutePokemon com condições', () => {
  const gold = GAMES.find((g) => g.slug === 'gold-silver')!

  function encounter(name: string, id: number, details: EncounterDetailDto[]) {
    return {
      pokemon: { name, url: `https://pokeapi.co/api/v2/pokemon/${id}/` },
      version_details: [{ version: ref('gold'), max_chance: 100, encounter_details: details }],
    }
  }

  const route29: LocationAreaDto = {
    pokemon_encounters: [
      encounter(
        'pidgey',
        16,
        [30, 20, 4, 1].flatMap((c) => [detail(c, ['time-day']), detail(c, ['time-morning'])]),
      ),
      encounter('rattata', 19, [detail(15, ['time-night']), detail(5, ['time-day'])]),
      encounter('sentret', 161, [detail(20, [], 'headbutt')]),
    ],
  }

  it('usa a noite do Rattata para saber que o Pidgey não aparece à noite', () => {
    const [pidgey, sentret, rattata] = toRoutePokemon([route29], gold)
    expect(pidgey!.methods).toEqual([
      {
        slug: 'walk',
        chance: 55,
        variants: [{ conditions: ['time-morning', 'time-day'], chance: 55 }],
      },
    ])
    expect(sentret!.methods).toEqual([{ slug: 'headbutt', chance: 20 }])
    expect(rattata!.methods[0]!.variants).toEqual([
      { conditions: ['time-night'], chance: 15 },
      { conditions: ['time-day'], chance: 5 },
    ])
  })
})
