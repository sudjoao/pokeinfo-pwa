import { defineStore } from 'pinia'
import { reactive, toRaw } from 'vue'
import { decodeBitset, encodeBitset } from '@/utils/bitset'
import { readStorage, writeStorage } from '@/utils/storage'

const CAUGHT_KEY = 'pokeinfo:caught:v1'

/** Formato persistido: um bitset em base64 por jogo (slug do version-group). */
type PersistedCaught = Record<string, string>

function restore(): Map<string, Set<number>> {
  const saved = readStorage<PersistedCaught>(CAUGHT_KEY) ?? {}
  const result = new Map<string, Set<number>>()
  for (const [game, encoded] of Object.entries(saved)) {
    const ids = decodeBitset(encoded)
    if (ids.size) result.set(game, ids)
  }
  return result
}

/**
 * Pokémon capturados pelo usuário, por jogo. A chave é o id da espécie (número nacional),
 * então formas regionais e as várias Pokédex de um mesmo jogo compartilham a marcação.
 *
 * Em memória fica um `Set` reativo por jogo: o Vue rastreia `has(id)` por chave,
 * então só o card tocado re-renderiza. No localStorage vai um bitset em base64 (~170 B por jogo).
 */
export const useCaughtStore = defineStore('caught', () => {
  const byGame = reactive(restore())

  let persistTimer: ReturnType<typeof setTimeout> | undefined
  function schedulePersist(): void {
    clearTimeout(persistTimer)
    persistTimer = setTimeout(() => {
      const payload: PersistedCaught = {}
      for (const [game, ids] of byGame) {
        if (ids.size) payload[game] = encodeBitset(ids)
      }
      writeStorage(CAUGHT_KEY, payload)
    }, 300)
  }

  const EMPTY: ReadonlySet<number> = new Set()

  /** Conjunto reativo dos ids de espécie capturados no jogo (vazio quando nada foi marcado). */
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
      ids = new Set<number>()
      byGame.set(game, ids)
      ids = byGame.get(game)!
    }
    if (caught) ids.add(speciesId)
    else ids.delete(speciesId)
    schedulePersist()
  }

  function toggle(game: string, speciesId: number): void {
    setCaught(game, speciesId, !isCaught(game, speciesId))
  }

  return { caughtIn, caughtInRaw, isCaught, setCaught, toggle }
})
