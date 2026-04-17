<template>
  <div class="app-shell">
    <!-- Desktop Sidebar -->
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

    <!-- Content Area -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Mobile Bottom Navigation -->
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
  <ConfirmDialog ref="confirmDialogRef" />
  <TeamNotification ref="teamNotifRef" />
</template>

<script setup lang="ts">
import { onMounted, watch, computed, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useActivityStore } from "./stores/activity";
import { useDoctorModeStore } from "./stores/doctorMode";
import NotificationToast from "./components/NotificationToast.vue";
import DoctorModeLockScreen from "./components/DoctorModeLockScreen.vue";
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

// Main navigation items (most used)
const mainNavItems: NavItem[] = [
  { path: "/", label: "nav.dashboard", labelShort: "nav.dashboardShort", icon: Icons.dashboard },
  { path: "/timeline", label: "nav.timeline", labelShort: "nav.timelineShort", icon: Icons.timeline },
  { path: "/analytics", label: "nav.analytics", labelShort: "nav.analyticsShort", icon: Icons.analytics },
];

// Secondary navigation items (less used)
const secondaryNavItems: NavItem[] = [
  { path: "/weather", label: "nav.weather", labelShort: "nav.weatherShort", icon: Icons.weather },
  { path: "/team", label: "nav.team", labelShort: "nav.teamShort", icon: Icons.team },
  { path: "/tools", label: "nav.tools", labelShort: "nav.toolsShort", icon: Icons.tools },
  { path: "/transfer", label: "nav.transfer", labelShort: "nav.transferShort", icon: Icons.transfer },
  { path: "/settings", label: "nav.settings", labelShort: "nav.settingsShort", icon: Icons.settings },
];

// Mobile shows all items in a simplified order
const mobileNavItems: NavItem[] = [
  { path: "/", label: "nav.dashboard", labelShort: "nav.dashboardShort", icon: Icons.dashboard },
  { path: "/timeline", label: "nav.timeline", labelShort: "nav.timelineShort", icon: Icons.timeline },
  { path: "/analytics", label: "nav.analytics", labelShort: "nav.analyticsShort", icon: Icons.analytics },
  { path: "/team", label: "nav.team", labelShort: "nav.teamShort", icon: Icons.team },
  { path: "/tools", label: "nav.tools", labelShort: "nav.toolsShort", icon: Icons.tools },
  { path: "/settings", label: "nav.settings", labelShort: "nav.settingsShort", icon: Icons.settings },
];

const store = useActivityStore();
const doctorModeStore = useDoctorModeStore();
const router = useRouter();
const route = useRoute();
const confirmDialogRef = ref<InstanceType<typeof ConfirmDialog> | null>(null);
const teamNotifRef = ref<InstanceType<typeof TeamNotification> | null>(null);

// Register global refs after mount
onMounted(() => {
  getConfirmDialog().setDialogRef(confirmDialogRef.value);
  setTeamNotifRef(teamNotifRef.value);
});

const shouldShowNav = computed(() => route.path !== "/tray");

// Reactive Theme Switching
watch(
  () => store.settings.theme,
  (newTheme) => {
    document.documentElement.setAttribute("data-theme", newTheme);
  }
);

onMounted(async () => {
  await store.checkPlatform();
  await store.fetchSettings();
  document.documentElement.setAttribute("data-theme", store.settings.theme);

  const { listen } = await import("@tauri-apps/api/event");

  await listen("navigate", (event: any) => {
    console.log("🧭 Navigation event received:", event.payload);
    router.push(event.payload).catch((err) => {
      console.error("Navigation failed:", err);
    });
  });

  // Initialize Activity Tracking
  await store.fetchTrackingStatus();
  if (!store.isTracking) {
    console.log("Starting activity tracking...");
    await store.startTracking();
  }

  // Initialize Doctor Mode
  if (doctorModeStore.enabled) {
    doctorModeStore.startTracking();
  }

  // Block F7 key
  window.addEventListener("keydown", (e) => {
    if (e.key === "F7") {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  console.log("✅ App mounted, navigation listener ready");
});
</script>

<style scoped>
/* Page Transitions - Smooth fade and slide */
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

/* Icon Styles */
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

/* Navigation Divider */
.nav-divider {
  height: 1px;
  background: var(--border-color);
  margin: 12px 0;
}

/* Hide labels on mobile bottom nav */
@media (max-width: 768px) {
  .bottom-nav-item span {
    display: none;
  }

  .nav-icon-mobile {
    margin-bottom: 0;
  }
}
</style>
