import { defineStore } from 'pinia'
import { computed, reactive } from 'vue'
import { decodeBitset, encodeBitset } from '@/utils/bitset'
import { readStorage, writeStorage } from '@/utils/storage'
import { notifyLocalChange } from '@/utils/localChanges'

export const FAVORITES_KEY = 'pokeinfo:favorites:v1'

/**
 * Pokémon favoritos (id da forma: Raichu de Alola é diferente do Raichu), salvos no aparelho
 * como bitset em base64. Não dependem de jogo.
 */
export const useFavoritesStore = defineStore('favorites', () => {
  const ids = reactive(decodeBitset(readStorage<string>(FAVORITES_KEY) ?? ''))

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
    writeStorage(FAVORITES_KEY, encodeBitset(ids))
  }

  const count = computed(() => ids.size)

  function isFavorite(id: number): boolean {
    return ids.has(id)
  }

  function toggle(id: number): void {
    if (ids.has(id)) ids.delete(id)
    else ids.add(id)
    persist()
  }

  function exportData(): string {
    return encodeBitset(ids)
  }

  function importData(encoded: string, mode: 'merge' | 'replace'): void {
    if (mode === 'replace') ids.clear()
    for (const id of decodeBitset(encoded)) ids.add(id)
    persist()
  }

  return { ids, count, isFavorite, toggle, exportData, importData, flush }
})
