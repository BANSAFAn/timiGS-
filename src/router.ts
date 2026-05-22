import { createRouter, createWebHashHistory } from "vue-router";
import Dashboard from "./views/Dashboard.vue";
import Timeline from "./views/Timeline.vue";
import Analytics from "./views/Analytics.vue";
import Settings from "./views/Settings.vue";
import Tools from "./views/Tools.vue";
import Transfer from "./views/Transfer.vue";
import Team from "./views/Team.vue";
import Tray from "./views/Tray.vue";
import Coding from "./views/Coding.vue";

const routes = [
  {
    path: "/",
    name: "Dashboard",
    component: Dashboard,
  },
  {
    path: "/coding",
    name: "Coding",
    component: Coding,
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
    path: "/team",
    name: "Team",
    component: Team,
  },
  {
    path: "/tray",
    name: "Tray",
    component: Tray,
  },

  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});


router.onError((error, to) => {
  console.error('[Router Error]', error, 'Navigating to:', to.path);
});

router.beforeEach((to, from, next) => {
  console.log('[Router] Before navigation from:', from.path, 'to:', to.path);
  next();
});

router.afterEach((to, from, failure) => {
  if (failure) {
    console.error('[Router] Navigation failed from:', from.path, 'to:', to.path, 'error:', failure);
  } else {
    console.log('[Router] Navigation successful to:', to.path);
  }
});
