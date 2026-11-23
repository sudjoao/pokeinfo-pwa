import { describe, expect, it } from 'vitest'
import type { PokemonVariety } from '@/types/pokemon'
import { GAMES } from '@/data/games'
import {
  hasMegaEvolution,
  isMega,
  megaExistsIn,
  megaLabel,
  megaEntriesOf,
  megaLineOf,
  pokemonLabel,
  withoutMegas,
} from '@/utils/megas'

/** Variedades como vêm de `/pokemon-species` (a primeira é a forma padrão). */
function varieties(...list: [number, string][]): PokemonVariety[] {
  return list.map(([pokemonId, name], i) => ({ pokemonId, name, isDefault: i === 0 }))
}

const CHARIZARD = varieties(
  [6, 'charizard'],
  [10034, 'charizard-mega-x'],
  [10035, 'charizard-mega-y'],
  [10196, 'charizard-gmax'],
)
const ABSOL = varieties([359, 'absol'], [10057, 'absol-mega'], [10307, 'absol-mega-z'])
const MEOWSTIC = varieties(
  [678, 'meowstic-male'],
  [10025, 'meowstic-female'],
  [10314, 'meowstic-male-mega'],
  [10326, 'meowstic-female-mega'],
)
const ZYGARDE = varieties(
  [718, 'zygarde-50'],
  [10120, 'zygarde-complete'],
  [10181, 'zygarde-10'],
  [10301, 'zygarde-mega'],
)
const FLOETTE = varieties([670, 'floette'], [10061, 'floette-eternal'], [10296, 'floette-mega'])

const ids = (list: PokemonVariety[] | undefined) => list?.map((variety) => variety.pokemonId)

describe('megaExistsIn', () => {
  it('sem jogo (Pokédex Nacional) vale qualquer mega, e só mega', () => {
    expect(megaExistsIn(10034, null)).toBe(true)
    expect(megaExistsIn(10278, null)).toBe(true)
    expect(megaExistsIn(10196, null)).toBe(false) // Gigantamax
    expect(megaExistsIn(10077, null)).toBe(false) // Kyogre Primal
    expect(megaExistsIn(6, null)).toBe(false)
  })

  it('X/Y só tem as megas que estrearam nele', () => {
    expect(megaExistsIn(10034, 'x-y')).toBe(true)
    expect(megaExistsIn(10090, 'x-y')).toBe(false) // Beedrill é de ORAS
    expect(megaExistsIn(10278, 'x-y')).toBe(false) // Clefable é de Z-A
  })

  it('de ORAS a Ultra Sun/Ultra Moon valem todas as da 6ª geração', () => {
    for (const game of ['omega-ruby-alpha-sapphire', 'sun-moon', 'ultra-sun-ultra-moon']) {
      expect(megaExistsIn(10034, game)).toBe(true)
      expect(megaExistsIn(10090, game)).toBe(true)
      expect(megaExistsIn(10278, game)).toBe(false)
    }
  })

  it("Let's Go só tem as megas das espécies de Kanto", () => {
    const game = 'lets-go-pikachu-lets-go-eevee'
    expect(megaExistsIn(10034, game)).toBe(true)
    expect(megaExistsIn(10090, game)).toBe(true)
    expect(megaExistsIn(10059, game)).toBe(false) // Lucario
    expect(megaExistsIn(10278, game)).toBe(false) // Clefable é de Kanto, mas a mega é de Z-A
  })

  it('Legends: Z-A tem as antigas e as novas', () => {
    expect(megaExistsIn(10034, 'legends-za')).toBe(true)
    expect(megaExistsIn(10090, 'legends-za')).toBe(true)
    expect(megaExistsIn(10278, 'legends-za')).toBe(true)
    expect(megaExistsIn(10310, 'legends-za')).toBe(true) // Lucario Z (DLC)
  })

  it('jogos sem Mega Evolução não têm nenhuma', () => {
    for (const game of ['red-blue', 'black-white', 'sword-shield', 'scarlet-violet']) {
      expect(megaExistsIn(10034, game)).toBe(false)
    }
  })

  it('todo jogo com mega é um jogo da lista do app', () => {
    const withMegas = GAMES.filter((game) => hasMegaEvolution(game.slug)).map((game) => game.slug)
    expect(withMegas).toEqual([
      'x-y',
      'omega-ruby-alpha-sapphire',
      'sun-moon',
      'ultra-sun-ultra-moon',
      'lets-go-pikachu-lets-go-eevee',
      'legends-za',
    ])
  })
})

describe('megaLabel', () => {
  it('põe "Mega" na frente e a variante no fim', () => {
    expect(megaLabel('clefable-mega')).toBe('Mega Clefable')
    expect(megaLabel('charizard-mega-x')).toBe('Mega Charizard X')
    expect(megaLabel('absol-mega-z')).toBe('Mega Absol Z')
    expect(megaLabel('meganium-mega')).toBe('Mega Meganium')
    expect(megaLabel('meowstic-female-mega')).toBe('Mega Meowstic Female')
  })
})

describe('withoutMegas', () => {
  it('tira só as megas das formas', () => {
    expect(ids(withoutMegas(CHARIZARD))).toEqual([6, 10196])
    expect(isMega(10196)).toBe(false)
  })
})

