import { ref } from 'vue'
import { readStorage, writeStorage } from '@/utils/storage'

const LIST_SHINY_KEY = 'pokeinfo:list-shiny:v1'

/** Fora do componente: vale para todas as listas e o router lê antes de a tela montar. */
const shiny = ref(readStorage<boolean>(LIST_SHINY_KEY) === true)

/** Preferência geral de mostrar as listas com os artworks shiny, salva no aparelho. */
export function useListShiny() {
  function toggleShiny(): void {
    shiny.value = !shiny.value
    writeStorage(LIST_SHINY_KEY, shiny.value)
  }

  return { shiny, toggleShiny }
}
