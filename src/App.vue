<template>
  <div class="app-shell">
    
    <aside class="sidebar" :class="{ 'compact': isCompact }" v-if="shouldShowNav">
      <div class="sidebar-header">
        <h1 class="brand-text">TimiGS</h1>
        <div class="compact-logo animate-fade-in" v-if="isCompact">
          <svg viewBox="0 0 24 24" width="28" height="28" class="compact-clock-svg" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="var(--color-primary)" stroke-width="2" fill="none" />
            <circle cx="12" cy="12" r="1.2" fill="var(--color-primary)" />
            <line x1="12" y1="12" x2="12" y2="7.5" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="round" class="clock-hour-hand" />
            <line x1="12" y1="12" x2="15.5" y2="12" stroke="var(--color-primary)" stroke-width="1.5" stroke-linecap="round" class="clock-minute-hand" />
          </svg>
        </div>
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

        <button
          class="nav-link compact-toggle-btn"
          @click="toggleCompact"
          :title="isCompact ? $t('nav.expand') : $t('nav.collapse')"
        >
          <div class="nav-icon" v-html="isCompact ? (isRtl ? Icons.chevronLeft : Icons.chevronRight) : (isRtl ? Icons.chevronRight : Icons.chevronLeft)"></div>
          <span>{{ isCompact ? '' : $t('nav.collapse') }}</span>
        </button>
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

const isCompact = ref(localStorage.getItem("sidebar-compact") === "true");

const toggleCompact = () => {
  isCompact.value = !isCompact.value;
  localStorage.setItem("sidebar-compact", String(isCompact.value));
};

const isRtl = computed(() => locale.value === "ar");

let pollInterval: number | null = null;
let unlistenTick: (() => void) | null = null;

onMounted(async () => {
  await store.checkPlatform();
  await store.fetchSettings();
  document.documentElement.setAttribute("data-theme", store.settings.theme);
  const lang = store.settings.language || "en";
  locale.value = lang;
  localStorage.setItem("timigs-language", lang);

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

/* Compact sidebar animated clock styles */
.compact-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.compact-clock-svg {
  filter: drop-shadow(0 0 2px rgba(91, 110, 225, 0.15));
  animation: clock-pulse-once 5s ease-out forwards;
}

.clock-hour-hand {
  transform-origin: 12px 12px;
  animation: spin-hour-once 5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
}

.clock-minute-hand {
  transform-origin: 12px 12px;
  animation: spin-minute-once 5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

.animate-fade-in {
  animation: fadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes spin-hour-once {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes spin-minute-once {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(1080deg); }
}

@keyframes clock-pulse-once {
  0% { 
    filter: drop-shadow(0 0 6px rgba(91, 110, 225, 0.5));
    opacity: 1;
  }
  100% { 
    filter: drop-shadow(0 0 2px rgba(91, 110, 225, 0.15));
    opacity: 0.95;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}
</style>
