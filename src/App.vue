<template>
  <div class="app-shell">
    
    <aside class="sidebar" v-if="shouldShowNav">
      <div class="sidebar-header">
        <h1 class="brand-text">TimiGS</h1>
      </div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in mainNavItems"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          active-class="active"
        >
          <div class="nav-icon" v-html="item.icon"></div>
          <span>{{ $t(item.label) }}</span>
        </router-link>
        
        <div class="nav-divider"></div>
        
        <router-link
          v-for="item in secondaryNavItems"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          active-class="active"
        >
          <div class="nav-icon" v-html="item.icon"></div>
          <span>{{ $t(item.label) }}</span>
        </router-link>
      </nav>
    </aside>

    
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    
    <nav class="bottom-nav" v-if="shouldShowNav">
      <router-link
        v-for="item in mobileNavItems"
        :key="item.path"
        :to="item.path"
        class="bottom-nav-item"
        active-class="active"
      >
        <div class="nav-icon-mobile" v-html="item.icon"></div>
        <span>{{ $t(item.labelShort) }}</span>
      </router-link>
    </nav>
  </div>
  <NotificationToast />
  <DoctorModeLockScreen />
  <TimeOutGlobalOverlay />
  <ConfirmDialog ref="confirmDialogRef" />
  <TeamNotification ref="teamNotifRef" />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch, computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { useActivityStore } from "./stores/activity";
import { useDoctorModeStore } from "./stores/doctorMode";
import { useTeamsStore } from "./stores/teams";
import NotificationToast from "./components/NotificationToast.vue";
import DoctorModeLockScreen from "./components/DoctorModeLockScreen.vue";
import TimeOutGlobalOverlay from "./components/TimeOutGlobalOverlay.vue";
import ConfirmDialog from "./components/ConfirmDialog.vue";
import TeamNotification from "./components/TeamNotification.vue";
import { Icons } from "./components/icons/IconMap";
import { getConfirmDialog } from "./composables/useConfirmDialog";
import { setTeamNotifRef } from "./composables/useTeamNotification";

interface NavItem {
  path: string;
  label: string;
  labelShort: string;
  icon: string;
}

const store = useActivityStore();
const doctorModeStore = useDoctorModeStore();
const teamsStore = useTeamsStore();
const router = useRouter();
const route = useRoute();

const hasCodingActivity = computed(() => {
  return store.totalCodingTime > 0 || store.todayCodingSessions.length > 0 || store.currentCodingSession !== null;
});

const mainNavItems = computed<NavItem[]>(() => {
  const items = [
    { path: "/", label: "nav.dashboard", labelShort: "nav.dashboardShort", icon: Icons.dashboard },
    { path: "/timeline", label: "nav.timeline", labelShort: "nav.timelineShort", icon: Icons.timeline },
    { path: "/analytics", label: "nav.analytics", labelShort: "nav.analyticsShort", icon: Icons.analytics },
  ];
  if (hasCodingActivity.value) {
    items.splice(2, 0, { path: "/coding", label: "nav.coding", labelShort: "nav.codingShort", icon: Icons.coding });
  }
  return items;
});

const secondaryNavItems: NavItem[] = [
  { path: "/team", label: "nav.team", labelShort: "nav.teamShort", icon: Icons.team },
  { path: "/tools", label: "nav.tools", labelShort: "nav.toolsShort", icon: Icons.tools },
  { path: "/transfer", label: "nav.transfer", labelShort: "nav.transferShort", icon: Icons.transfer },
  { path: "/settings", label: "nav.settings", labelShort: "nav.settingsShort", icon: Icons.settings },
];

const mobileNavItems = computed<NavItem[]>(() => {
  const items = [
    { path: "/", label: "nav.dashboard", labelShort: "nav.dashboardShort", icon: Icons.dashboard },
    { path: "/timeline", label: "nav.timeline", labelShort: "nav.timelineShort", icon: Icons.timeline },
    { path: "/analytics", label: "nav.analytics", labelShort: "nav.analyticsShort", icon: Icons.analytics },
    { path: "/tools", label: "nav.tools", labelShort: "nav.toolsShort", icon: Icons.tools },
    { path: "/settings", label: "nav.settings", labelShort: "nav.settingsShort", icon: Icons.settings },
  ];
  if (hasCodingActivity.value) {
    items.splice(2, 0, { path: "/coding", label: "nav.coding", labelShort: "nav.codingShort", icon: Icons.coding });
  }
  return items;
});
const confirmDialogRef = ref<InstanceType<typeof ConfirmDialog> | null>(null);
const teamNotifRef = ref<InstanceType<typeof TeamNotification> | null>(null);

onMounted(() => {
  getConfirmDialog().setDialogRef(confirmDialogRef.value);
  setTeamNotifRef(teamNotifRef.value);
});

const shouldShowNav = computed(() => route.path !== "/tray");

const { locale } = useI18n();

watch(
  locale,
  (newLocale) => {
    if (newLocale === "ar") {
      document.documentElement.setAttribute("dir", "rtl");
    } else {
      document.documentElement.setAttribute("dir", "ltr");
    }
  },
  { immediate: true }
);

watch(
  () => store.settings.theme,
  (newTheme) => {
    document.documentElement.setAttribute("data-theme", newTheme);
  }
);

let pollInterval: number | null = null;
let unlistenTick: (() => void) | null = null;

onMounted(async () => {
  await store.checkPlatform();
  await store.fetchSettings();
  document.documentElement.setAttribute("data-theme", store.settings.theme);

  const { listen } = await import("@tauri-apps/api/event");

  await listen("navigate", (event: any) => {
    console.log(" Navigation event received:", event.payload);
    router.push(event.payload).catch((err) => {
      console.error("Navigation failed:", err);
    });
  });

  await store.fetchTrackingStatus();
  if (!store.isTracking) {
    console.log("Starting activity tracking...");
    await store.startTracking();
  }

  if (doctorModeStore.enabled) {
    doctorModeStore.startTracking();
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "F7") {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  await store.fetchTodayData();
  await store.fetchCurrentActivity();
  await teamsStore.restoreGroupState();

  pollInterval = window.setInterval(async () => {
    if (store.isTracking) {
      await store.fetchCurrentActivity();
      await store.fetchTodayData();
    }
  }, 5000);

  unlistenTick = await listen("activity-tracker-tick", async () => {
    if (store.isTracking) {
      await store.fetchCurrentActivity();
      await store.fetchTodayData();
    }
  });

  console.log(" App mounted, navigation listener ready");
});

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
  if (unlistenTick) {
    unlistenTick();
  }
});
</script>

<style scoped>

.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}


.nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.nav-icon-mobile {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nav-icon-mobile :deep(svg) {
  width: 100%;
  height: 100%;
}


.nav-divider {
  height: 1px;
  background: var(--border-color);
  margin: 12px 0;
}


@media (max-width: 768px) {
  .bottom-nav-item span {
    display: none;
  }

  .nav-icon-mobile {
    margin-bottom: 0;
  }
}
</style>
