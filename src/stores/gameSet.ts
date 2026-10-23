import { defineStore } from 'pinia'
import { reactive, toRaw } from 'vue'
import { decodeBitset, encodeBitset } from '@/utils/bitset'
import { readStorage, writeStorage } from '@/utils/storage'

/** Formato persistido (e do backup): um bitset em base64 por jogo (slug do version-group). */
export type PersistedGameSet = Record<string, string>

export type ImportMode = 'merge' | 'replace'

function decodeAll(saved: PersistedGameSet): Map<string, Set<number>> {
  const result = new Map<string, Set<number>>()
  for (const [game, encoded] of Object.entries(saved)) {
    if (typeof encoded !== 'string') continue
    const ids = decodeBitset(encoded)
    if (ids.size) result.set(game, ids)
  }
  return result
}

/**
 * Conjunto de ids de espécie por jogo, persistido no aparelho (capturados, shinies capturados).
 * A chave é o id da espécie (número nacional), então formas regionais e as várias Pokédex de um
 * mesmo jogo compartilham a marcação.
 *
 * Em memória fica um `Set` reativo por jogo: o Vue rastreia `has(id)` por chave, então só o card
 * tocado re-renderiza. No localStorage vai um bitset em base64 (~170 B por jogo).
 */
export function defineGameSetStore(id: string, storageKey: string) {
  return defineStore(id, () => {
    const byGame = reactive(decodeAll(readStorage<PersistedGameSet>(storageKey) ?? {}))

    function snapshot(): PersistedGameSet {
      const payload: PersistedGameSet = {}
      for (const [game, ids] of byGame) {
        if (ids.size) payload[game] = encodeBitset(ids)
      }
      return payload
    }

    let persistTimer: ReturnType<typeof setTimeout> | undefined
    function schedulePersist(): void {
      clearTimeout(persistTimer)
      persistTimer = setTimeout(() => writeStorage(storageKey, snapshot()), 300)
    }

    const EMPTY: ReadonlySet<number> = new Set()

    /** Conjunto reativo dos ids de espécie marcados no jogo (vazio quando nada foi marcado). */
    function caughtIn(game: string | null | undefined): ReadonlySet<number> {
      if (!game) return EMPTY
      return byGame.get(game) ?? EMPTY
    }

    /**
     * Leitura sem rastreamento reativo, para o filtro da listagem: a lista paginada não pode
     * encolher no meio de um lote quando o usuário marca um card, só quando o filtro é reaplicado.
     */
    function caughtInRaw(game: string | null | undefined): ReadonlySet<number> {
      if (!game) return EMPTY
      return toRaw(byGame).get(game) ?? EMPTY
    }

    function isCaught(game: string | null | undefined, speciesId: number): boolean {
      return caughtIn(game).has(speciesId)
    }

    function setCaught(game: string, speciesId: number, caught: boolean): void {
      let ids = byGame.get(game)
      if (!ids) {
        if (!caught) return
        byGame.set(game, new Set<number>())
        ids = byGame.get(game)!
      }
      if (caught) ids.add(speciesId)
      else ids.delete(speciesId)
      schedulePersist()
    }

    function toggle(game: string, speciesId: number): void {
      setCaught(game, speciesId, !isCaught(game, speciesId))
    }

    /** Dados no formato do backup. */
    function exportData(): PersistedGameSet {
      return snapshot()
    }

    /** Restaura um backup: soma ao que já existe ou substitui tudo. */
    function importData(data: PersistedGameSet, mode: ImportMode): void {
      if (mode === 'replace') byGame.clear()
      for (const [game, ids] of decodeAll(data)) {
        if (!byGame.has(game)) byGame.set(game, new Set())
        const target = byGame.get(game)!
        for (const speciesId of ids) target.add(speciesId)
      }
      schedulePersist()
    }

    /** Total marcado em cada jogo (para o resumo do backup). */
    function counts(): Record<string, number> {
      return Object.fromEntries([...byGame].map(([game, ids]) => [game, ids.size]))
    }

    return { caughtIn, caughtInRaw, isCaught, setCaught, toggle, exportData, importData, counts }
  })
}
