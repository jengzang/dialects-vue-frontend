import { createRouter, createWebHistory } from 'vue-router'

import VillagesMLEntry from './Entry.vue'
import ExternalRouteBridge from './ExternalRouteBridge.vue'
import { setCurrentVillagesMLDatasetFromRoute } from '../utils/currentDataset.js'
import { buildVillagesMLRedirect } from '../utils/routeDataset.js'

const routes = [
  {
    path: '/villagesML/:pathMatch(.*)*',
    component: VillagesMLEntry,
  },
  {
    path: '/:pathMatch(.*)*',
    component: ExternalRouteBridge,
  },
]

const router = createRouter({
  base: '/',
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

router.beforeEach((to, from, next) => {
  if (to.path === '/villagesML' || to.path.startsWith('/villagesML/')) {
    const villagesMLRedirect = buildVillagesMLRedirect(to)
    if (villagesMLRedirect) {
      return next(villagesMLRedirect)
    }
    setCurrentVillagesMLDatasetFromRoute(to)
  }

  next()
})

export default router
