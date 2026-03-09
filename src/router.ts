import { createRouter, createWebHashHistory } from "vue-router";
import Dashboard from "./views/Dashboard.vue";
import Timeline from "./views/Timeline.vue";
import Analytics from "./views/Analytics.vue";
import Settings from "./views/Settings.vue";
import Weather from "./views/Weather.vue";
import Tools from "./views/Tools.vue";
import Transfer from "./views/Transfer.vue";
import Tray from "./views/Tray.vue";
import Sync from "./views/Sync.vue";

const routes = [
  {
    path: "/",
    name: "Dashboard",
    component: Dashboard,
  },
  {
    path: "/timeline",
    name: "Timeline",
    component: Timeline,
  },
  {
    path: "/analytics",
    name: "Analytics",
    component: Analytics,
  },
  {
    path: "/weather",
    name: "Weather",
    component: Weather,
  },
  {
    path: "/settings",
    name: "Settings",
    component: Settings,
  },
  {
    path: "/tools",
    name: "Tools",
    component: Tools,
  },
  {
    path: "/transfer",
    name: "Transfer",
    component: Transfer,
  },
  {
    path: "/tray",
    name: "Tray",
    component: Tray,
  },
  {
    path: "/sync",
    name: "Sync",
    component: Sync,
  },
  // Catch-all route - redirect to dashboard
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// Add navigation guard for error handling
router.onError((error, to) => {
  console.error('[Router Error]', error, 'Navigating to:', to.path);
});

router.beforeEach((to, from, next) => {
  console.log('[Router] Before navigation from:', from.path, 'to:', to.path);
  next();
});

router.afterEach((to, from, failure) => {
  console.log('[Router] After navigation from:', from.path, 'to:', to.path, 'failure:', failure);
  if (failure) {
    console.error('[Router] Navigation failed:', failure);
  }
});
