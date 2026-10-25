import { describe, expect, it } from 'vitest'
import { parseBackupData, type BackupData } from '@/utils/backup'
import { decodeBitset, encodeBitset } from '@/utils/bitset'
import { EMPTY_STATS } from '@/utils/daily'
import { safeNextPath } from '@/utils/authRedirect'
import {
  canonicalData,
  EMPTY_DATA,
  isEmptyData,
  mergeData,
  mergeSet,
  sameData,
  stableStringify,
} from '@/utils/sync'

const bits = (...ids: number[]) => encodeBitset(new Set(ids))
const ids = (encoded: string | undefined) => [...decodeBitset(encoded ?? '')].sort((a, b) => a - b)

function data(change: Partial<BackupData>): BackupData {
  return { ...EMPTY_DATA, ...change }
}

const hunt = (count: number) => ({ count, charm: false, masuda: false, startedAt: '2026-10-01' })
const daily = (played: number) => ({ stats: { ...EMPTY_STATS, played }, game: null })

describe('mergeSet', () => {
  const set = (...values: number[]) => new Set(values)

  it('mantém o que os dois lados acrescentaram', () => {
    expect([...mergeSet(set(1), set(1, 2), set(1, 3))].sort()).toEqual([1, 2, 3])
  })

  it('aplica a remoção feita em qualquer lado', () => {
    expect([...mergeSet(set(1, 2), set(2), set(1, 2))]).toEqual([2])
    expect([...mergeSet(set(1, 2), set(1, 2), set(1))]).toEqual([1])
  })

  it('sem base, soma os dois lados', () => {
    expect([...mergeSet(set(), set(1), set(2))].sort()).toEqual([1, 2])
  })
})

describe('mergeData', () => {
  it('capturas offline em dois aparelhos entram as duas', () => {
    const base = data({ caught: { sv: bits(1, 2) } })
    const mac = data({ caught: { sv: bits(1, 2, 3) } })
    const iphone = data({ caught: { sv: bits(2), za: bits(10) } })
    const merged = mergeData(base, mac, iphone)
    expect(ids(merged.caught.sv)).toEqual([2, 3])
    expect(ids(merged.caught.za)).toEqual([10])
  })

  it('jogo esvaziado some do resultado', () => {
    const base = data({ shiny: { sv: bits(5) } })
    const merged = mergeData(base, data({}), base)
    expect(merged.shiny).toEqual({})
  })

  it('favoritos usam a mesma regra', () => {
    const base = data({ favorites: bits(25) })
    const merged = mergeData(base, data({ favorites: bits(25, 150) }), data({ favorites: '' }))
    expect(ids(merged.favorites)).toEqual([150])
  })

  it('caçadas: fica o lado que mudou; se os dois mudaram, o contador maior', () => {
    const base = data({ hunts: { 'sv:1': hunt(10), 'sv:2': hunt(5) } })
    const local = data({ hunts: { 'sv:1': hunt(12), 'sv:2': hunt(5) } })
    const remote = data({ hunts: { 'sv:1': hunt(30), 'sv:3': hunt(1) } })
    expect(mergeData(base, local, remote).hunts).toEqual({ 'sv:1': hunt(30), 'sv:3': hunt(1) })
  })

  it('caçada zerada num lado e contada no outro não se perde', () => {
    const base = data({ hunts: { 'sv:1': hunt(10) } })
    const merged = mergeData(base, data({}), data({ hunts: { 'sv:1': hunt(11) } }))
    expect(merged.hunts).toEqual({ 'sv:1': hunt(11) })
  })

  it('Pokémon do dia: fica o lado que mudou, ou quem jogou mais', () => {
    const base = data({ daily: daily(3) })
    expect(mergeData(base, base, data({ daily: daily(4) })).daily).toEqual(daily(4))
    expect(mergeData(base, data({ daily: daily(5) }), base).daily).toEqual(daily(5))
    expect(mergeData(base, data({ daily: daily(4) }), data({ daily: daily(6) })).daily).toEqual(
      daily(6),
    )
  })

  it('sem base é a soma dos dois', () => {
    const merged = mergeData(
      null,
      data({ caught: { sv: bits(1) }, hunts: { 'sv:1': hunt(3) } }),
      data({ caught: { sv: bits(2) }, hunts: { 'sv:1': hunt(8) } }),
    )
    expect(ids(merged.caught.sv)).toEqual([1, 2])
    expect(merged.hunts['sv:1']).toEqual(hunt(8))
  })

  it('mesclar o que já é igual não muda nada', () => {
    const value = data({ caught: { sv: bits(1, 2) }, favorites: bits(25), daily: daily(2) })
    expect(sameData(mergeData(value, value, value), value)).toBe(true)
  })
})

