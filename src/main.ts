import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router, { applyRouteTitle } from './router'
import { vuetify } from './plugins/vuetify'
import { i18n } from './plugins/i18n'
import { applyInitialLocale, loadLocale } from './composables/useLocale'
import { applyInitialTheme } from './composables/useThemePreference'
import { appleWebKit } from './utils/platform'

const app = createApp(App)

app.use(createPinia())
// A primeira navegação começa aqui: o chunk da tela (e, no detalhe, a ficha e o artwork) baixa em
// paralelo com as mensagens do idioma, em vez de esperar por elas.
app.use(router)
app.use(vuetify)
app.use(i18n)
applyInitialTheme()
if (appleWebKit) document.documentElement.classList.add('apple-webkit')

// Monta só com as mensagens do idioma: nenhum texto aparece com a chave no lugar da tradução.
loadLocale(i18n.global.locale.value).then(() => {
  applyInitialLocale()
  applyRouteTitle()
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
