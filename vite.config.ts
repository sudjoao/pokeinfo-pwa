import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import vuetify from 'vite-plugin-vuetify'
import { VitePWA } from 'vite-plugin-pwa'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

const DAY = 60 * 60 * 24

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    vuetify({ autoImport: true }),
    // Pré-compila os JSON de src/locales e usa o build runtime-only do vue-i18n (sem compilador).
    VueI18nPlugin({ include: [fileURLToPath(new URL('./src/locales/**', import.meta.url))] }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'PokeInfo',
        short_name: 'PokeInfo',
        description: 'Pokédex PWA para consultar informações sobre Pokémon',
        lang: 'pt-BR',
        theme_color: '#dc2626',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Caches em runtime da PokéAPI, separados por tipo de recurso para
        // manter o armazenamento do usuário pequeno (ver README > Cache).
        runtimeCaching: [
          {
            // Índice completo de nomes (1 requisição grande, raramente muda)
            urlPattern: /^https:\/\/pokeapi\.co\/api\/v2\/pokemon\?limit=/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'pokeapi-index',
              expiration: { maxEntries: 3, maxAgeSeconds: 7 * DAY },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Pokédex regionais por jogo (12 a 45 KB cada; poucas, mudam quase nunca)
            urlPattern: /^https:\/\/pokeapi\.co\/api\/v2\/pokedex\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pokeapi-pokedex',
              expiration: { maxEntries: 12, maxAgeSeconds: 30 * DAY },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Mapa de tipos: 18 respostas de /type/{nome} (~20 KB cada) que substituem
            // a leitura de /pokemon/{id} (~290 KB) para os tipos dos cards.
            urlPattern: /^https:\/\/pokeapi\.co\/api\/v2\/type\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'pokeapi-types',
              expiration: { maxEntries: 24, maxAgeSeconds: 30 * DAY },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Espécies e cadeias de evolução (respostas pequenas, ~2 a 50 KB)
            urlPattern: /^https:\/\/pokeapi\.co\/api\/v2\/(pokemon-species|evolution-chain)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pokeapi-species',
              expiration: { maxEntries: 100, maxAgeSeconds: 7 * DAY },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Locais de encontro por Pokémon (de 2 bytes a ~500 KB crus, 1 a 10 KB comprimidos)
            urlPattern: /^https:\/\/pokeapi\.co\/api\/v2\/pokemon\/[^/]+\/encounters/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pokeapi-encounters',
              expiration: { maxEntries: 60, maxAgeSeconds: 7 * DAY },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Pokémon por rota (feature "Rotas"): respostas pequenas e praticamente imutáveis,
            // por isso ficam num cache à parte do catch-all abaixo (que é pra respostas de ~300 KB).
            urlPattern: /^https:\/\/pokeapi\.co\/api\/v2\/location-area\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pokeapi-locations',
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * DAY },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Vocabulário sob demanda (habilidades, itens, golpes, stats, grupos de ovo) em
            // espanhol: respostas pequenas e praticamente imutáveis, cache maior e mais longo
            // que o catch-all abaixo. Precisa vir antes dele (o Workbox usa a primeira regra
            // cujo urlPattern casar).
            urlPattern: /^https:\/\/pokeapi\.co\/api\/v2\/(ability|item|move|stat|egg-group)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pokeapi-vocabulary',
              expiration: { maxEntries: 300, maxAgeSeconds: 30 * DAY },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Detalhes individuais (cada resposta tem ~300 KB, por isso o limite baixo)
            urlPattern: /^https:\/\/pokeapi\.co\/api\/v2\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pokeapi-detail',
              expiration: { maxEntries: 60, maxAgeSeconds: 7 * DAY },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Gritos (cries) dos Pokémon, ~7 KB cada. O app baixa com fetch (sem Range) e toca
            // por blob: só respostas 200 completas entram no cache. Não aceitar status 0 aqui:
            // o Safari pede áudio por faixas e uma resposta parcial opaca envenenaria o cache.
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/cries\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pokeapi-cries-v2',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * DAY },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Artwork oficial dos Pokémon
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/sprites\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pokeapi-artwork',
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * DAY },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
