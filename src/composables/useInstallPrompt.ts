import { ref } from 'vue'
import { appleWebKit } from '@/utils/platform'

/** Evento `beforeinstallprompt` do Chromium (não está nos tipos do DOM). */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/** Como o app pode ser instalado: pelo prompt do navegador, pelas instruções do iOS, ou já está. */
export type InstallMode = 'prompt' | 'ios' | null

const deferred = ref<BeforeInstallPromptEvent | null>(null)
const installed = ref(false)
const mode = ref<InstallMode>(null)

function refresh(): void {
  if (installed.value) mode.value = null
  else if (deferred.value) mode.value = 'prompt'
  // Sem beforeinstallprompt no iOS: o item explica o "Adicionar à Tela de Início" do Safari.
  else if (appleWebKit && navigator.maxTouchPoints > 1) mode.value = 'ios'
  else mode.value = null
}

/**
 * Captura o evento de instalação o quanto antes (o Chrome só o dispara uma vez, logo no início):
 * chamado no boot. O menu mostra "Instalar app" enquanto der para instalar.
 */
export function watchInstallPrompt(): void {
  installed.value = isStandalone()
  refresh()
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferred.value = event as BeforeInstallPromptEvent
    refresh()
  })
  window.addEventListener('appinstalled', () => {
    deferred.value = null
    installed.value = true
    refresh()
  })
}

/** Abre o prompt nativo; devolve se a pessoa aceitou. */
async function promptInstall(): Promise<boolean> {
  const event = deferred.value
  if (!event) return false
  deferred.value = null
  refresh()
  await event.prompt()
  const { outcome } = await event.userChoice
  return outcome === 'accepted'
}

export function useInstallPrompt() {
  return { mode, promptInstall }
}
