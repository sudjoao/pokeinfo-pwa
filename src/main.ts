import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { vuetify } from './plugins/vuetify'
import { i18n } from './plugins/i18n'
import { applyInitialLocale } from './composables/useLocale'
import { applyInitialTheme } from './composables/useThemePreference'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.use(i18n)
applyInitialLocale()
applyInitialTheme()

app.mount('#app')

// Caches do service worker que não são mais usados: os gritos guardados com respostas parciais
// (ver useCry.ts) e os PNGs de artwork de 120 KB, trocados pelo WebP do wsrv.nl.
const LEGACY_SW_CACHES = ['pokeapi-cries', 'pokeapi-artwork']
if (typeof caches !== 'undefined') {
  LEGACY_SW_CACHES.forEach((name) => caches.delete(name).catch(() => {}))
}

// Pede ao navegador para não descartar o storage (marcações de captura) sob pressão de espaço.
// O Chrome concede para PWAs instalados; o Safari ignora sem erro.
navigator.storage?.persist?.().catch(() => {})
