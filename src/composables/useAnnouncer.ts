import { readonly, ref } from 'vue'

/** Pausa entre limpar e escrever: repetir a mesma frase também precisa ser anunciado. */
const RESET_MS = 100

const message = ref('')
let timer: ReturnType<typeof setTimeout> | undefined

/**
 * Anuncia um texto para leitores de tela pela região viva única do App.vue. Regiões criadas junto
 * com o texto (como a do v-snackbar) costumam ser ignoradas; esta fica sempre no DOM.
 */
export function announce(text: string): void {
  clearTimeout(timer)
  message.value = ''
  timer = setTimeout(() => (message.value = text), RESET_MS)
}

export const announcement = readonly(message)
