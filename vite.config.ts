import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import vuetify from 'vite-plugin-vuetify'
import { VitePWA } from 'vite-plugin-pwa'

const DAY = 60 * 60 * 24

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    vuetify({ autoImport: true }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'PokéInfo',
        short_name: 'PokéInfo',
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
            // Detalhes individuais (cada resposta tem ~200 KB, por isso o limite baixo)
            urlPattern: /^https:\/\/pokeapi\.co\/api\/v2\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pokeapi-detail',
              expiration: { maxEntries: 60, maxAgeSeconds: 7 * DAY },
              cacheableResponse: { statuses: [0, 200] },
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
