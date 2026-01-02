<template>
  <div class="page page-shell">
    <div class="page-container">
      <div class="page-header">
        <h2>{{ $t("settings.title") }}</h2>
        <p>
          {{ $t("settings.subtitle") || "Manage your application preferences" }}
        </p>
      </div>

      <!-- Live Debug (Hidden in Prod usually, but good for now) -->
      <!-- <div v-if="globalError" class="glass-card" style="border-color: var(--color-danger); margin-bottom: 20px;">
        <h4 style="color: var(--color-danger)">Debug Info</h4>
        <pre style="font-size: 10px; overflow: auto; max-height: 100px;">{{ globalError }}</pre>
      </div> -->

      <!-- Loading State -->
      <div
        v-if="!isReady"
        class="glass-card flex-center"
        style="
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        "
      >
        <div class="spinner"></div>
        <p class="text-muted" style="margin-top: 20px">Loading settings...</p>
      </div>

      <!-- Settings Content -->
      <div v-else class="settings-grid animate-enter">
        <!-- Appearance -->
        <div class="glass-card">
          <div class="card-header">
            <h3 class="card-title">{{ $t("settings.appearance") }}</h3>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <label>{{ $t("settings.language") }}</label>
              <p class="setting-desc">Select your preferred language</p>
            </div>
            <div class="select-wrapper">
              <select
                v-model="localSettings.language"
                @change="saveSettings"
                class="input-glass"
              >
                <option value="en">English</option>
                <option value="uk">Українська</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
                <option value="zh-CN">中文 (简体)</option>
                <option value="ar">العربية</option>
              </select>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <label>{{ $t("settings.theme") }}</label>
              <p class="setting-desc">Toggle dark or light mode</p>
            </div>
            <div class="select-wrapper">
              <select
                v-model="localSettings.theme"
                @change="saveSettings"
                class="input-glass"
              >
                <option value="dark">{{ $t("settings.dark") }}</option>
                <option value="light">{{ $t("settings.light") }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- System -->
        <div class="glass-card">
          <div class="card-header">
            <h3 class="card-title">{{ $t("settings.system") }}</h3>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">{{ $t("settings.tracking") }}</div>
              <div class="setting-desc">
                {{ isTracking ? "Active" : "Paused" }}
              </div>
            </div>
            <button
              class="btn"
              :class="isTracking ? 'btn-danger' : 'btn-success'"
              @click="toggleTracking"
            >
              {{
                isTracking
                  ? $t("settings.stopTracking")
                  : $t("settings.startTracking")
              }}
            </button>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">{{ $t("settings.autostart") }}</div>
              <div class="setting-desc">Launch TimiGS on system startup</div>
            </div>
            <div
              class="toggle-switch"
              :class="{ checked: localSettings.autostart }"
              @click="toggleAutostart"
            >
              <div class="toggle-thumb"></div>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">
                {{ $t("settings.minimizeToTray") }}
              </div>
              <div class="setting-desc">Keep running in background</div>
            </div>
            <div
              class="toggle-switch"
              :class="{ checked: localSettings.minimize_to_tray }"
              @click="toggleMinimize"
            >
              <div class="toggle-thumb"></div>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">
                {{ $t("settings.discordRpc") || "Discord Rich Presence" }}
              </div>
              <div class="setting-desc">
                {{
                  $t("settings.discordRpcDesc") ||
                  "Show activity on Discord profile"
                }}
              </div>
            </div>
            <div
              class="toggle-switch"
              :class="{ checked: localSettings.discord_rpc }"
              @click="toggleDiscord"
            >
              <div class="toggle-thumb"></div>
            </div>
          </div>
        </div>

        <!-- Cloud & Data -->
        <div class="glass-card">
          <div class="card-header">
            <h3 class="card-title">Cloud & Data</h3>
          </div>

          <!-- Google Drive -->
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Google Drive</div>
              <div class="setting-desc" v-if="googleUser">
                Connected as {{ googleUser.name }}
              </div>
              <div class="setting-desc" v-else>Sync your data to the cloud</div>
            </div>
            <button class="btn btn-secondary" @click="handleGoogleAuth">
              {{ googleUser ? "Sync Now" : "Connect" }}
            </button>
          </div>

          <!-- GitHub -->
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">GitHub</div>
              <div class="setting-desc">
                {{ isGitHubConnected ? "Connected" : "Track coding activity" }}
              </div>
            </div>
            <button class="btn btn-secondary" @click="openGitHubLogin">
              {{ isGitHubConnected ? "Reconnect" : "Connect" }}
            </button>
          </div>

          <div class="divider"></div>

          <div class="data-actions">
            <button class="btn btn-secondary" @click="exportData">
              {{ $t("settings.exportData") }}
            </button>
            <button class="btn btn-secondary" @click="importData">
              {{ $t("settings.importData") }}
            </button>
          </div>
        </div>

        <!-- Updates -->
        <div class="glass-card">
          <div class="card-header">
            <h3 class="card-title">{{ $t("settings.updates") }}</h3>
            <span class="text-muted sm">v{{ appVersion }}</span>
          </div>
          <p class="text-muted sm" style="margin-bottom: 16px">
            Check for the latest features and improvements.
          </p>
          <button class="btn btn-primary full-width" @click="checkForUpdates">
            {{ $t("settings.checkForUpdates") }}
          </button>
        </div>

        <!-- About & License (Mandatory Attribution) -->
        <div class="glass-card">
          <div class="card-header">
            <h3 class="card-title">About & License</h3>
          </div>
          <div class="setting-info" style="text-align: center; padding: 10px 0">
            <p
              class="setting-desc"
              style="font-size: 0.9rem; color: var(--text-color)"
            >
              Original Software developed by
              <a
                href="https://github.com/BANSAFAn"
                target="_blank"
                style="color: var(--color-primary); font-weight: bold"
                >BANSAFAn</a
              >
            </p>
            <p class="setting-desc" style="font-size: 0.8rem; margin-top: 5px">
              Licensed under TimiGS Public License.
            </p>
            <p
              class="setting-desc"
              style="font-size: 0.75rem; margin-top: 10px; opacity: 0.7"
            >
              Protected by Copyright (c) 2026. The name "TimiGS" is reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, onErrorCaptured } from "vue";
