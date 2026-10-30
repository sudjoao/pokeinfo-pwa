import { computed } from 'vue'
import { useCaughtStore } from '@/stores/caught'
import { useFavoritesStore } from '@/stores/favorites'
import { useHuntsStore, useShinyCaughtStore } from '@/stores/shiny'
import { useDailyStore } from '@/stores/daily'
import { useTeamsStore } from '@/stores/teams'
import type { ImportMode } from '@/stores/gameSet'
import {
  backupFileName,
  createBackup,
  encodeBackupParam,
  type Backup,
  type BackupData,
} from '@/utils/backup'
import { decodeBitset } from '@/utils/bitset'

/** Resumo de um backup (ou do que está no aparelho) para mostrar antes de exportar/importar. */
export interface BackupSummary {
  caught: number
  games: number
  shiny: number
  favorites: number
  hunts: number
  teams: number
}

function countSets(sets: Record<string, string>): number {
  return Object.values(sets).reduce((sum, encoded) => sum + decodeBitset(encoded).size, 0)
}

export function summarize(backup: BackupData): BackupSummary {
  return {
    caught: countSets(backup.caught),
    games: Object.keys(backup.caught).length,
    shiny: countSets(backup.shiny),
    favorites: decodeBitset(backup.favorites).size,
    hunts: Object.keys(backup.hunts).length,
    teams: Object.keys(backup.teams ?? {}).length,
  }
}

/** Exporta e importa capturados, shinies, favoritos, caçadas e times (arquivo JSON ou link). */
export function useBackup() {
  const caught = useCaughtStore()
  const shiny = useShinyCaughtStore()
  const favorites = useFavoritesStore()
  const hunts = useHuntsStore()
  const daily = useDailyStore()
  const teams = useTeamsStore()

  /** Tudo o que é salvo no backup e sincronizado com a conta. */
  function data(): BackupData {
    return {
      caught: caught.exportData(),
      shiny: shiny.exportData(),
      favorites: favorites.exportData(),
      hunts: hunts.exportData(),
      daily: daily.exportData(),
      teams: teams.exportData(),
    }
  }

  function current(): Backup {
    return createBackup(data())
  }

  /** Grava no aparelho o que os stores ainda estão segurando no debounce. */
  function flush(): void {
    caught.flush()
    shiny.flush()
    favorites.flush()
    hunts.flush()
    teams.flush()
  }

  const summary = computed(() => summarize(current()))

  function downloadFile(): void {
    const blob = new Blob([JSON.stringify(current(), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = backupFileName()
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function link(): string {
    const url = new URL('/', window.location.origin)
    url.searchParams.set('backup', encodeBackupParam(current()))
    return url.toString()
  }

  function restore(backup: BackupData, mode: ImportMode): void {
    caught.importData(backup.caught, mode)
    shiny.importData(backup.shiny, mode)
    favorites.importData(backup.favorites, mode)
    hunts.importData(backup.hunts, mode)
    if (backup.daily) daily.importData(backup.daily, mode)
    teams.importData(backup.teams ?? {}, mode)
  }

  return { summary, data, flush, downloadFile, link, restore }
}
