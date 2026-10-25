import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { readStorage, writeStorage } from '@/utils/storage'
import { notifyLocalChange } from '@/utils/localChanges'
import { isHunt } from '@/utils/backup'
import { defineGameSetStore } from './gameSet'

/** Shinies capturados por jogo (separados dos capturados normais). */
export const SHINY_KEY = 'pokeinfo:shiny:v1'
export const useShinyCaughtStore = defineGameSetStore('shinyCaught', SHINY_KEY)

/** Uma caçada de shiny: encontros contados e os bônus que mudam a chance. */
export interface ShinyHunt {
  count: number
  /** Shiny Charm (Amuleto Brilhante). */
  charm: boolean
  /** Método Masuda (ovos de pais de idiomas diferentes). */
  masuda: boolean
  /** Data ISO do primeiro encontro contado. */
  startedAt: string
}

export type PersistedHunts = Record<string, ShinyHunt>

export const HUNTS_KEY = 'pokeinfo:hunts:v1'

/** Chave de uma caçada: jogo + espécie. */
export function huntKey(game: string, speciesId: number): string {
  return `${game}:${speciesId}`
}

/** Contadores de shiny hunt por jogo e espécie, salvos no aparelho. */
export const useHuntsStore = defineStore('hunts', () => {
  const hunts = reactive<PersistedHunts>(readStorage<PersistedHunts>(HUNTS_KEY) ?? {})

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
    writeStorage(HUNTS_KEY, { ...hunts })
  }

  function huntOf(game: string, speciesId: number): ShinyHunt | null {
    return hunts[huntKey(game, speciesId)] ?? null
  }

  function update(game: string, speciesId: number, change: Partial<ShinyHunt>): void {
    const key = huntKey(game, speciesId)
    const current = hunts[key] ?? {
      count: 0,
      charm: false,
      masuda: false,
      startedAt: new Date().toISOString(),
    }
    hunts[key] = { ...current, ...change, count: Math.max(0, change.count ?? current.count) }
    persist()
  }

  function reset(game: string, speciesId: number): void {
    delete hunts[huntKey(game, speciesId)]
    persist()
  }

  function exportData(): PersistedHunts {
    return { ...hunts }
  }

  function importData(data: PersistedHunts, mode: 'merge' | 'replace'): void {
    if (mode === 'replace') for (const key of Object.keys(hunts)) delete hunts[key]
    for (const [key, hunt] of Object.entries(data)) {
      if (!isHunt(hunt)) continue
      const current = hunts[key]
      // Ao somar, fica o contador maior (o mesmo caçada não deve andar para trás).
      if (!current || mode === 'replace' || hunt.count > current.count) hunts[key] = hunt
    }
    persist()
  }

  return { hunts, huntOf, update, reset, exportData, importData, flush }
})
