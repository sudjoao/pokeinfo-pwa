import { describe, expect, it } from 'vitest'
import { GAMES } from '@/data/games'
import { MOVES } from '@/data/generated/moves'
import { DEX_INDEX_NAMES, DEX_INDEX_RANGES } from '@/data/generated/dexIndex'
import type { LeagueSection, Trainer } from '@/types/trainers'
import { hasLeague, loadLeague } from '@/utils/league'
import {
  attackingTypes,
  categoryInGeneration,
  maxLevel,
  sameCondition,
  teamWeaknesses,
} from '@/utils/trainers'

const LEAGUE_GAMES = GAMES.filter((game) => hasLeague(game.slug))

const knownIds = new Set<number>()
for (const [first, last] of DEX_INDEX_RANGES)
  for (let id = first; id <= last; id++) knownIds.add(id)
expect(knownIds.size).toBe(DEX_INDEX_NAMES.split(' ').length)

/** Treinadores de uma seção contando as alternativas (Bea/Allister, trigêmeos) como um só. */
function slots(section: LeagueSection | undefined): number {
  if (!section) return 0
  return section.trainers.filter((trainer, index) => {
    const previous = section.trainers[index - 1]
    return !(trainer.when && previous?.when && previous.location === trainer.location)
  }).length
}

describe('hasLeague', () => {
  it('todo jogo da série principal tem liga, menos os Legends (sem ginásios)', () => {
    const without = GAMES.filter((game) => !hasLeague(game.slug)).map((game) => game.slug)
    expect(without).toEqual(['legends-arceus', 'legends-za'])
  })
})

describe.each(LEAGUE_GAMES.map((game) => [game.slug, game] as const))('%s', (slug) => {
  it('tem 8 ginásios (ou 4 grandes provações), Elite 4 e campeão', async () => {
    const league = await loadLeague(slug)
    const byKey = Object.fromEntries(league.map((section) => [section.key, section]))
    if (slug.includes('sun') || slug.includes('moon')) expect(slots(byKey.kahunas)).toBe(4)
    else expect(slots(byKey.gyms)).toBe(8)
    // Galar não tem Elite 4: a Champion Cup é um torneio com os líderes.
    expect(slots(byKey.elite4)).toBe(slug === 'sword-shield' ? 0 : 4)
    expect(byKey.champion?.trainers.length).toBe(1)
  })

  it('todo time tem de 1 a 6 Pokémon conhecidos, com níveis e golpes válidos', async () => {
    const league = await loadLeague(slug)
    const problems: string[] = []
    const check = (trainer: Trainer) => {
      for (const battle of trainer.battles) {
        for (const team of battle.teams) {
          if (team.pokemon.length < 1 || team.pokemon.length > 6) {
            problems.push(`${trainer.name}: ${team.pokemon.length} Pokémon`)
          }
          for (const pokemon of team.pokemon) {
            if (!knownIds.has(pokemon.id)) problems.push(`${trainer.name}: id ${pokemon.id}`)
            if (pokemon.level < 1 || pokemon.level > 100) {
              problems.push(`${trainer.name}: nível ${pokemon.level}`)
            }
            if (!pokemon.moves.length || pokemon.moves.length > 4) {
              problems.push(`${trainer.name}: ${pokemon.moves.length} golpes`)
            }
            for (const move of pokemon.moves) {
              if (!MOVES[move]) problems.push(`${trainer.name}: golpe ${move}`)
            }
          }
        }
      }
    }
    for (const section of league) section.trainers.forEach(check)
    expect(problems).toEqual([])
  })

  it('as versões citadas existem no jogo', async () => {
    const versions = new Set(GAMES.find((game) => game.slug === slug)!.versions.map((v) => v.slug))
    const league = await loadLeague(slug)
    const cited = league.flatMap((section) =>
      section.trainers.flatMap((trainer) => [
        trainer.when?.version,
        ...trainer.battles.flatMap((battle) => battle.teams.map((team) => team.when?.version)),
      ]),
    )
    expect(cited.filter((version) => version && !versions.has(version))).toEqual([])
  })
})

