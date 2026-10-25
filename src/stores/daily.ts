import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readStorage, writeStorage } from '@/utils/storage'
import { notifyLocalChange } from '@/utils/localChanges'
import {
  DAILY_MAX_GUESSES,
  EMPTY_STATS,
  parseDaily,
  recordResult,
  type DailyGame,
  type DailyStats,
  type PersistedDaily,
} from '@/utils/daily'

const DAILY_KEY = 'pokeinfo:daily:v1'

/**
 * "Pokémon do dia": estatísticas e a partida do dia, salvas no aparelho (e no backup). O modo
 * treino não passa por aqui: não conta nas estatísticas.
 */
export const useDailyStore = defineStore('daily', () => {
  const saved = parseDaily(readStorage<unknown>(DAILY_KEY))
  const stats = ref<DailyStats>(saved?.stats ?? { ...EMPTY_STATS })
  const game = ref<DailyGame | null>(saved?.game ?? null)

  function persist(): void {
    writeStorage(DAILY_KEY, { stats: stats.value, game: game.value } satisfies PersistedDaily)
    notifyLocalChange()
  }

  /** Partida de `day`: a salva, se for do mesmo dia; senão uma nova. */
  function gameFor(day: string): DailyGame {
    if (game.value?.day !== day) {
      game.value = { day, guesses: [], done: false }
      persist()
    }
    return game.value
  }

  /** Registra um palpite; ao acertar ou esgotar as tentativas, fecha o dia nas estatísticas. */
  function guess(day: string, id: number, answer: number): void {
    const current = gameFor(day)
    if (current.done || current.guesses.includes(id)) return
    current.guesses = [...current.guesses, id]
    const won = id === answer
    if (won || current.guesses.length >= DAILY_MAX_GUESSES) {
      current.done = true
      stats.value = recordResult(stats.value, day, won, current.guesses.length)
    }
    persist()
  }

  function exportData(): PersistedDaily {
    return { stats: stats.value, game: game.value }
  }

  /** Mesclar fica com as estatísticas de quem jogou mais vezes (não dá para somar sem duplicar dias). */
  function importData(data: PersistedDaily, mode: 'merge' | 'replace'): void {
    if (mode === 'replace' || data.stats.played > stats.value.played) {
      stats.value = { ...data.stats }
      game.value = data.game
    }
    persist()
  }

  return { stats, game, gameFor, guess, exportData, importData }
})