describe('megaLineOf', () => {
  it('na forma base lista as megas dela', () => {
    const line = megaLineOf(CHARIZARD, 6, null)
    expect(line?.base.pokemonId).toBe(6)
    expect(ids(line?.megas)).toEqual([10034, 10035])
  })

  it('numa mega mostra a forma de origem e as megas irmãs', () => {
    const line = megaLineOf(CHARIZARD, 10035, 'x-y')
    expect(line?.base.pokemonId).toBe(6)
    expect(ids(line?.megas)).toEqual([10034, 10035])
  })

  it('filtra pelo jogo', () => {
    expect(ids(megaLineOf(ABSOL, 359, 'x-y')?.megas)).toEqual([10057])
    expect(ids(megaLineOf(ABSOL, 359, 'legends-za')?.megas)).toEqual([10057, 10307])
    expect(megaLineOf(ABSOL, 359, 'scarlet-violet')).toBeNull()
    expect(megaLineOf(CHARIZARD, 6, 'sword-shield')).toBeNull()
  })

  it('a mega aberta aparece mesmo num jogo em que não existe', () => {
    const line = megaLineOf(ABSOL, 10307, 'x-y')
    expect(line?.base.pokemonId).toBe(359)
    expect(ids(line?.megas)).toEqual([10057, 10307])
    expect(ids(megaLineOf(ABSOL, 10307, 'scarlet-violet')?.megas)).toEqual([10307])
  })

  it('formas que não megaevoluem não ganham a seção', () => {
    expect(megaLineOf(CHARIZARD, 10196, null)).toBeNull() // Gigantamax
    expect(megaLineOf(ZYGARDE, 10181, null)).toBeNull()
    expect(
      megaLineOf(varieties([25, 'pikachu'], [10080, 'pikachu-rock-star']), 25, null),
    ).toBeNull()
  })

  it('cada forma tem a própria mega (Meowstic macho e fêmea)', () => {
    expect(ids(megaLineOf(MEOWSTIC, 678, null)?.megas)).toEqual([10314])
    expect(ids(megaLineOf(MEOWSTIC, 10025, null)?.megas)).toEqual([10326])
    expect(megaLineOf(MEOWSTIC, 10326, null)?.base.pokemonId).toBe(10025)
  })

  it('Zygarde megaevolui da forma Completa e Floette, da Flor Eterna', () => {
    expect(megaLineOf(ZYGARDE, 718, null)).toBeNull()
    expect(ids(megaLineOf(ZYGARDE, 10120, null)?.megas)).toEqual([10301])
    expect(megaLineOf(ZYGARDE, 10301, null)?.base.pokemonId).toBe(10120)
    expect(megaLineOf(FLOETTE, 670, null)).toBeNull()
    expect(megaLineOf(FLOETTE, 10296, null)?.base.pokemonId).toBe(10061)
  })
})

describe('pokemonLabel', () => {
  it('só as megas ganham o nome com "Mega" na frente', () => {
    expect(pokemonLabel(10034, 'charizard-mega-x')).toBe('Mega Charizard X')
    expect(pokemonLabel(10196, 'charizard-gmax')).toBe('Charizard Gmax')
    expect(pokemonLabel(154, 'meganium')).toBe('Meganium')
  })
})

describe('megaEntriesOf', () => {
  const NAMES: Record<number, string> = {
    10034: 'charizard-mega-x',
    10035: 'charizard-mega-y',
    10057: 'absol-mega',
    10307: 'absol-mega-z',
    10278: 'clefable-mega',
  }
  const nameOf = (id: number) => NAMES[id]

  it('segue a ordem da Pokédex e leva os números da espécie', () => {
    const dex = [
      { id: 359, speciesId: 359, dexNumber: 1 },
      { id: 25, speciesId: 25, dexNumber: 2 },
      { id: 6, speciesId: 6, dexNumber: 3 },
    ]
    expect(megaEntriesOf(dex, 'legends-za', nameOf)).toEqual([
      { id: 10057, name: 'absol-mega', speciesId: 359, dexNumber: 1 },
      { id: 10307, name: 'absol-mega-z', speciesId: 359, dexNumber: 1 },
      { id: 10034, name: 'charizard-mega-x', speciesId: 6, dexNumber: 3 },
      { id: 10035, name: 'charizard-mega-y', speciesId: 6, dexNumber: 3 },
    ])
  })

  it('só traz as megas que existem no jogo', () => {
    const dex = [
      { id: 36, speciesId: 36, dexNumber: 1 },
      { id: 359, speciesId: 359, dexNumber: 2 },
    ]
    expect(megaEntriesOf(dex, 'x-y', nameOf).map((entry) => entry.id)).toEqual([10057])
    expect(megaEntriesOf(dex, 'sword-shield', nameOf)).toEqual([])
  })

  it('na Nacional, as formas soltas não repetem as megas da espécie', () => {
    const national = [{ id: 6 }, { id: 10034 }, { id: 10035 }, { id: 10196 }]
    const result = megaEntriesOf(national, null, nameOf)
    expect(result.map((entry) => entry.id)).toEqual([10034, 10035])
    expect(result[0]?.speciesId).toBe(6)
    expect(result[0]?.dexNumber).toBeUndefined()
  })

  it('forma regional na Pokédex conta como a espécie', () => {
    expect(
      megaEntriesOf([{ id: 10100, speciesId: 26, dexNumber: 1 }], 'legends-za', () => 'x'),
    ).toHaveLength(2)
  })
})