import { useI18n } from "vue-i18n";
import { invoke } from "@tauri-apps/api/core";
import { useActivityStore } from "../stores/activity";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useRouter } from "vue-router";

const { locale } = useI18n();
const router = useRouter();
const store = useActivityStore();

// State
const isReady = ref(false);
const globalError = ref("");
const isTracking = ref(false);
const appVersion = ref("1.1.0");
const googleUser = ref<any>(null);
const isGitHubConnected = ref(false);

const localSettings = reactive({
  language: "en",
  theme: "dark",
  autostart: true,
  minimize_to_tray: true,
  discord_rpc: true,
});

// Helper for safe invokes
async function safeInvoke(cmd: string, args: any = {}) {
  try {
    return await invoke(cmd, args);
  } catch (e) {
    console.warn(`Cmd ${cmd} failed (non-critical):`, e);
    return null;
  }
}

async function initSettings() {
  globalError.value = "";
  try {
    // 1. Fetch backend settings
    const settings: any = await safeInvoke("get_settings");
    if (settings && typeof settings === "object") {
      Object.assign(localSettings, settings);

      // Sync frontend state
      locale.value = settings.language || "en";
      document.documentElement.setAttribute(
        "data-theme",
        settings.theme || "dark"
      );
    }

    // 2. Fetch system state
    await store.fetchTrackingStatus().catch(() => {});
    isTracking.value = store.isTracking;

    // 3. Status checks
    checkGoogleUser();
    checkGitHubStatus();
  } catch (e: any) {
    console.error("Init Settings Error:", e);
    globalError.value = e.toString();
  } finally {
    isReady.value = true;
  }
}

async function saveSettings() {
  locale.value = localSettings.language;
  document.documentElement.setAttribute("data-theme", localSettings.theme);
  await safeInvoke("save_settings", { settings: localSettings });
  await store.fetchSettings();
}

function toggleTracking() {
  if (isTracking.value) {
    safeInvoke("stop_tracking");
    isTracking.value = false;
  } else {
    safeInvoke("start_tracking");
    isTracking.value = true;
  }
}

function toggleAutostart() {
  localSettings.autostart = !localSettings.autostart;
  saveSettings();
}

function toggleMinimize() {
  localSettings.minimize_to_tray = !localSettings.minimize_to_tray;
  saveSettings();
}

function toggleDiscord() {
  localSettings.discord_rpc = !localSettings.discord_rpc;
  saveSettings();
}

// Google Drive
async function checkGoogleUser() {
  const user = await safeInvoke("get_google_user");
  if (user) googleUser.value = user;
}

async function handleGoogleAuth() {
  await safeInvoke("login_google");
  setTimeout(checkGoogleUser, 2000);
}

// GitHub
function checkGitHubStatus() {
  isGitHubConnected.value = !!localStorage.getItem("github_token");
}

function openGitHubLogin() {
  router.push("/github");
}

async function checkForUpdates() {
  try {
    const update = await check();
    if (update?.available) {
      const yes = confirm(
        `Update available: ${update.version}\\nDownload now?`
      );
      if (yes) {
        await update.downloadAndInstall();
        await relaunch();
      }
    } else {
      alert("You are on the latest version.");
    }
  } catch (error) {
    alert(`Update check failed: ${error}`);
  }
}

const exportData = () =>
  safeInvoke("backup_data").then(() => alert("Exported!"));
const importData = () =>
  safeInvoke("restore_data").then(() => alert("Imported!"));

onMounted(() => {
  // Delay slightly to allow transition
  setTimeout(initSettings, 100);
});
</script>

<style scoped>
.page-shell {
  padding-bottom: 80px; /* Space for mobile nav */
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
}

.setting-row:last-child {
  border-bottom: none;
}

.setting-label {
  font-weight: 600;
  margin-bottom: 4px;
}

.setting-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.divider {
  height: 1px;
  background: var(--border-color);
  margin: 20px 0;
}

.data-actions {
  display: flex;
  gap: 12px;
}

.full-width {
  width: 100%;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--bg-hover);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.text-muted {
  color: var(--text-muted);
}

.sm {
  font-size: 0.8rem;
}
</style>
