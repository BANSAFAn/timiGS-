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
          <span>{{ $t("nav.dashboard") }}</span>
        </router-link>

        <router-link to="/timeline" class="nav-link" active-class="active">
          <div class="nav-icon" v-html="Icons.timeline"></div>
          <span>{{ $t("nav.timeline") }}</span>
        </router-link>

        <router-link to="/analytics" class="nav-link" active-class="active">
          <div class="nav-icon" v-html="Icons.analytics"></div>
          <span>{{ $t("nav.analytics") }}</span>
        </router-link>

        <router-link to="/weather" class="nav-link" active-class="active">
          <div class="nav-icon" v-html="Icons.weather"></div>
          <span>Weather</span>
        </router-link>
        
        <router-link to="/transfer" class="nav-link" active-class="active">
          <div class="nav-icon" v-html="Icons.transfer"></div>
          <span>Transfer</span>
        </router-link>

        <router-link to="/tools" class="nav-link" active-class="active">
          <div class="nav-icon" v-html="Icons.tools"></div>
          <span>{{ $t("nav.tools") }}</span>
        </router-link>

        <router-link
          v-if="isGitHubConnected"
          to="/github"
          class="nav-link"
          active-class="active"
        >
          <div class="nav-icon" v-html="Icons.github"></div>
          <span>{{ $t("nav.github") }}</span>
        </router-link>

        <router-link to="/settings" class="nav-link" active-class="active">
          <div class="nav-icon" v-html="Icons.settings"></div>
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
    <nav class="bottom-nav" v-if="shouldShowNav">
      <router-link to="/" class="bottom-nav-item" active-class="active">
        <div class="nav-icon-mobile" v-html="Icons.dashboard"></div>
        <span>DB</span>
      </router-link>

      <router-link to="/timeline" class="bottom-nav-item" active-class="active">
        <div class="nav-icon-mobile" v-html="Icons.timeline"></div>
        <span>Time</span>
      </router-link>

      <router-link
        to="/analytics"
        class="bottom-nav-item"
        active-class="active"
      >
        <div class="nav-icon-mobile" v-html="Icons.analytics"></div>
        <span>Stats</span>
      </router-link>
      
      <router-link to="/weather" class="bottom-nav-item" active-class="active">
         <div class="nav-icon-mobile" v-html="Icons.weather"></div>
        <span>Weather</span>
      </router-link>

      <router-link to="/transfer" class="bottom-nav-item" active-class="active">
        <div class="nav-icon-mobile" v-html="Icons.transfer"></div>
        <span>Send</span>
      </router-link>

      <router-link to="/settings" class="bottom-nav-item" active-class="active">
        <div class="nav-icon-mobile" v-html="Icons.settings"></div>
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
import { Icons } from "./components/icons/IconMap";

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
  const { readDir } = await import('@tauri-apps/plugin-fs');
  const { convertFileSrc } = await import('@tauri-apps/api/core');

  // Music Logic
  let audio: HTMLAudioElement | null = null;

  async function playRandomMusic() {
    try {
      // Resolve the 'music' folder from resources
      const { resolveResource } = await import('@tauri-apps/api/path');
      const resourcePath = await resolveResource('music');
      
      console.log("Music resource path:", resourcePath);

      const entries = await readDir(resourcePath);
      const audioFiles = entries.filter(e => 
        e.isFile && /\.(mp3|wav|ogg|flac|m4a)$/i.test(e.name)
      );

      if (audioFiles.length > 0) {
        const randomFile = audioFiles[Math.floor(Math.random() * audioFiles.length)];
        
        // Construct path consistently (handles Windows/Unix separators)
        const { join } = await import('@tauri-apps/api/path');
        const fullPath = await join(resourcePath, randomFile.name);
        
        const assetUrl = convertFileSrc(fullPath);
        
        if (audio) {
            audio.pause();
            audio = null;
        }
        
        audio = new Audio(assetUrl);
        audio.loop = true; 
        audio.volume = 0.5;
        await audio.play();
        console.log("Playing background music:", randomFile.name);
      } else {
          console.warn("No music files found in public/music (resources)");
      }
    } catch (e) {
      console.error("Failed to play music:", e);
    }
  }

  function stopMusic() {
    if (audio) {
      audio.pause();
      audio = null;
    }
  }

  await listen('timeout-break-start', () => {
    playRandomMusic();
  });

  await listen('timeout-break-end', () => {
    stopMusic();
  });
  
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
