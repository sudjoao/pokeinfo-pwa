import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { usePokedexStore } from '@/stores/pokedex'
import { DEX_INDEX_DATE } from '@/data/generated/dexIndex'
import type { PokemonIndexEntry } from '@/types/pokemon'

/** Índice e tipos vêm do build; a API só é chamada na conferência semanal e para tipos faltando. */
const disk = new Map<string, string>()
Object.assign(globalThis, {
  localStorage: {
    getItem: (key: string) => disk.get(key) ?? null,
    setItem: (key: string, value: string) => void disk.set(key, value),
    removeItem: (key: string) => void disk.delete(key),
  },
})

const NEW_FORM: PokemonIndexEntry = { id: 99999, name: 'pikachu-futuro' }
const getPokemonIndex = vi.fn()
const getPokemonSummary = vi.fn()

vi.mock('@/services/pokeapi/pokemon.service', () => ({
  getPokemonIndex: () => getPokemonIndex(),
  getPokemonSummary: (id: number) => getPokemonSummary(id),
}))

const DAY = 24 * 60 * 60 * 1000
const BUILD = Date.parse(DEX_INDEX_DATE)

beforeEach(() => {
  disk.clear()
  getPokemonIndex.mockReset().mockResolvedValue([{ id: 1, name: 'bulbasaur' }, NEW_FORM])
  getPokemonSummary.mockReset().mockResolvedValue({ ...NEW_FORM, types: ['electric'] })
  vi.useFakeTimers()
  setActivePinia(createPinia())
})

afterEach(() => vi.useRealTimers())

describe('usePokedexStore', () => {
  it('abre com o índice e os tipos do build, sem requisição', () => {
    vi.setSystemTime(BUILD + DAY)
    const store = usePokedexStore()
    expect(store.entryOf(6)?.name).toBe('charizard')
    expect(store.typesOf(6)).toEqual(['fire', 'flying'])
    vi.runAllTimers()
    expect(getPokemonIndex).not.toHaveBeenCalled()
  })

  it('apaga o índice e o mapa de tipos antigos do localStorage', () => {
    vi.setSystemTime(BUILD)
    disk.set('pokeinfo:index:v1', '[]')
    disk.set('pokeinfo:types:v1', '{}')
    usePokedexStore()
    expect(disk.has('pokeinfo:index:v1')).toBe(false)
    expect(disk.has('pokeinfo:types:v1')).toBe(false)
  })

  it('uma semana depois do build, confere a API e guarda só o que é novo', async () => {
    vi.setSystemTime(BUILD + 8 * DAY)
    const store = usePokedexStore()
    expect(store.entryOf(NEW_FORM.id)).toBeUndefined()
    await vi.runAllTimersAsync()
    expect(getPokemonIndex).toHaveBeenCalledOnce()
    expect(store.entryOf(NEW_FORM.id)).toEqual(NEW_FORM)
    expect(store.index.at(-1)).toEqual(NEW_FORM)

    const [summary] = await store.ensureSummaries([NEW_FORM])
    expect(summary?.types).toEqual(['electric'])

    const saved = JSON.parse(disk.get('pokeinfo:index-extra:v1')!)
    expect(saved.entries).toEqual([NEW_FORM])
    expect(saved.types).toEqual({ [NEW_FORM.id]: [4] })

    // Outra abertura: o novo já vem do localStorage e a próxima conferência fica para daqui a 7 dias.
    setActivePinia(createPinia())
    const reopened = usePokedexStore()
    expect(reopened.entryOf(NEW_FORM.id)).toEqual(NEW_FORM)
    expect(reopened.typesOf(NEW_FORM.id)).toEqual(['electric'])
    await vi.runAllTimersAsync()
    expect(getPokemonIndex).toHaveBeenCalledOnce()
  })

  it('sem rede, não marca a conferência e tenta de novo na próxima abertura', async () => {
    vi.setSystemTime(BUILD + 8 * DAY)
    getPokemonIndex.mockRejectedValueOnce(new Error('offline'))
    usePokedexStore()
    await vi.runAllTimersAsync()
    expect(disk.has('pokeinfo:index-extra:v1')).toBe(false)

    setActivePinia(createPinia())
    usePokedexStore()
    await vi.runAllTimersAsync()
    expect(getPokemonIndex).toHaveBeenCalledTimes(2)
  })
})
