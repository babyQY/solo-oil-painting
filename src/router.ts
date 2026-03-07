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
      path: '/artwork/:slug',
      name: 'artwork',
      component: ArtworkDetailPage,
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    if (to.path !== from.path) {
      return { top: 0 }
    }

    return undefined
  },
})

export default router
