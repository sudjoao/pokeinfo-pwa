import { watch } from 'vue'
import { createRouter, createWebHistory, START_LOCATION } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { i18n } from '@/plugins/i18n'
import { trackInAppNavigation } from '@/composables/usePageFocus'
import { CARD_ARTWORK_SIZE, preloadArtwork } from '@/utils/pokemon'
import { usePokemonDetailStore } from '@/stores/pokemonDetail'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      // Abrindo o app na Pokédex sem filtro (o início do PWA instalado), os primeiros cards são
      // sempre os #1 a #4: as imagens (o LCP) começam a baixar já, e não depois da montagem.
      beforeEnter: (to, from) => {
        if (from !== START_LOCATION || Object.keys(to.query).length) return
        for (let id = 1; id <= 4; id++) preloadArtwork(id, CARD_ARTWORK_SIZE)
      },
    },
    {
      path: '/pokemon/:id',
      name: 'pokemon',
      // Carregado sob demanda: a Home continua leve.
      component: () => import('@/views/PokemonDetailView.vue'),
      // O artwork do topo e a ficha começam a baixar junto com o chunk da tela, e não depois de ela
      // montar (num link direto, isso era depois do idioma e de ~20 chunks). O composable
      // reaproveita a mesma requisição.
      beforeEnter: (to) => {
        const key = String(to.params.id).trim().toLowerCase()
        if (!key) return
        const id = /^\d+$/.test(key) ? Number(key) : key
        if (typeof id === 'number') preloadArtwork(id)
        usePokemonDetailStore()
          .ensureDetail(id)
          .catch(() => {})
      },
    },
    {
      path: '/team',
      name: 'team',
      component: () => import('@/views/TeamView.vue'),
    },
    {
      path: '/compare',
      name: 'compare',
      component: () => import('@/views/CompareView.vue'),
    },
    {
      path: '/quiz',
      name: 'quiz',
      component: () => import('@/views/QuizView.vue'),
    },
    {
      path: '/types',
      name: 'types',
      component: () => import('@/views/TypesView.vue'),
    },
    {
      path: '/moves',
      name: 'moves',
      component: () => import('@/views/MovesView.vue'),
    },
    {
      path: '/move/:slug',
      name: 'move',
      // Título próprio (leva o nome do golpe), como o detalhe do Pokémon.
      component: () => import('@/views/MoveView.vue'),
    },
    {
      path: '/items',
      name: 'items',
      component: () => import('@/views/ItemsView.vue'),
    },
    {
      path: '/item/:slug',
      name: 'item',
      component: () => import('@/views/ItemView.vue'),
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('@/views/StatsToolView.vue'),
    },
    {
      path: '/speed',
      name: 'speed',
      component: () => import('@/views/SpeedView.vue'),
    },
    {
      path: '/daily',
      name: 'daily',
      component: () => import('@/views/DailyView.vue'),
    },
    {
      // Volta do login com o Google (Supabase Auth, fluxo PKCE).
      path: '/auth/callback',
      name: 'auth-callback',
      component: () => import('@/views/AuthCallbackView.vue'),
    },
  ],
  // Ao voltar, restaura a posição da lista (a Home fica viva via KeepAlive); ao abrir outra
  // tela, começa do topo. Mudança só de query (filtros, time) mantém a posição: quem precisa
  // voltar ao topo (troca de filtro reinicia a lista) faz isso explicitamente.
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.path === from.path) return false
    return { top: 0 }
  },
})

trackInAppNavigation(router)

/** Título da aba por tela; o do detalhe é definido pela própria view (leva o nome do Pokémon). */
const ROUTE_TITLES: Partial<Record<string, string>> = {
  home: 'app.dexTitle',
  team: 'app.teamTitle',
  types: 'app.typesTitle',
  compare: 'app.compareTitle',
  quiz: 'app.quizTitle',
  moves: 'app.movesTitle',
  items: 'app.itemsTitle',
  stats: 'app.statsTitle',
  speed: 'app.speedTitle',
  daily: 'app.dailyTitle',
  'auth-callback': 'app.signInTitle',
}

/** Exportada para o boot: a primeira navegação acontece antes de as mensagens chegarem. */
export function applyRouteTitle(): void {
  const key = ROUTE_TITLES[String(router.currentRoute.value.name)]
  if (key && i18n.global.te(key)) document.title = i18n.global.t(key)
}

router.afterEach(applyRouteTitle)
// Trocar o idioma também troca o título da aba (o leitor de tela anuncia o título da janela).
watch(i18n.global.locale, applyRouteTitle)

export default router
