import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from './views/Dashboard.vue';
import Timeline from './views/Timeline.vue';
import Analytics from './views/Analytics.vue';
import Settings from './views/Settings.vue';

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/timeline',
    name: 'Timeline',
    component: Timeline
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: Analytics
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});
