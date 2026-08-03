<template>
  <div class="app-shell">

    <aside class="sidebar" :class="{ 'compact': isCompact }" v-if="shouldShowNav">
      <div class="sidebar-header">
        <h1 class="brand-text">TimiGS</h1>
        <div class="compact-logo animate-fade-in" v-if="isCompact">
          <svg viewBox="0 0 24 24" width="28" height="28" class="compact-clock-svg" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" stroke="var(--color-primary)" stroke-width="2" fill="none" />
            <line x1="12" y1="12" x2="12" y2="6" stroke="var(--color-primary)" stroke-width="2" stroke-linecap="square" />
            <line x1="12" y1="12" x2="17" y2="12" stroke="var(--color-primary)" stroke-width="1.5" stroke-linecap="square" />
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

  <div v-if="doctorModeStore.showBreakReminder" class="doctor-break-reminder-overlay">
    <div class="doctor-break-reminder-card animate-slide-up">
      <div class="reminder-content">
        <div class="reminder-header">
          <div class="reminder-icon-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter">
              <polyline points="2,12 8,12 11,3 13,21 16,12 22,12"/>
            </svg>
          </div>
          <h4>{{ $t("settings.notificationBreakReminderTitle") || 'Ergonomic Break Reminder' }}</h4>
          <span class="countdown-badge font-mono">{{ doctorModeStore.breakReminderCountdown }}s</span>
        </div>
        <p class="reminder-message">{{ doctorModeStore.breakReminderMessage }}</p>
        <div class="reminder-actions">
          <button class="btn btn-primary step-away-btn" @click="doctorModeStore.stepAway()">
            {{ $t("settings.doctorModeStepAwayBtn") || "Yes, I'll step away now" }}
          </button>
        </div>
        <div class="countdown-bar-container">
          <div class="countdown-bar-fill" :style="{ width: (doctorModeStore.breakReminderCountdown * 10) + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
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

const currentTheme = computed(() => store.settings.theme || "dark");

const mainNavItems = computed<NavItem[]>(() => {
  if (currentTheme.value) { /* trigger reactivity on theme change */ }
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

const secondaryNavItems = computed<NavItem[]>(() => {
  if (currentTheme.value) { /* trigger reactivity on theme change */ }
  return [
    { path: "/team", label: "nav.team", labelShort: "nav.teamShort", icon: Icons.team },
    { path: "/tools", label: "nav.tools", labelShort: "nav.toolsShort", icon: Icons.tools },
    { path: "/transfer", label: "nav.transfer", labelShort: "nav.transferShort", icon: Icons.transfer },
    { path: "/settings", label: "nav.settings", labelShort: "nav.settingsShort", icon: Icons.settings },
  ];
});

const mobileNavItems = computed<NavItem[]>(() => {
  if (currentTheme.value) { /* trigger reactivity on theme change */ }
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
  await Promise.all([
    store.checkPlatform(),
    store.fetchSettings()
  ]);
  document.documentElement.setAttribute("data-theme", store.settings.theme);
  const lang = store.settings.language || "en";
  locale.value = lang;
  localStorage.setItem("timigs-language", lang);

  const { listen } = await import("@tauri-apps/api/event");

  const listenPromise = listen("navigate", (event: any) => {
    console.log(" Navigation event received:", event.payload);
    router.push(event.payload).catch((err) => {
      console.error("Navigation failed:", err);
    });
  });

  await Promise.all([
    listenPromise,
    store.fetchTrackingStatus().then(async () => {
      if (!store.isTracking) {
        console.log("Starting activity tracking...");
        await store.startTracking();
      }
    }),
    store.fetchTodayData(),
    store.fetchCurrentActivity(),
    teamsStore.restoreGroupState()
  ]);

  if (doctorModeStore.enabled) {
    doctorModeStore.startTracking();
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "F7") {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  pollInterval = window.setInterval(async () => {
    if (store.isTracking) {
      await Promise.all([
        store.fetchCurrentActivity(),
        store.fetchTodayData()
      ]);
    }
  }, 5000);

  unlistenTick = await listen("activity-tracker-tick", async () => {
    if (store.isTracking) {
      await Promise.all([
        store.fetchCurrentActivity(),
        store.fetchTodayData()
      ]);
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

.doctor-break-reminder-overlay {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9998;
  pointer-events: auto;
}

.doctor-break-reminder-card {
  position: relative;
  width: 380px;
  background: var(--bg-secondary);
  backdrop-filter: blur(16px);
  border: 2px solid var(--color-primary);
  border-radius: 0px;
  box-shadow: var(--shadow-glow);
  overflow: hidden;
  padding: 18px;
  transition: all 0.3s ease;
}

.doctor-break-reminder-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--color-primary);
}

.reminder-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reminder-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.reminder-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 0px;
  background: rgba(57, 255, 20, 0.1);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.reminder-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  flex: 1;
}

.countdown-badge {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--border-color);
  padding: 2px 8px;
  border-radius: 0px;
  font-size: 0.8rem;
  color: var(--color-primary);
  font-weight: 600;
}

.reminder-message {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.4;
  color: var(--text-main);
}

.reminder-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.step-away-btn {
  width: 100%;
  background: var(--color-primary);
  color: var(--bg-main);
  font-weight: 600;
  border: 1px solid var(--border-color);
  border-radius: 0px;
  padding: 10px;
  cursor: pointer;
  transition: var(--transition-base);
  box-shadow: none;
}

.step-away-btn:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
  box-shadow: none;
}

.step-away-btn:active {
  transform: translateY(0);
}

.countdown-bar-container {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0px;
  overflow: hidden;
  margin-top: 4px;
}

.countdown-bar-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 1s linear;
}
</style>
