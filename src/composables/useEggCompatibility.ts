import { computed, ref, shallowRef } from 'vue'
import { getEggGroupSpecies } from '@/services/pokeapi/eggGroup.service'
import type { PokemonIndexEntry, PokemonSpecies } from '@/types/pokemon'

/** Grupos que não entram na lista: "no-eggs" não cruza e "ditto" só tem o próprio Ditto. */
const SKIPPED_GROUPS = new Set(['no-eggs', 'ditto'])

/** Espécies por grupo de ovo, só da sessão (a resposta crua fica no service worker). */
const groupCache = new Map<string, Promise<PokemonIndexEntry[]>>()

function speciesOf(group: string): Promise<PokemonIndexEntry[]> {
  let request = groupCache.get(group)
  if (!request) {
    request = getEggGroupSpecies(group)
    request.catch(() => groupCache.delete(group))
    groupCache.set(group, request)
  }
  return request
}

/** Quem cruza com a espécie: união dos grupos de ovo dela (sem ela mesma), sob demanda. */
export function useEggCompatibility() {
  const open = ref(false)
  const status = ref<'loading' | 'ready' | 'error'>('loading')
  const species = shallowRef<PokemonIndexEntry[]>([])
  const current = ref<PokemonSpecies | null>(null)

  const isDitto = computed(() => current.value?.eggGroups.includes('ditto') ?? false)

  async function load(): Promise<void> {
    const target = current.value
    if (!target || isDitto.value) return
    status.value = 'loading'
    try {
      const groups = target.eggGroups.filter((group) => !SKIPPED_GROUPS.has(group))
      const lists = await Promise.all(groups.map(speciesOf))
      if (current.value !== target) return
      const byId = new Map<number, PokemonIndexEntry>()
      for (const entry of lists.flat()) if (entry.id !== target.id) byId.set(entry.id, entry)
      species.value = [...byId.values()].sort((a, b) => a.id - b.id)
      status.value = 'ready'
    } catch {
      if (current.value === target) status.value = 'error'
    }
  }

  function show(value: PokemonSpecies): void {
    current.value = value
    open.value = true
    load()
  }

  return { open, status, species, isDitto, show, retry: load }
}
