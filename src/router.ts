import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "./views/Dashboard.vue";
import Timeline from "./views/Timeline.vue";
import Analytics from "./views/Analytics.vue";
import Settings from "./views/Settings.vue";

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
    path: "/settings",
    name: "Settings",
    component: Settings,
  },
  {
    path: "/tools",
    name: "Tools",
    component: () => import("./views/Tools.vue"),
  },
  {
    path: "/github",
    name: "Github",
    component: () => import("./views/Github.vue"),
  },
  {
    path: "/transfer",
    name: "Transfer",
    component: () => import("./views/Transfer.vue"),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
