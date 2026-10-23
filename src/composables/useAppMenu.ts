import { ref } from 'vue'

/** Estado global do menu lateral e das sheets abertas a partir dele (montados no App.vue). */
const drawer = ref(false)
const languageOpen = ref(false)
const aboutOpen = ref(false)
const backupOpen = ref(false)

export function useAppMenu() {
  return { drawer, languageOpen, aboutOpen, backupOpen }
}
