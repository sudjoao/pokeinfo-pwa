/**
 * Só no modo dev (importado atrás de `import.meta.env.DEV`, fora do build): imagem do mapa
 * oficial por baixo dos nossos marcadores, para comparar o desenho com o dos jogos. As imagens
 * ficam em `dev-maps/` (fora do git, ver o README de lá) e o plugin `build/devMaps.ts` as lista.
 */
import { reactive, ref, watch } from 'vue'
import { readStorage, writeStorage } from '@/utils/storage'

export interface MapReference {
  file: string | null
  /** Canto superior esquerdo da imagem, em unidades do mapa. */
  x: number
  y: number
  /** Unidades do mapa por pixel da imagem. */
  scale: number
  /** Esticar na vertical (1 = proporção original). */
  stretch: number
  opacity: number
}

interface Saved {
  enabled: boolean
  sections: Record<string, MapReference>
}

const STORAGE_KEY = 'pokeinfo:dev-map-reference:v1'

const saved = readStorage<Saved>(STORAGE_KEY)

export const enabled = ref(saved?.enabled ?? false)
export const sections = reactive<Record<string, MapReference>>(saved?.sections ?? {})

watch([enabled, sections], () => writeStorage(STORAGE_KEY, { enabled: enabled.value, sections }), {
  deep: true,
})

export const files = ref<string[]>([])
export const filesLoaded = ref(false)

export async function loadFiles(): Promise<void> {
  try {
    const response = await fetch('/__dev-maps')
    files.value = response.ok ? await response.json() : []
  } catch {
    files.value = []
  }
  filesLoaded.value = true
}

export function fileUrl(file: string): string {
  return `/dev-maps/${encodeURIComponent(file)}`
}

/** Tamanho em pixels de cada imagem, conhecido só depois de carregar. */
export const sizes = reactive<Record<string, { width: number; height: number }>>({})

export function loadSize(file: string): Promise<{ width: number; height: number }> {
  const known = sizes[file]
  if (known) return Promise.resolve(known)
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      sizes[file] = { width: image.naturalWidth, height: image.naturalHeight }
      resolve(sizes[file]!)
    }
    image.onerror = () => reject(new Error(`Imagem não carregou: ${file}`))
    image.src = fileUrl(file)
  })
}

/** Primeiro palpite de arquivo: `kanto.red-blue.png` (do jogo), depois `kanto.png` (da seção). */
export function guessFile(list: readonly string[], section: string, game: string): string | null {
  const base = (file: string) => file.replace(/\.[^.]+$/, '')
  return (
    list.find((file) => base(file) === `${section}.${game}`) ??
    list.find((file) => base(file) === section) ??
    null
  )
}

/** Imagem inteira dentro do mapa, centralizada, sem distorcer. */
export function fitReference(
  file: string,
  size: { width: number; height: number },
  map: { width: number; height: number },
  opacity = 0.6,
): MapReference {
  const scale = Math.min(map.width / size.width, map.height / size.height)
  return {
    file,
    scale,
    stretch: 1,
    x: (map.width - size.width * scale) / 2,
    y: (map.height - size.height * scale) / 2,
    opacity,
  }
}
