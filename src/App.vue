<template>
  <div class="app-shell">
    <!-- Modern Desktop Sidebar -->
    <aside class="sidebar-modern-app" v-if="shouldShowNav">
      <div class="sidebar-header">
        <div class="logo-section">
          <div class="logo-icon-modern">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <span class="logo-text">TimiGS</span>
        </div>
      </div>

      <nav class="sidebar-nav-modern">
        <router-link to="/" class="nav-item-modern" active-class="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>{{ $t("nav.dashboard") }}</span>
        </router-link>

        <router-link to="/timeline" class="nav-item-modern" active-class="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          <span>{{ $t("nav.timeline") }}</span>
        </router-link>

        <router-link to="/analytics" class="nav-item-modern" active-class="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <span>{{ $t("nav.analytics") }}</span>
        </router-link>

        <router-link to="/tools" class="nav-item-modern" active-class="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          <span>{{ $t("nav.tools") }}</span>
        </router-link>

        <router-link to="/transfer" class="nav-item-modern" active-class="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
          </svg>
          <span>Transfer</span>
        </router-link>

        <router-link to="/weather" class="nav-item-modern" active-class="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M3 15a4 4 0 0 0 4 4h.9a5 5 0 1 0 5.15-8.7A6 6 0 1 0 3 15z"/>
          </svg>
          <span>Weather</span>
        </router-link>
      </nav>

      <div class="sidebar-footer-modern">
        <router-link to="/settings" class="nav-item-modern settings-item" active-class="active">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          <span>{{ $t("nav.settings") }}</span>
        </router-link>

        <div class="user-section-modern">
          <div class="user-avatar-modern">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="user-info-modern">
            <span class="user-name">User</span>
            <span class="user-status">Active</span>
          </div>
        </div>
      </div>
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
import { ref, onMounted, watch, computed } from "vue";
import { invoke } from "@tauri-apps/api/core";
// @ts-ignore
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { useRouter, useRoute } from "vue-router";
import { useActivityStore } from "./stores/activity";
import NotificationToast from "./components/NotificationToast.vue";

const store = useActivityStore();
const isGitHubConnected = ref(false);
const router = useRouter(); // Move to top level
const route = useRoute();

const shouldShowNav = computed(() => route.path !== '/tray');

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
  
  const { listen } = await import('@tauri-apps/api/event');
  
  await listen('navigate', (event: any) => {
      console.log("Navigating to:", event.payload);
      router.push(event.payload);
  });
  
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

/* === Modern Sidebar Styles === */
.sidebar-modern-app {
  width: 260px;
  height: 100vh;
  background: linear-gradient(180deg, rgba(15, 15, 30, 0.98) 0%, rgba(20, 20, 35, 0.98) 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(20px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-content {
  margin-left: 260px;
  padding: 0;
  min-height: 100vh;
  background: transparent;
  transition: margin-left 0.3s;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 70px;
  }
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon-modern {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #fff, #a5a6f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-nav-modern {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.nav-item-modern {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.95rem;
  font-weight: 500;
  position: relative;
  overflow: hidden;
}

.nav-item-modern::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 3px;
  height: 100%;
  background: linear-gradient(180deg, #6366f1, #8b5cf6);
  opacity: 0;
  transition: opacity 0.2s;
}

.nav-item-modern:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  transform: translateX(4px);
}

.nav-item-modern.active {
  background: rgba(99, 102, 241, 0.15);
  color: #fff;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.nav-item-modern.active::before {
  opacity: 1;
}

.nav-item-modern svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  filter: grayscale(0.3);
  transition: all 0.2s;
}

.nav-item-modern:hover svg,
.nav-item-modern.active svg {
  filter: grayscale(0);
  transform: scale(1.1);
}

.sidebar-footer-modern {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.settings-item {
  margin-bottom: 8px;
}

.user-section-modern {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.user-avatar-modern {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #10b981, #059669);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.user-info-modern {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-status {
  font-size: 0.75rem;
  color: #10b981;
  font-weight: 500;
}

/* Scrollbar */
.sidebar-nav-modern::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav-modern::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav-modern::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.sidebar-nav-modern::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar-modern-app {
    width: 70px;
  }

  .logo-text,
  .nav-item-modern span,
  .user-info-modern {
    display: none;
  }

  .logo-section {
    justify-content: center;
  }

  .nav-item-modern {
    justify-content: center;
    padding: 12px;
  }

  .user-section-modern {
    justify-content: center;
    padding: 8px;
  }
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
