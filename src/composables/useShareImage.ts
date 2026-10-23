import { ref, shallowRef, watch } from 'vue'
import { shareFile, type ShareResult } from './useShare'

/**
 * Imagem para compartilhar em duas etapas: o primeiro toque gera a imagem e mostra a prévia; o
 * botão "Compartilhar" da prévia manda o arquivo. No iPhone, o `navigator.share` precisa de um
 * gesto recente, e gerar a imagem (baixar os artworks) pode passar desse limite.
 */
export function useShareImage() {
  const open = ref(false)
  const status = ref<'loading' | 'ready' | 'error'>('loading')
  const url = ref<string | null>(null)
  const blob = shallowRef<Blob | null>(null)
  const fileName = ref('pokeinfo.png')
  const title = ref('')

  function release(): void {
    if (url.value) URL.revokeObjectURL(url.value)
    url.value = null
    blob.value = null
  }

  // Fechou a prévia: a imagem não serve mais, libera a memória do objeto.
  watch(open, (value) => {
    if (!value) release()
  })

  async function generate(
    make: () => Promise<Blob>,
    name: string,
    shareTitle: string,
  ): Promise<void> {
    release()
    fileName.value = name
    title.value = shareTitle
    status.value = 'loading'
    open.value = true
    try {
      const result = await make()
      if (!open.value) return
      blob.value = result
      url.value = URL.createObjectURL(result)
      status.value = 'ready'
    } catch {
      status.value = 'error'
    }
  }

  async function share(): Promise<ShareResult | 'downloaded' | null> {
    if (!blob.value) return null
    return shareFile(blob.value, fileName.value, title.value)
  }

  return { open, status, url, fileName, generate, share }
}
