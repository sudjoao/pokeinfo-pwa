// Gerado por scripts/gen-pokemon-data.mjs a partir da PokéAPI (typeefficacypast, pokemontypepast). Não editar à mão.

import type { PokemonType } from '@/types/pokemon'

/** [última geração em que valia, atacante, defensor, multiplicador] */
export const TYPE_CHART_PAST: readonly (readonly [number, PokemonType, PokemonType, number])[] = [[1,"poison","bug",2],[1,"bug","poison",2],[1,"ghost","psychic",0],[1,"ice","fire",1],[5,"ghost","steel",0.5],[5,"dark","steel",0.5]]

/** Pokémon -> [[última geração em que valia, tipos]] (ex.: Clefairy era Normal até a 5ª). */
export const PAST_TYPES: Readonly<Record<number, readonly (readonly [number, readonly PokemonType[]])[]>> = {35:[[5,["normal"]]],36:[[5,["normal"]]],39:[[5,["normal"]]],40:[[5,["normal"]]],81:[[1,["electric"]]],82:[[1,["electric"]]],122:[[5,["psychic"]]],173:[[5,["normal"]]],174:[[5,["normal"]]],175:[[5,["normal"]]],176:[[5,["normal","flying"]]],183:[[5,["water"]]],184:[[5,["water"]]],209:[[5,["normal"]]],210:[[5,["normal"]]],280:[[5,["psychic"]]],281:[[5,["psychic"]]],282:[[5,["psychic"]]],298:[[5,["normal"]]],303:[[5,["steel"]]],439:[[5,["psychic"]]],468:[[5,["normal","flying"]]],546:[[5,["grass"]]],547:[[5,["grass"]]],10008:[[4,["electric","ghost"]]],10009:[[4,["electric","ghost"]]],10010:[[4,["electric","ghost"]]],10011:[[4,["electric","ghost"]]],10012:[[4,["electric","ghost"]]]}
