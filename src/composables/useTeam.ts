import { computed, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import { usePokedexStore } from '@/stores/pokedex'
import { useTeamsStore } from '@/stores/teams'
import type { Game } from '@/data/games'
import {
  analyzeCoverage,
  analyzeDefense,
  coverageGaps,
  teamThreats,
  typesInGeneration,
} from '@/utils/typeChart'
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
 * Time de até 6 Pokémon do jogo selecionado, salvo no aparelho (um por jogo, ver `useTeamsStore`):
 * a aba "Time" da Home e o team builder mostram o mesmo. Nomes e tipos vêm do índice e do mapa de
 * tipos já em memória, então montar o time não faz requisição nenhuma. A URL só leva o time num
 * link compartilhado (`?team=`), que `takeFromLink` traz para o jogo.
 */
export function useTeam(game: () => Game | null | undefined = () => null) {
  const store = usePokedexStore()
  const teams = useTeamsStore()
  const route = useRoute()
  const router = useRouter()
  const generation = () => game()?.generation

  const ids = computed<number[]>({
    get: () => [...teams.teamOf(game()?.slug)],
    set: (next) => teams.setTeam(game()?.slug, next),
  })

  const members = computed<TeamMember[]>(() =>
    ids.value.map((id) => ({
      id,
      name: store.entryOf(id)?.name ?? String(id),
      types: [...typesInGeneration(id, store.typesOf(id) ?? [], generation())],
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

  /** Troca o time inteiro (ex.: importado do Showdown). */
  function replace(next: readonly number[]): void {
    ids.value = [...new Set(next)].slice(0, TEAM_SIZE)
  }

  // Um id fora do mapa de tipos (Pokémon lançado depois do cache) é buscado uma vez;
  // o mapa atualizado re-renderiza o membro com os tipos certos.
  watch(
    ids,
    (list) => {
      const missing = list
        .filter((id) => store.typesOf(id) === undefined)
        .map((id) => store.entryOf(id))
        .filter((entry): entry is PokemonIndexEntry => entry !== undefined)
      if (missing.length) store.ensureSummaries(missing).catch(() => {})
    },
    { immediate: true },
  )

  /**
   * Link compartilhado (`?team=`): o time dele passa a ser o salvo do jogo, e o parâmetro sai da URL
   * (senão recarregar a página desfaria as mudanças feitas depois). Devolve o time que estava salvo,
   * para a tela oferecer desfazer; null quando a URL não trouxe time ou trouxe o mesmo.
   */
  function takeFromLink(): number[] | null {
    if (!('team' in route.query)) return null
    const incoming = teamParam(route.query.team)
    const query: LocationQueryRaw = { ...route.query }
    delete query.team
    router.replace({ query })
    const before = ids.value
    if (!incoming.length || incoming.join() === before.join()) return null
    replace(incoming)
    return before
  }

  /** Link para compartilhar: o team builder no jogo atual com os ids na URL. */
  function shareUrl(context: LocationQueryRaw): string {
    const query: LocationQueryRaw = { ...context }
    if (ids.value.length) query.team = ids.value.join(',')
    return new URL(router.resolve({ name: 'team', query }).href, window.location.origin).toString()
  }

  // Com um jogo selecionado, a análise usa a tabela de tipos e os tipos dos Pokémon da geração dele.
  const defense = computed(() => analyzeDefense(members.value, generation()))
  const threats = computed(() => teamThreats(defense.value))
  const coverage = computed(() => analyzeCoverage(members.value, generation()))
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
    replace,
    takeFromLink,
    shareUrl,
    defense,
    threats,
    coverage,
    gaps,
  }
}
