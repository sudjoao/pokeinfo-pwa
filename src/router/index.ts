import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { i18n } from '@/plugins/i18n'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/pokemon/:id',
      name: 'pokemon',
      // Carregado sob demanda: a Home continua leve.
      component: () => import('@/views/PokemonDetailView.vue'),
    },
    {
      path: '/team',
      name: 'team',
      component: () => import('@/views/TeamView.vue'),
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

router.afterEach((to) => {
  if (to.name === 'home') document.title = i18n.global.t('app.dexTitle')
  if (to.name === 'team') document.title = i18n.global.t('app.teamTitle')
})

export default router
