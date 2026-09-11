import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { vuetify } from './plugins/vuetify'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')

// Pede ao navegador para não descartar o storage (marcações de captura) sob pressão de espaço.
// O Chrome concede para PWAs instalados; o Safari ignora sem erro.
navigator.storage?.persist?.().catch(() => {})