describe('comparação', () => {
  it('ordem das chaves e jogos vazios não importam', () => {
    expect(stableStringify({ b: 1, a: { d: 1, c: 2 } })).toBe('{"a":{"c":2,"d":1},"b":1}')
    expect(
      sameData(data({ caught: { sv: bits(1), za: '' } }), data({ caught: { sv: bits(1) } })),
    ).toBe(true)
  })

  it('coleção vazia', () => {
    expect(isEmptyData(EMPTY_DATA)).toBe(true)
    expect(isEmptyData(data({ caught: { sv: '' }, daily: daily(0) }))).toBe(true)
    expect(isEmptyData(data({ favorites: bits(1) }))).toBe(false)
  })
})

describe('safeNextPath', () => {
  it('aceita caminhos do app', () => {
    expect(safeNextPath('/team?t=25')).toBe('/team?t=25')
    expect(safeNextPath('/')).toBe('/')
  })

  it('recusa outros sites e valores estranhos', () => {
    for (const value of ['//evil.com', '/\\evil.com', 'https://evil.com', '/\tx', '/auth/callback'])
      expect(safeNextPath(value)).toBe('/')
    expect(safeNextPath(null)).toBe('/')
  })
})

describe('correções da revisão', () => {
  it('canonicalData é cópia profunda (a partida do dia muda no lugar)', () => {
    const game = { day: '2026-10-25', guesses: [1], done: false }
    const value = data({ daily: { stats: { ...EMPTY_STATS }, game } })
    const copy = canonicalData(value)
    game.guesses.push(2)
    expect(copy.daily?.game?.guesses).toEqual([1])
  })

  it('abrir o dia num aparelho não apaga os palpites do outro', () => {
    const base = data({ daily: { stats: { ...EMPTY_STATS }, game: null } })
    const local = data({
      daily: { stats: { ...EMPTY_STATS }, game: { day: 'D', guesses: [1, 2], done: false } },
    })
    const remote = data({
      daily: { stats: { ...EMPTY_STATS }, game: { day: 'D', guesses: [], done: false } },
    })
    expect(mergeData(base, local, remote).daily?.game?.guesses).toEqual([1, 2])
    expect(mergeData(base, remote, local).daily?.game?.guesses).toEqual([1, 2])
  })

  it('partidas de dias diferentes: fica a mais recente', () => {
    const base = data({ daily: { stats: { ...EMPTY_STATS }, game: null } })
    const old = data({
      daily: { stats: { ...EMPTY_STATS }, game: { day: '2026-10-24', guesses: [1], done: true } },
    })
    const today = data({
      daily: { stats: { ...EMPTY_STATS }, game: { day: '2026-10-25', guesses: [], done: false } },
    })
    expect(mergeData(base, old, today).daily?.game?.day).toBe('2026-10-25')
  })

  it('caçada: Shiny Charm ligado num lado e contagem no outro entram os dois', () => {
    const base = data({ hunts: { 'sv:1': hunt(10) } })
    const local = data({ hunts: { 'sv:1': { ...hunt(10), charm: true } } })
    const remote = data({ hunts: { 'sv:1': hunt(15) } })
    expect(mergeData(base, local, remote).hunts['sv:1']).toEqual({ ...hunt(15), charm: true })
  })
})

describe('parseBackupData', () => {
  it('descarta entradas inválidas sem perder as boas', () => {
    const parsed = parseBackupData(
      JSON.parse(
        '{"caught":{"sv":"Ag==","__proto__":"x","Bad Key":"y","za":3},' +
          '"hunts":{"sv:1":{"count":2,"charm":false,"masuda":true,"startedAt":"d"},' +
          '"sv:2":null,"__proto__":{"count":1,"charm":false,"masuda":false},"sv:3":{"count":-1,"charm":false,"masuda":false}}}',
      ),
    )
    expect(parsed.caught).toEqual({ sv: 'Ag==' })
    expect(Object.keys(parsed.hunts)).toEqual(['sv:1'])
    expect(Object.getPrototypeOf(parsed.hunts)).toBe(Object.prototype)
  })
})
