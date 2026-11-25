import { shallowRef } from 'vue'
import type { PokemonDataRow } from '@/data/generated/pokemon'
import { STAT_NAMES, type PokemonStat } from '@/types/pokemon'

/**
 * Tabela estática de stats/habilidades/flags de todos os Pokémon (src/data/generated/pokemon.ts,
 * ~25 KB gz). Fica num chunk separado, carregado só quando alguma tela precisa (filtros avançados,
 * ordenação, comparação, lista de quem tem uma habilidade): a Home normal não paga por ela.
 */
export interface PokemonDataTable {
  rows: Readonly<Record<number, PokemonDataRow>>
  abilities: readonly (readonly [string, string])[]
  abilityIndex: ReadonlyMap<string, number>
}

const table = shallowRef<PokemonDataTable | null>(null)
/** Último erro ao baixar o chunk (offline sem cache): as telas mostram "tentar de novo". */
const error = shallowRef<unknown>(null)
let loading: Promise<PokemonDataTable> | null = null

export function loadPokemonData(): Promise<PokemonDataTable> {
  if (table.value) return Promise.resolve(table.value)
  if (!loading) {
    error.value = null
    loading = import('@/data/generated/pokemon').then(
      ({ POKEMON_DATA, ABILITIES }) => {
        table.value = {
          rows: POKEMON_DATA,
          abilities: ABILITIES,
          abilityIndex: new Map(ABILITIES.map(([slug], index) => [slug, index])),
        }
        return table.value
      },
      (reason: unknown) => {
        // Sem isto a promessa rejeitada ficaria guardada e nenhuma tentativa seguinte sairia.
        loading = null
        error.value = reason ?? new Error('Failed to load Pokémon data')
        throw reason
      },
    )
  }
  return loading
}

export const FLAG_LEGENDARY = 1
export const FLAG_MYTHICAL = 2
export const FLAG_BABY = 4

export function rowStats(row: PokemonDataRow): PokemonStat[] {
  return STAT_NAMES.map((name, index) => ({ name, value: row[index] as number }))
}

/** Ids (formas incluídas) que têm a habilidade, com a marca de oculta. */
export function pokemonWithAbility(
  data: PokemonDataTable,
  slug: string,
): { id: number; hidden: boolean }[] {
  const index = data.abilityIndex.get(slug)
  if (index === undefined) return []
  const result: { id: number; hidden: boolean }[] = []
  for (const [id, row] of Object.entries(data.rows)) {
    if (row[10].includes(index)) result.push({ id: Number(id), hidden: false })
    else if (row[11] === index) result.push({ id: Number(id), hidden: true })
  }
  return result.sort((a, b) => a.id - b.id)
}

/** Tabela já carregada (null até alguém chamar `loadPokemonData`) e o erro da última tentativa. */
export function usePokemonData() {
  return { table, error, load: loadPokemonData }
}
