import { POKEMON_TYPES, type PokemonIndexEntry, type PokemonType } from '@/types/pokemon'

/** Mapa "id do Pokémon (ou forma) -> tipos na ordem dos slots". */
export type TypeMap = Record<number, PokemonType[]>

export interface DexIndex {
  entries: PokemonIndexEntry[]
  types: TypeMap
}

/**
 * Decodifica o índice embutido no build (src/data/generated/dexIndex.ts): ids em intervalos,
 * nomes separados por espaço e dois caracteres de tipo por Pokémon ('a' = POKEMON_TYPES[0],
 * '-' = vazio). Os Pokémon com '--' ficam fora do mapa de tipos, como antes com a API.
 */
export function decodeDexIndex(
  ranges: readonly (readonly [number, number])[],
  names: string,
  types: string,
): DexIndex {
  const nameList = names.split(' ')
  const entries: PokemonIndexEntry[] = []
  const map: TypeMap = {}
  let i = 0
  for (const [first, last] of ranges) {
    for (let id = first; id <= last; id++, i++) {
      entries.push({ id, name: nameList[i]! })
      const list: PokemonType[] = []
      for (const code of types.slice(2 * i, 2 * i + 2)) {
        if (code !== '-') list.push(POKEMON_TYPES[code.charCodeAt(0) - 97] ?? 'unknown')
      }
      if (list.length) map[id] = list
    }
  }
  return { entries, types: map }
}