describe('dados conferidos com o jogo', () => {
  it('Brock em Red/Blue: Geodude 12 e Onix 14', async () => {
    const [gyms] = await loadLeague('red-blue')
    const brock = gyms!.trainers[0]!
    expect(brock.name).toBe('Brock')
    expect(brock.type).toBe('rock')
    const team = brock.battles[0]!.teams[0]!.pokemon
    expect(team.map((p) => [p.id, p.level])).toEqual([
      [74, 12],
      [95, 14],
    ])
  })

  it('Blue campeão em Red/Blue muda conforme o inicial do jogador', async () => {
    const league = await loadLeague('red-blue')
    const blue = league.find((section) => section.key === 'champion')!.trainers[0]!
    expect(blue.battles[0]!.teams.map((team) => team.when?.starter)).toEqual([1, 4, 7])
  })

  it('Sword e Shield trocam Bea por Allister no 4º ginásio', async () => {
    const league = await loadLeague('sword-shield')
    const gyms = league.find((section) => section.key === 'gyms')!.trainers
    expect(gyms.slice(3, 5).map((t) => [t.name, t.when?.version])).toEqual([
      ['Bea', 'sword'],
      ['Allister', 'shield'],
    ])
  })

  it('Katy em Scarlet/Violet terastaliza o Teddiursa em Inseto', async () => {
    const [gyms] = await loadLeague('scarlet-violet')
    const katy = gyms!.trainers[0]!
    const teddiursa = katy.battles[0]!.teams[0]!.pokemon.find((p) => p.id === 216)
    expect(teddiursa?.tera).toBe('bug')
    expect(katy.battles[0]!.note).toMatch(/Terastallize/)
  })

  it('Elite 4 de Platinum separa antes e depois de Stark Mountain', async () => {
    const league = await loadLeague('platinum')
    const aaron = league.find((section) => section.key === 'elite4')!.trainers[0]!
    expect(aaron.battles.map((b) => [b.kind, b.detail])).toEqual([
      ['first', 'Before Stark Mountain'],
      ['rematch', 'After Stark Mountain'],
    ])
    expect(maxLevel(aaron.battles[0]!.teams[0]!.pokemon)).toBe(53)
    expect(maxLevel(aaron.battles[1]!.teams[0]!.pokemon)).toBe(69)
  })

  it('formas regionais usam o id da forma (Ninetales de Alola do Kukui)', async () => {
    const league = await loadLeague('sun-moon')
    const kukui = league.find((section) => section.key === 'champion')!.trainers[0]!
    expect(kukui.battles[0]!.teams[0]!.pokemon.some((p) => p.id === 10104)).toBe(true)
  })
})

describe('categoryInGeneration', () => {
  it('até a 3ª geração a categoria vem do tipo', () => {
    expect(categoryInGeneration('physical', 'fire', 3)).toBe('special')
    expect(categoryInGeneration('special', 'ghost', 1)).toBe('physical')
    expect(categoryInGeneration('status', 'fire', 3)).toBe('status')
  })

  it('da 4ª geração em diante vale a do golpe', () => {
    expect(categoryInGeneration('physical', 'fire', 4)).toBe('physical')
  })
})

describe('teamWeaknesses', () => {
  it('Geodude e Onix (Pedra/Terra): Água e Planta acertam os dois', () => {
    const weak = teamWeaknesses(
      [
        ['rock', 'ground'],
        ['rock', 'ground'],
      ],
      1,
    )
    expect(weak.map((entry) => entry.type)).toEqual(expect.arrayContaining(['water', 'grass']))
    expect(weak.find((entry) => entry.type === 'water')?.count).toBe(2)
  })

  it('não sugere tipo resistido por tantos quanto acerta', () => {
    // Fogo acerta Planta, mas Água e Fogo resistem: saldo negativo.
    const weak = teamWeaknesses([['grass'], ['water'], ['fire']], 9)
    expect(weak.map((entry) => entry.type)).not.toContain('fire')
  })

  it('Fada só existe a partir da 6ª geração', () => {
    const dragons = [['dragon'], ['dragon']] as const
    expect(teamWeaknesses(dragons, 5).map((e) => e.type)).not.toContain('fairy')
    expect(teamWeaknesses(dragons, 6).map((e) => e.type)).toContain('fairy')
  })
})

describe('attackingTypes', () => {
  it('conta Pokémon por tipo de golpe de dano, sem os de status', () => {
    const types = attackingTypes(
      [
        { id: 6, level: 50, moves: ['flamethrower', 'fire-blast', 'growl'] },
        { id: 9, level: 50, moves: ['surf', 'ice-beam'] },
        { id: 59, level: 50, moves: ['flamethrower'] },
      ],
      'sword-shield',
    )
    expect(types).toEqual([
      { type: 'fire', count: 2 },
      { type: 'water', count: 1 },
      { type: 'ice', count: 1 },
    ])
  })
})

describe('sameCondition', () => {
  it('compara inicial, versão e Eevee do rival', () => {
    expect(sameCondition({ starter: 1 }, { starter: 1 })).toBe(true)
    expect(sameCondition({ starter: 1 }, { starter: 4 })).toBe(false)
    expect(sameCondition(undefined, undefined)).toBe(true)
    expect(sameCondition({ version: 'sword' }, undefined)).toBe(false)
  })
})
