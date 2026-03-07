import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'
import ArtworkDetailPage from './pages/ArtworkDetailPage.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/gallery',
      name: 'gallery',
      component: HomePage,
    },
    {
      path: '/contact',
      name: 'contact',
      component: HomePage,
    },
    {
      path: '/artwork/:slug',
      name: 'artwork',
      component: ArtworkDetailPage,
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    if (to.path === '/gallery') {
      return { el: '#gallery', top: 84, behavior: 'smooth' }
    }

    if (to.path === '/contact') {
      return { el: '#contact', top: 84, behavior: 'smooth' }
    }

    if (to.path !== from.path) {
      return { top: 0 }
    }

    return undefined
  },
})

export default router
