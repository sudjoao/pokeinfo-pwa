import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import { usePokedexStore } from '@/stores/pokedex'
import { analyzeCoverage, analyzeDefense, coverageGaps, teamThreats } from '@/utils/typeChart'
import type { PokemonIndexEntry, PokemonType } from '@/types/pokemon'

export const TEAM_SIZE = 6

/** Membro do time: id da forma (ex.: raichu-alola), nome e tipos vindos do mapa em memória. */
export interface TeamMember {
  id: number
  name: string
  types: PokemonType[]
}

export type TeamToggleResult = 'added' | 'removed' | 'full'

/** `?team=25,6,131` -> [25, 6, 131] (ignora repetidos e inválidos, corta em 6). */
function teamParam(value: unknown): number[] {
  if (typeof value !== 'string' || !value) return []
  const ids = value
    .split(',')
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0)
  return [...new Set(ids)].slice(0, TEAM_SIZE)
}

/**
 * Time de até 6 Pokémon montado na hora, sem persistência: os ids ficam só na URL (`?team=`),
 * o que sobrevive a recarregar a página e permite compartilhar o link. Nomes e tipos vêm do
 * índice e do mapa de tipos já em memória, então montar o time não faz requisição nenhuma.
 */
export function useTeam() {
  const store = usePokedexStore()
  const route = useRoute()
  const router = useRouter()

  const ids = ref<number[]>(teamParam(route.query.team))

  const members = computed<TeamMember[]>(() =>
    ids.value.map((id) => ({
      id,
      name: store.entryOf(id)?.name ?? String(id),
      types: store.typesOf(id) ?? [],
    })),
  )

  const size = computed(() => ids.value.length)
  const isFull = computed(() => ids.value.length >= TEAM_SIZE)

  function has(id: number): boolean {
    return ids.value.includes(id)
  }

  function add(id: number): boolean {
    if (has(id) || isFull.value) return false
    ids.value = [...ids.value, id]
    return true
  }

  function remove(id: number): void {
    ids.value = ids.value.filter((item) => item !== id)
  }

  function toggle(id: number): TeamToggleResult {
    if (has(id)) {
      remove(id)
      return 'removed'
    }
    return add(id) ? 'added' : 'full'
  }

  function clear(): void {
    ids.value = []
  }

  // Um id fora do mapa de tipos (Pokémon lançado depois do cache) é buscado uma vez;
  // o mapa atualizado re-renderiza o membro com os tipos certos.
  watch(
    [ids, () => store.ready],
    ([list, ready]) => {
      if (!ready) return
      const missing = list
        .filter((id) => store.typesOf(id) === undefined)
        .map((id) => store.entryOf(id))
        .filter((entry): entry is PokemonIndexEntry => entry !== undefined)
      if (missing.length) store.ensureSummaries(missing).catch(() => {})
    },
    { immediate: true },
  )

  watch(ids, (list) => {
    const query: LocationQueryRaw = { ...route.query }
    if (list.length) query.team = list.join(',')
    else delete query.team
    router.replace({ query })
  })

  const defense = computed(() => analyzeDefense(members.value))
  const threats = computed(() => teamThreats(defense.value))
  const coverage = computed(() => analyzeCoverage(members.value))
  const gaps = computed(() => coverageGaps(coverage.value))

  return {
    ids,
    members,
    size,
    isFull,
    has,
    add,
    remove,
    toggle,
    clear,
    defense,
    threats,
    coverage,
    gaps,
  }
}
