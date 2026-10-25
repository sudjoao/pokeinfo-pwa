import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { vuetify } from './plugins/vuetify'
import { i18n } from './plugins/i18n'
import { applyInitialLocale, loadLocale } from './composables/useLocale'
import { applyInitialTheme } from './composables/useThemePreference'

const app = createApp(App)

// As mensagens do idioma chegam antes do router: a primeira navegação já define o título da aba.
loadLocale(i18n.global.locale.value).then(() => {
  app.use(createPinia())
  app.use(router)
  app.use(vuetify)
  app.use(i18n)
  applyInitialLocale()
  applyInitialTheme()

  app.mount('#app')
})

// Caches do service worker que não são mais usados: os gritos guardados com respostas parciais
// (ver useCry.ts), os PNGs de artwork de 120 KB, trocados pelo WebP do wsrv.nl, e os 18 /type
// que montavam o mapa de tipos, hoje embutido no build.
const LEGACY_SW_CACHES = ['pokeapi-cries', 'pokeapi-artwork', 'pokeapi-types']
if (typeof caches !== 'undefined') {
  LEGACY_SW_CACHES.forEach((name) => caches.delete(name).catch(() => {}))
}

// Pede ao navegador para não descartar o storage (marcações de captura) sob pressão de espaço.
// O Chrome concede para PWAs instalados; o Safari ignora sem erro.
navigator.storage?.persist?.().catch(() => {})
