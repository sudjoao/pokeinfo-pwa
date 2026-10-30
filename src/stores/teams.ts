import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { readStorage, writeStorage } from '@/utils/storage'
import { notifyLocalChange } from '@/utils/localChanges'
import { parseTeams, type PersistedTeams } from '@/utils/backup'
import type { ImportMode } from './gameSet'

export const TEAMS_KEY = 'pokeinfo:teams:v1'

/** Chave do time montado sem jogo selecionado (Pokédex nacional). */
export const NATIONAL_TEAM = 'national'

const EMPTY: readonly number[] = []

/**
 * Time salvo de cada jogo (slug do version-group): ids das formas, na ordem escolhida. Um time por
 * jogo, para voltar ao do Let's Go sem remontar depois de mexer no do Scarlet. Poucos bytes no
 * localStorage, entra no backup e na sincronização com a conta.
 */
export const useTeamsStore = defineStore('teams', () => {
  const byGame = reactive<PersistedTeams>(parseTeams(readStorage(TEAMS_KEY)))

  let timer: ReturnType<typeof setTimeout> | undefined
  function persist(): void {
    clearTimeout(timer)
    timer = setTimeout(flush, 300)
    notifyLocalChange()
  }

  function flush(): void {
    if (timer === undefined) return
    clearTimeout(timer)
    timer = undefined
    writeStorage(TEAMS_KEY, exportData())
  }

  function keyOf(game: string | null | undefined): string {
    return game || NATIONAL_TEAM
  }

  function teamOf(game: string | null | undefined): readonly number[] {
    return byGame[keyOf(game)] ?? EMPTY
  }

  function setTeam(game: string | null | undefined, ids: readonly number[]): void {
    const key = keyOf(game)
    if (ids.length) byGame[key] = [...ids]
    else delete byGame[key]
    persist()
  }

  function exportData(): PersistedTeams {
    return Object.fromEntries(Object.entries(byGame).map(([game, ids]) => [game, [...ids]]))
  }

  /** "Somar" mantém o time que já existe no jogo e só traz os dos jogos sem time; "Substituir" troca tudo. */
  function importData(data: PersistedTeams, mode: ImportMode): void {
    if (mode === 'replace') {
      for (const game of Object.keys(byGame)) delete byGame[game]
    }
    for (const [game, ids] of Object.entries(data)) {
      if (ids.length && !byGame[game]?.length) byGame[game] = [...ids]
    }
    persist()
  }

  return { teamOf, setTeam, exportData, importData, flush }
})
