import { ref } from 'vue'
import { readStorage, writeStorage } from '@/utils/storage'

/**
 * Estilo do mapa da aba Rotas: `classic` pinta o terreno em blocos, com a cara do mapa de bolso
 * dos jogos (desenho próprio, sem arte oficial); `schematic` é o desenho liso de estações e linhas.
 */
export const MAP_STYLES = ['classic', 'schematic'] as const
export type MapStyle = (typeof MAP_STYLES)[number]

const MAP_STYLE_KEY = 'pokeinfo:map-style:v1'

function isMapStyle(value: unknown): value is MapStyle {
  return (MAP_STYLES as readonly unknown[]).includes(value)
}

const style = ref<MapStyle>(
  ((saved) => (isMapStyle(saved) ? saved : 'classic'))(readStorage<string>(MAP_STYLE_KEY)),
)

/** Estilo escolhido (padrão: clássico), salvo no aparelho. */
export function useMapStyle() {
  function setStyle(next: MapStyle): void {
    style.value = next
    writeStorage(MAP_STYLE_KEY, next)
  }

  return { style, setStyle }
}
