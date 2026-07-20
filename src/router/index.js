import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
  },
  {
    path: '/systems',
    name: 'systems',
    component: () => import('../views/SystemsView.vue'),
  },
  {
    path: '/chassis',
    name: 'chassis',
    component: () => import('../views/ChassisView.vue'),
  },
  {
    path: '/sensors',
    name: 'sensors',
    component: () => import('../views/SensorsView.vue'),
  },
  {
    path: '/events',
    name: 'events',
    component: () => import('../views/EventLogView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
  return true
})

export default router
