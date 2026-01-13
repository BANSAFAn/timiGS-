<template>
  <div class="app-shell">
    <!-- Desktop Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1 class="brand-text">TimiGS</h1>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/" class="nav-link" active-class="active">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <rect x="3" y="3" width="7" height="7" stroke-width="2" />
            <rect x="14" y="3" width="7" height="7" stroke-width="2" />
            <rect x="14" y="14" width="7" height="7" stroke-width="2" />
            <rect x="3" y="14" width="7" height="7" stroke-width="2" />
          </svg>
          <span>{{ $t("nav.dashboard") }}</span>
        </router-link>

        <router-link to="/timeline" class="nav-link" active-class="active">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="10" stroke-width="2" />
            <polyline points="12 6 12 12 16 14" stroke-width="2" />
          </svg>
          <span>{{ $t("nav.timeline") }}</span>
        </router-link>

        <router-link to="/analytics" class="nav-link" active-class="active">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <line x1="18" y1="20" x2="18" y2="10" stroke-width="2" />
            <line x1="12" y1="20" x2="12" y2="4" stroke-width="2" />
            <line x1="6" y1="20" x2="6" y2="14" stroke-width="2" />
          </svg>
          <span>{{ $t("nav.analytics") }}</span>
        </router-link>

        <router-link to="/tools" class="nav-link" active-class="active">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <polyline points="4 7 4 4 20 4 20 7" stroke-width="2" />
            <line x1="9" y1="20" x2="15" y2="20" stroke-width="2" />
            <line x1="12" y1="4" x2="12" y2="20" stroke-width="2" />
          </svg>
          <span>{{ $t("nav.tools") }}</span>
        </router-link>

        <router-link to="/weather" class="nav-link" active-class="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 0 0 4 4h.9a5 5 0 1 0 5.15-8.7A6 6 0 1 0 3 15z" />
          </svg>
          <span>Weather</span>
        </router-link>

        <router-link
          v-if="isGitHubConnected"
          to="/github"
          class="nav-link"
          active-class="active"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>{{ $t("nav.github") }}</span>
        </router-link>

        <router-link to="/transfer" class="nav-link" active-class="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span>Transfer</span>
        </router-link>

        <router-link to="/compare" class="nav-link" active-class="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          <span>{{ $t("nav.compare") || "Compare" }}</span>
        </router-link>

        <router-link to="/settings" class="nav-link" active-class="active">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="3" stroke-width="2" />
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
              stroke-width="2"
            />
          </svg>
          <span>{{ $t("nav.settings") }}</span>
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
    <nav class="bottom-nav">
      <router-link to="/" class="bottom-nav-item" active-class="active">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <rect x="3" y="3" width="7" height="7" stroke-width="2" />
          <rect x="14" y="3" width="7" height="7" stroke-width="2" />
          <rect x="14" y="14" width="7" height="7" stroke-width="2" />
          <rect x="3" y="14" width="7" height="7" stroke-width="2" />
        </svg>
        <span>DB</span>
      </router-link>

      <router-link to="/timeline" class="bottom-nav-item" active-class="active">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <circle cx="12" cy="12" r="10" stroke-width="2" />
          <polyline points="12 6 12 12 16 14" stroke-width="2" />
        </svg>
        <span>Time</span>
      </router-link>

      <router-link
        to="/analytics"
        class="bottom-nav-item"
        active-class="active"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <line x1="18" y1="20" x2="18" y2="10" stroke-width="2" />
          <line x1="12" y1="20" x2="12" y2="4" stroke-width="2" />
          <line x1="6" y1="20" x2="6" y2="14" stroke-width="2" />
        </svg>
        <span>Stats</span>
      </router-link>

      <router-link to="/tools" class="bottom-nav-item" active-class="active">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <polyline points="4 7 4 4 20 4 20 7" stroke-width="2" />
          <line x1="9" y1="20" x2="15" y2="20" stroke-width="2" />
        </svg>
        <span>Tools</span>
      </router-link>

      <router-link to="/weather" class="bottom-nav-item" active-class="active">
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 0 0 4 4h.9a5 5 0 1 0 5.15-8.7A6 6 0 1 0 3 15z" />
         </svg>
        <span>Weather</span>
      </router-link>

      <router-link to="/transfer" class="bottom-nav-item" active-class="active">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <span>Send</span>
      </router-link>

      <router-link to="/settings" class="bottom-nav-item" active-class="active">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <circle cx="12" cy="12" r="3" stroke-width="2" />
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
            stroke-width="2"
          />
        </svg>
        <span>Setgs</span>
      </router-link>
    </nav>
  </div>
  <NotificationToast />
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { invoke } from "@tauri-apps/api/core";
// @ts-ignore
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { useActivityStore } from "./stores/activity";
import NotificationToast from "./components/NotificationToast.vue";

const store = useActivityStore();
const isGitHubConnected = ref(false);

function checkGitHubConnection() {
  isGitHubConnected.value = !!localStorage.getItem("github_token");
}

// Listen for storage changes (when user connects in Settings)
window.addEventListener("storage", checkGitHubConnection);

// Reactive Theme Switching
watch(() => store.settings.theme, (newTheme) => {
  document.documentElement.setAttribute("data-theme", newTheme);
});

onMounted(async () => {
  await store.checkPlatform();
  await store.fetchSettings();
  document.documentElement.setAttribute("data-theme", store.settings.theme);
  checkGitHubConnection();

  // Initialize Activity Tracking
  await store.fetchTrackingStatus();
  if (!store.isTracking) {
      console.log("Starting activity tracking...");
      await store.startTracking();
  }

  // Setup Deep Link Listener (Mobile Auth)
  try {
    // @ts-ignore
    await onOpenUrl((urls: string[]) => {
      console.log('Deep link received:', urls);
      for (const url of urls) {
        if (url.includes('code=')) {
          const urlObj = new URL(url);
          const code = urlObj.searchParams.get('code');
          if (code) {
             invoke('exchange_google_code', { code })
              .then(() => {
                // Determine if we need to notify the user. 
                // Using a simple alert or toast if possible.
                // Since NotificationToast is here, we could use store?
                // For now, simple alert or console.
                console.log("Google Login Successful via Deep Link");
                // Refresh settings or cloud accounts if needed
                // But cloud accounts are in a different store?
                // Just saving to DB is enough.
              })
              .catch(err => console.error("Auth Exchange Error", err));
          }
        }
      }
    });
  } catch (e) {
    // Deep link plugin might fail on desktop if not configured or supported in this context
    // It's safe to ignore on desktop since we use server flow there
    console.debug('Deep Link listener init skipped or failed:', e);
  }

  // Block F7 key
  window.addEventListener("keydown", (e) => {
    if (e.key === "F7") {
      e.preventDefault();
      e.stopPropagation();
    }
  });
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

/* Hide labels on mobile bottom nav */
@media (max-width: 768px) {
  .bottom-nav-item span {
    display: none;
  }
  .bottom-nav-item svg {
    margin-bottom: 0;
  }
}
</style>
