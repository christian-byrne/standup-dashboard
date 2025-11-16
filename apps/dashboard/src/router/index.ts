import {
  createMemoryHistory,
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: 'Dashboard' },
  },
  {
    path: '/latest',
    redirect: '/',
  },
  {
    path: '/standup',
    name: 'standup',
    component: () => import('../views/StandupView.vue'),
    meta: { title: 'Standup Dashboard' },
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('../views/HistoryView.vue'),
    meta: { title: 'History' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue'),
    meta: { title: 'Settings' },
  },
  {
    path: '/docs',
    name: 'docs',
    component: () => import('../views/DocsView.vue'),
    meta: { title: 'Documentation' },
  },
];

const history =
  typeof window === 'undefined'
    ? createMemoryHistory()
    : createWebHistory(import.meta.env.BASE_URL);

const router = createRouter({
  history,
  routes,
});

router.afterEach((to) => {
  if (typeof to.meta?.title === 'string' && typeof document !== 'undefined') {
    document.title = `${to.meta.title} · Standup Dashboard`;
  }
});

export default router;
