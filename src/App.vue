<template>
  <div class="app-shell">
    <!-- Desktop Sidebar -->
    <aside class="sidebar" v-if="shouldShowNav">
      <div class="sidebar-header">
        <h1 class="brand-text">TimiGS</h1>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-link" active-class="active">
          <div class="nav-icon" v-html="Icons.dashboard"></div>
          <span>{{ $t("nav.dashboard") || "Dashboard" }}</span>
        </router-link>

        <router-link to="/timeline" class="nav-link" active-class="active">
          <div class="nav-icon" v-html="Icons.timeline"></div>
          <span>{{ $t("nav.timeline") || "Timeline" }}</span>
        </router-link>

        <router-link to="/analytics" class="nav-link" active-class="active">
          <div class="nav-icon" v-html="Icons.analytics"></div>
          <span>{{ $t("nav.analytics") || "Analytics" }}</span>
        </router-link>

        <router-link to="/weather" class="nav-link" active-class="active">
          <div class="nav-icon" v-html="Icons.weather"></div>
          <span>{{ $t("nav.weather") || "Weather" }}</span>
        </router-link>

        <router-link to="/transfer" class="nav-link" active-class="active">
          <div class="nav-icon" v-html="Icons.transfer"></div>
          <span>{{ $t("nav.transfer") || "Transfer" }}</span>
        </router-link>

        <router-link to="/tools" class="nav-link" active-class="active">
          <div class="nav-icon" v-html="Icons.tools"></div>
          <span>{{ $t("nav.tools") || "Tools" }}</span>
        </router-link>

        <router-link to="/settings" class="nav-link" active-class="active">
          <div class="nav-icon" v-html="Icons.settings"></div>
          <span>{{ $t("nav.settings") || "Settings" }}</span>
        </router-link>
      </nav>
    </aside>

    <!-- Content Area -->
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- Mobile Bottom Navigation -->
    <nav class="bottom-nav" v-if="shouldShowNav">
      <router-link to="/" class="bottom-nav-item" active-class="active">
        <div class="nav-icon-mobile" v-html="Icons.dashboard"></div>
        <span>{{ $t("nav.dashboard") || "DB" }}</span>
      </router-link>

      <router-link to="/timeline" class="bottom-nav-item" active-class="active">
        <div class="nav-icon-mobile" v-html="Icons.timeline"></div>
        <span>{{ $t("nav.timeline") || "Time" }}</span>
      </router-link>

      <router-link
        to="/analytics"
        class="bottom-nav-item"
        active-class="active"
      >
        <div class="nav-icon-mobile" v-html="Icons.analytics"></div>
        <span>{{ $t("nav.analytics") || "Stats" }}</span>
      </router-link>

      <router-link to="/weather" class="bottom-nav-item" active-class="active">
         <div class="nav-icon-mobile" v-html="Icons.weather"></div>
        <span>{{ $t("nav.weather") || "Weather" }}</span>
      </router-link>

      <router-link to="/transfer" class="bottom-nav-item" active-class="active">
        <div class="nav-icon-mobile" v-html="Icons.transfer"></div>
        <span>{{ $t("nav.transfer") || "Send" }}</span>
      </router-link>

      <router-link to="/settings" class="bottom-nav-item" active-class="active">
        <div class="nav-icon-mobile" v-html="Icons.settings"></div>
        <span>{{ $t("nav.settings") || "Setgs" }}</span>
      </router-link>
    </nav>
  </div>
  <NotificationToast />
</template>

<script setup lang="ts">
import { onMounted, watch, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useActivityStore } from "./stores/activity";
import NotificationToast from "./components/NotificationToast.vue";
import { Icons } from "./components/icons/IconMap";

const store = useActivityStore();
const router = useRouter();
const route = useRoute();

const shouldShowNav = computed(() => route.path !== '/tray');

// Reactive Theme Switching
watch(() => store.settings.theme, (newTheme) => {
  document.documentElement.setAttribute("data-theme", newTheme);
});

onMounted(async () => {
  await store.checkPlatform();
  await store.fetchSettings();
  document.documentElement.setAttribute("data-theme", store.settings.theme);

  const { listen } = await import('@tauri-apps/api/event');

  await listen('navigate', (event: any) => {
      console.log("🧭 Navigation event received:", event.payload);
      router.push(event.payload).catch(err => {
        console.error("Navigation failed:", err);
      });
  });

  // Initialize Activity Tracking
  await store.fetchTrackingStatus();
  if (!store.isTracking) {
      console.log("Starting activity tracking...");
      await store.startTracking();
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
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* New Icon Styles */
.nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.nav-icon-mobile {
  width: 24px;
  height: 24px;
   display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
}
.nav-icon-mobile :deep(svg) {
  width: 100%;
  height: 100%;
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
