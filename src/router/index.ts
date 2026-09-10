import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

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
  ],
  // Ao voltar, restaura a posição da lista (a Home fica viva via KeepAlive);
  // ao abrir um detalhe, começa do topo.
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 }
  },
})

router.afterEach((to) => {
  if (to.name === 'home') document.title = 'Pokédex'
})

export default router
