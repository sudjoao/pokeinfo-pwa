import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import vuetify from 'vite-plugin-vuetify'
import { VitePWA } from 'vite-plugin-pwa'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'

const DAY = 60 * 60 * 24

/** Só o que o plugin abaixo usa da Cache API (o config roda no Node, sem os tipos do DOM). */
declare const caches: {
  match(request: Request, options: { cacheName: string }): Promise<Response | undefined>
}

/**
 * Pacotes do "Usar offline" (src/utils/offline.ts, OFFLINE_CACHES): quando o cache da regra não
 * tem a resposta, procura nos caches dos pacotes antes de ir à rede. Assim o que foi baixado não
 * fica sujeito aos limites de entradas das regras. Precisa ser autocontido (o workbox-build copia o
 * código da função para o service worker), por isso repete os nomes dos caches.
 */
const offlineFallback = {
  cachedResponseWillBeUsed: async ({
    request,
    cachedResponse,
  }: {
    request: Request
    cachedResponse?: Response
  }) => {
    if (cachedResponse) return cachedResponse
    for (const cacheName of [
      'pokeinfo-offline-data-v1',
      'pokeinfo-offline-images-v1',
      'pokeinfo-offline-cries-v1',
    ]) {
      const hit = await caches.match(request, { cacheName })
      if (hit) return hit
    }
    return null
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    vuetify({ autoImport: true }),
    // Pré-compila os JSON de src/locales e usa o build runtime-only do vue-i18n. Sem mensagem
    // nenhuma para compilar em runtime, o compilador (~17 KB) também sai do bundle.
    VueI18nPlugin({
      include: [fileURLToPath(new URL('./src/locales/**', import.meta.url))],
      dropMessageCompiler: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      // Com 'auto' o registerSW.js entra no <head> sem defer e segura a primeira pintura.
      injectRegister: 'script-defer',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'PokeInfo',
        short_name: 'PokeInfo',
        description: 'Pokédex PWA para consultar informações sobre Pokémon',
        lang: 'pt-BR',
        theme_color: '#dc2626',
        background_color: '#ffffff',
        display: 'standalone',
        // Sem travar a orientação: quem usa o aparelho fixo na horizontal (suporte de cadeira de
        // rodas, tablet no teclado) precisa conseguir usar o app (WCAG 1.3.4).
        orientation: 'any',
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
        // Atalhos do ícone instalado (pressionar e segurar no Android; menu de contexto no desktop).
        shortcuts: [
          { name: 'Montar time', short_name: 'Time', url: '/team' },
          { name: 'Calculadora de tipos', short_name: 'Tipos', url: '/types' },
          { name: 'Favoritos', short_name: 'Favoritos', url: '/?fav=1' },
          { name: 'Pokémon do dia', short_name: 'Do dia', url: '/daily' },
          { name: 'Quem é esse Pokémon?', short_name: 'Quiz', url: '/quiz' },
        ],
        // Capturas para a tela de instalação mais rica (Chrome/Android e desktop).
        screenshots: [
          {
            src: '/screenshots/home-narrow.jpg',
            sizes: '780x1688',
            type: 'image/jpeg',
            form_factor: 'narrow',
            label: 'Pokédex de Scarlet / Violet',
          },
          {
            src: '/screenshots/detail-narrow.jpg',
            sizes: '780x1688',
            type: 'image/jpeg',
            form_factor: 'narrow',
            label: 'Detalhes do Charizard',
          },
          {
            src: '/screenshots/team-wide.jpg',
            sizes: '1280x800',
            type: 'image/jpeg',
            form_factor: 'wide',
            label: 'Team builder com análise de tipos',
          },
        ],
      },
      workbox: {
        // Learnsets (um chunk por jogo, ~920 KB gz no total) ficam fora do precache: só o jogo
        // aberto é baixado, e fica no cache `generated-learnsets` abaixo. O SDK do Supabase
        // (~55 KB gz) também: só quem entra na conta baixa, e ele fica no cache `supabase-sdk`.
        globIgnores: ['**/learnset-*.js', '**/supabase-*.js'],
        // Caches em runtime da PokéAPI, separados por tipo de recurso para
        // manter o armazenamento do usuário pequeno (ver README > Cache).
        runtimeCaching: [
          {
            // Mesma origem: o Workbox aceita a regex em qualquer ponto da URL.
            urlPattern: /\/assets\/learnset-[^/]+\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'generated-learnsets',
              // O hash muda a cada geração: entradas antigas saem pelo limite.
              expiration: { maxEntries: 30, maxAgeSeconds: 90 * DAY },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: /\/assets\/supabase-[^/]+\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-sdk',
              expiration: { maxEntries: 3, maxAgeSeconds: 90 * DAY },
              cacheableResponse: { statuses: [200] },
            },
          },
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
              plugins: [offlineFallback],
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
            // Vocabulário e referência sob demanda (habilidades, itens, golpes, berries, máquinas,
            // stats, grupos de ovo): respostas praticamente imutáveis, cache maior e mais longo
            // que o catch-all abaixo. Precisa vir antes dele (o Workbox usa a primeira regra
            // cujo urlPattern casar).
            urlPattern:
              /^https:\/\/pokeapi\.co\/api\/v2\/(ability|item|move|stat|egg-group|berry|machine)\/.*/i,
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
              plugins: [offlineFallback],
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
              plugins: [offlineFallback],
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * DAY },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Artwork redimensionado em WebP pelo wsrv.nl (~13 KB no card, ~40 KB no detalhe).
            // As imagens são pedidas com crossorigin: a resposta é CORS (status 200) e não opaca;
            // respostas opacas contam ~7 MB cada na cota do Chrome, qualquer que seja o tamanho real.
            urlPattern: /^https:\/\/wsrv\.nl\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pokemon-artwork-webp',
              plugins: [offlineFallback],
              expiration: { maxEntries: 400, maxAgeSeconds: 30 * DAY },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Sprites pequenos (1–30 KB): por jogo, animados do Showdown e de itens. Antes da regra
            // do PNG original, que casa o mesmo repositório com limite baixo. Pedidos com
            // crossorigin, para a resposta ser CORS (200) e não opaca.
            urlPattern:
              /^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/sprites\/master\/sprites\/(pokemon\/versions|pokemon\/other\/showdown|items)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pokeapi-sprites',
              expiration: { maxEntries: 400, maxAgeSeconds: 30 * DAY },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // PNG original (~120 KB cada): agora só quando o proxy falha, por isso o limite baixo.
            // O cache antigo `pokeapi-artwork` (200 PNGs, ~24 MB) é apagado no main.ts.
            urlPattern: /^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/sprites\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pokeapi-artwork-v2',
              expiration: { maxEntries: 30, maxAgeSeconds: 30 * DAY },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        // Nomes reconhecíveis para o service worker deixar learnsets e o SDK do Supabase fora do
        // precache.
        chunkFileNames: (chunk) =>
          chunk.facadeModuleId?.includes('/data/generated/learnsets/')
            ? 'assets/learnset-[name]-[hash].js'
            : chunk.facadeModuleId?.includes('/node_modules/@supabase/supabase-js/')
              ? 'assets/supabase-[hash].js'
              : 'assets/[name]-[hash].js',
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
