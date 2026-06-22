import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.js';

const routes = [
  { path: '/',              component: () => import('@/views/HomeView.vue') },
  { path: '/login',         component: () => import('@/views/LoginView.vue') },
  { path: '/register',      component: () => import('@/views/RegisterView.vue') },
  { path: '/auth/callback', component: () => import('@/views/AuthCallback.vue') },
  { path: '/lobby/:code', component: () => import('@/views/LobbyView.vue') },
  { path: '/join/:code',  component: () => import('@/views/JoinView.vue') },
  {
    path: '/game/:gameId',
    component: () => import('@/views/GameView.vue'),
  },
  {
    path: '/admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isLoggedIn)
    return { path: '/login', query: { redirect: to.fullPath } };
  if (to.meta.requiresAdmin && !auth.isAdmin)
    return { path: '/' };
});

export default router;
