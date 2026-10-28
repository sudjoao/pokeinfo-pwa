import { ref, watch, type Ref } from 'vue'
import type { Game } from '@/data/games'
import type { RoutePokemon } from '@/types/pokemon'
import { usePokedexStore } from '@/stores/pokedex'
import { isStaticRoute, toRoutePokemon, type AnyGameRoute } from '@/utils/routes'
import { mapLimit } from '@/utils/async'

/** Áreas de um local baixadas ao mesmo tempo. */
const AREA_CONCURRENCY = 4

/**
 * Pokémon de cada local do jogo, baixados sob demanda e guardados enquanto o jogo não muda. A
 * lista e o mapa da aba "Rotas" usam o mesmo estado: trocar de visão não baixa nada de novo.
 */
export function useRouteEncounters(game: Readonly<Ref<Game>>) {
  const pokedexStore = usePokedexStore()

  const results = ref<Record<string, RoutePokemon[]>>({})
  const loading = ref<Record<string, boolean>>({})
  const failed = ref<Record<string, boolean>>({})

  /** Troca de jogo: os resultados são específicos do jogo, então não podem sobreviver à troca. */
  watch(
    () => game.value.slug,
    () => {
      results.value = {}
      loading.value = {}
      failed.value = {}
    },
  )

  async function load(route: AnyGameRoute): Promise<void> {
    if (results.value[route.location] || loading.value[route.location]) return

    if (isStaticRoute(route)) {
      // Já vem pronto (ex.: BDSP via Bulbapedia): só falta o nome, resolvido pelo índice em memória.
      results.value = {
        ...results.value,
        [route.location]: route.pokemon.map((pokemon) => ({
          ...pokemon,
          name: pokedexStore.entryOf(pokemon.id)?.name ?? String(pokemon.id),
        })),
      }
      return
    }

    const slug = game.value.slug
    loading.value = { ...loading.value, [route.location]: true }
    failed.value = { ...failed.value, [route.location]: false }
    try {
      // Covis de Dynamax chegam a 22 áreas: em lotes, para não abrir dezenas de requisições juntas.
      const dtos = await mapLimit(route.areas, AREA_CONCURRENCY, (area) =>
        pokedexStore.ensureAreaEncounters(area),
      )
      // O jogo mudou enquanto baixava: o resultado seria de outro jogo.
      if (game.value.slug !== slug) return
      results.value = { ...results.value, [route.location]: toRoutePokemon(dtos, game.value) }
    } catch {
      if (game.value.slug === slug) failed.value = { ...failed.value, [route.location]: true }
    } finally {
      if (game.value.slug === slug) loading.value = { ...loading.value, [route.location]: false }
    }
  }

  return { results, loading, failed, load }
}

export type RouteEncounters = ReturnType<typeof useRouteEncounters>
