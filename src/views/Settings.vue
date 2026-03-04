<template>
  <div class="page page-shell">
    <div class="page-container settings-page" style="max-width: 1200px;">
      <div class="page-header modern-header">
        <div class="header-content">
          <div class="header-icon" v-html="Icons.settings"></div>
          <div>
            <h2>{{ $t("settings.title") }}</h2>
            <p class="header-subtitle">
              {{ $t("settings.subtitle") || "Customize your experience" }}
            </p>
          </div>
        </div>
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
        <div class="modern-card">
          <div class="card-header-modern">
            <div class="card-icon" v-html="Icons.appearance"></div>
            <div>
              <h3 class="card-title-modern">{{ $t("settings.appearance") }}</h3>
              <p class="card-subtitle">Personalize your interface</p>
            </div>
          </div>

          <div class="settings-group">
            <div class="setting-item">
              <div class="setting-left">
                <div class="setting-icon" v-html="Icons.language"></div>
                <div class="setting-content">
                  <label class="setting-label">{{ $t("settings.language") }}</label>
                  <p class="setting-description">Choose your preferred language</p>
                </div>
              </div>
              <div
                class="custom-select modern-select"
                :class="{ open: langOpen }"
                @click="langOpen = !langOpen"
              >
                <div class="selected-option">
                  <span class="flag-icon">{{ currentLangFlag }}</span>
                  <span class="lang-name">{{ currentLangName }}</span>
                  <span class="chevron">▼</span>
                </div>
                <div class="options-list" v-show="langOpen">
                  <div
                    v-for="lang in availableLanguages"
                    :key="lang.code"
                    class="option-item"
                    @click.stop="changeLanguage(lang.code)"
                  >
                    <span class="flag-icon">{{ lang.flag }}</span>
                    {{ lang.name }}
                  </div>
                </div>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-left">
                <div class="setting-icon" v-html="Icons.theme"></div>
                <div class="setting-content">
                  <label class="setting-label">{{ $t("settings.theme") }}</label>
                  <p class="setting-description">Switch between dark and light mode</p>
                </div>
              </div>
              <div class="theme-switcher-modern">
                 <button
                   class="theme-btn-modern"
                   :class="{ active: localSettings.theme === 'dark' }"
                   @click="setTheme('dark')"
                 >
                   <span class="theme-icon" v-html="Icons.theme"></span>
                   <span class="theme-label">Dark</span>
                 </button>
                 <button
                   class="theme-btn-modern"
                   :class="{ active: localSettings.theme === 'light' }"
                   @click="setTheme('light')"
                 >
                   <span class="theme-icon" v-html="Icons.themeLight"></span>
                   <span class="theme-label">Light</span>
                 </button>
              </div>
            </div>
          </div>
        </div>

        <!-- System -->
        <div class="modern-card">
          <div class="card-header-modern">
            <div class="card-icon" v-html="Icons.system"></div>
            <div>
              <h3 class="card-title-modern">{{ $t("settings.system") }}</h3>
              <p class="card-subtitle">Manage app behavior</p>
            </div>
          </div>

          <div class="settings-group">

            <div class="setting-item">
              <div class="setting-left">
                <div class="setting-icon" v-html="Icons.tracking"></div>
                <div class="setting-content">
                  <label class="setting-label">{{ $t("settings.tracking") }}</label>
                  <p class="setting-description">{{ store.isTracking ? "Active" : "Paused" }}</p>
                </div>
              </div>
              <button 
                class="btn" 
                :class="store.isTracking ? 'btn-danger' : 'btn-success'"
                @click="toggleTracking"
              >
                {{ store.isTracking ? $t("settings.stopTracking") : $t("settings.startTracking") }}
              </button>
            </div>

            <div class="setting-item">
              <div class="setting-left">
                <div class="setting-icon" v-html="Icons.autostart"></div>
                <div class="setting-content">
                  <label class="setting-label">{{ $t("settings.autostart") }}</label>
                  <p class="setting-description">Launch TimiGS on system startup</p>
                </div>
              </div>
              <div
                class="toggle-switch"
                :class="{ checked: localSettings.autostart }"
                @click="toggleAutostart"
              >
                <div class="toggle-thumb"></div>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-left">
                <div class="setting-icon" v-html="Icons.tray"></div>
                <div class="setting-content">
                  <label class="setting-label">{{ $t("settings.minimizeToTray") }}</label>
                  <p class="setting-description">Keep running in background</p>
                </div>
              </div>
              <div
                class="toggle-switch"
                :class="{ checked: localSettings.minimize_to_tray }"
                @click="toggleMinimize"
              >
                <div class="toggle-thumb"></div>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-left">
                <div class="setting-icon" v-html="Icons.discord"></div>
                <div class="setting-content">
                  <label class="setting-label">{{ $t("settings.discordRpc") || "Discord Rich Presence" }}</label>
                  <p class="setting-description">{{ $t("settings.discordRpcDesc") || "Show activity on Discord profile" }}</p>
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
        </div>

        <!-- Updates -->
        <div class="modern-card">
          <div class="card-header-modern">
            <div class="card-icon" v-html="Icons.update"></div>
            <div>
              <h3 class="card-title-modern">{{ $t("settings.updates") }}</h3>
              <p class="card-subtitle">v{{ appVersion }}</p>
            </div>
          </div>
          <p class="text-muted sm" style="margin-bottom: 16px">
            Check for the latest features and improvements.
          </p>
          <button class="btn btn-primary full-width" @click="checkForUpdates">
            {{ $t("settings.checkForUpdates") }}
          </button>
        </div>

        <!-- Data Management -->
        <div class="modern-card">
          <div class="card-header-modern">
            <div class="card-icon" v-html="Icons.dataManage"></div>
            <div>
              <h3 class="card-title-modern">{{ $t("settings.dataManagement") }}</h3>
              <p class="card-subtitle">Export or reset your data</p>
            </div>
          </div>

          <div class="settings-group">
            <div class="setting-item">
              <div class="setting-left">
                <div class="setting-icon" v-html="Icons.dataExport"></div>
                <div class="setting-content">
                  <label class="setting-label">{{ $t("settings.exportData") }}</label>
                  <p class="setting-description">{{ $t("settings.exportDataDesc") }}</p>
                </div>
              </div>
              <div class="export-buttons">
                <button class="btn btn-secondary" @click="exportData('csv')" :disabled="isExporting">
                  CSV
                </button>
                <button class="btn btn-secondary" @click="exportData('html')" :disabled="isExporting">
                  HTML (Beautiful)
                </button>
              </div>
            </div>

            <div class="setting-item auto-export-item">
              <div class="setting-left">
                <div class="setting-icon" v-html="Icons.update"></div>
                <div class="setting-content">
                  <label class="setting-label">Auto-Export</label>
                  <p class="setting-description">Automatically export data at regular intervals</p>
                </div>
              </div>
              <div class="auto-export-settings">
                <label class="toggle-switch">
                  <input type="checkbox" v-model="autoExportEnabled" @change="saveAutoExportSettings" />
                  <span class="toggle-slider"></span>
                </label>
                <div v-if="autoExportEnabled" class="auto-export-options">
                  <select v-model="autoExportInterval" @change="saveAutoExportSettings" class="interval-select">
                    <option :value="1">Every hour</option>
                    <option :value="6">Every 6 hours</option>
                    <option :value="12">Every 12 hours</option>
                    <option :value="24">Daily</option>
                    <option :value="48">Every 2 days</option>
                  </select>
                  <span v-if="autoExportFolder" class="folder-path" :title="autoExportFolder">{{ autoExportFolder }}</span>
                  <button @click="selectExportFolder" class="btn btn-secondary btn-small">
                    <span style="margin-right: 4px;" v-html="Icons.folder"></span> Select
                  </button>
                </div>
              </div>
            </div>

            <div class="setting-item danger-zone">
              <div class="setting-left">
                <div class="setting-icon danger-icon" v-html="Icons.dataReset"></div>
                <div class="setting-content">
                  <label class="setting-label" style="color: #ef4444">{{ $t("settings.resetData") }}</label>
                  <p class="setting-description">{{ $t("settings.resetDataDesc") }}</p>
                </div>
              </div>
              <button class="btn btn-danger" @click="showResetModal = true">
                {{ $t("settings.resetData") }}
              </button>
            </div>
          </div>
        </div>

        <!-- About & License (Mandatory Attribution) -->
        <div class="modern-card">
          <div class="card-header-modern">
            <div class="card-icon" v-html="Icons.about"></div>
            <div>
              <h3 class="card-title-modern">About & License</h3>
              <p class="card-subtitle">Software information</p>
            </div>
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

    <!-- Update Modal -->
    <Teleport to="body">
      <div
        v-if="showUpdateModal"
        class="update-modal-overlay"
        @click.self="!isUpdating && (showUpdateModal = false)"
      >
        <div class="update-modal">
          <div class="update-modal-header">
            <div class="update-icon" v-html="Icons.update"></div>
            <h2>Update Available!</h2>
          </div>
          <div class="update-modal-body">
            <p class="update-version">
              Version <strong>{{ updateVersion }}</strong> is ready
            </p>
            <p class="update-desc">
              A new version of TimiGS is available with new features and
              improvements.
            </p>
            <!-- Download Progress -->
            <div v-if="isUpdating" class="update-progress-section">
              <div class="update-progress-header">
                <span>{{ updateStatusText }}</span>
                <span v-if="updateProgress > 0">{{ updateProgress }}%</span>
              </div>
              <div class="update-progress-track">
                <div class="update-progress-fill" :style="{ width: updateProgress + '%' }"></div>
              </div>
            </div>
          </div>
          <div class="update-modal-actions">
            <button class="btn btn-secondary" @click="showUpdateModal = false" :disabled="isUpdating">
              Later
            </button>
            <button class="btn btn-primary" @click="installUpdate" :disabled="isUpdating">
              <span v-if="isUpdating" class="updating-spinner"></span>
              {{ updateButtonText }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Reset Confirmation Modal -->
    <Teleport to="body">
      <div
        v-if="showResetModal"
        class="update-modal-overlay"
        @click.self="showResetModal = false"
      >
        <div class="update-modal">
          <div class="update-modal-header">
            <div class="update-icon danger-icon-large" v-html="Icons.dataReset"></div>
            <h2 style="color: #ef4444">{{ $t('settings.resetConfirmTitle') }}</h2>
          </div>
          <div class="update-modal-body">
            <p class="update-desc" style="color: #fbbf24; font-weight: 500">
              <span style="margin-right: 6px;" v-html="Icons.warning"></span>{{ $t('settings.resetConfirmMsg') }}
            </p>
            <div style="margin-top: 16px">
              <label style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px; display: block">
                {{ $t('settings.resetTypeConfirm') }}
              </label>
              <input
                v-model="resetConfirmText"
                type="text"
                placeholder="RESET"
                class="reset-input"
                @keyup.enter="resetConfirmText === 'RESET' && confirmResetData()"
              />
            </div>
          </div>
          <div class="update-modal-actions">
            <button class="btn btn-secondary" @click="showResetModal = false; resetConfirmText = ''">
              {{ $t('common.cancel') }}
            </button>
            <button
              class="btn btn-danger"
              :disabled="resetConfirmText !== 'RESET' || isResetting"
              @click="confirmResetData"
            >
              <span v-if="isResetting" class="updating-spinner"></span>
              {{ isResetting ? $t('settings.resetting') : $t('settings.resetData') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from "vue";
import { useI18n } from "vue-i18n";
import { invoke } from "@tauri-apps/api/core";
import { useActivityStore } from "../stores/activity";
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { getVersion } from '@tauri-apps/api/app';
import { useNotificationStore } from "../stores/notifications";
import { Icons } from "../components/icons/IconMap";
import { save, open } from '@tauri-apps/plugin-dialog';

const { locale, t } = useI18n();
const store = useActivityStore();
const notifications = useNotificationStore();

// Language State
const langOpen = ref(false);
const availableLanguages = [
  { code: "en", name: "English", flag: "" },
  { code: "uk", name: "Українська", flag: "" },
  { code: "de", name: "Deutsch", flag: "" },
  { code: "fr", name: "Français", flag: "" },
  { code: "es", name: "Español", flag: "" },
  { code: "zh-CN", name: "中文 (简体)", flag: "" },
  { code: "ar", name: "العربية", flag: "" },
];

const currentLangFlag = computed(
  () =>
    availableLanguages.find((l) => l.code === localSettings.language)?.flag ||
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`
);
const currentLangName = computed(
  () =>
    availableLanguages.find((l) => l.code === localSettings.language)?.name ||
    "Language"
);

function changeLanguage(code: string) {
  localSettings.language = code;
  saveSettings();
  langOpen.value = false;
}

function setTheme(theme: string) {
  localSettings.theme = theme;
  saveSettings();
}

const isReady = ref(false);
const globalError = ref("");

const appVersion = ref("...");


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

    // 2.5 Fetch real app version
    try {
      appVersion.value = await getVersion();
    } catch {
      appVersion.value = "unknown";
    }
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

async function toggleTracking() {
  // Check if on Android and handle permissions
  if (store.isMobile) {
    try {
      // Check if permission is granted
      const hasPermission = await safeInvoke("check_usage_permission");

      if (!hasPermission) {
        // Request permission
        const confirmed = confirm(
          "TimiGS needs 'Usage Access' permission to track app activity on Android. " +
          "You will be redirected to Settings to grant this permission."
        );

        if (confirmed) {
          await safeInvoke("request_usage_permission");
          alert("Please grant 'Usage Access' permission in Settings, then try again.");
        }
        return;
      }
    } catch (e) {
      console.error("Permission check failed:", e);
      alert("Failed to check permissions: " + e);
      return;
    }
  }

  // Check if on Linux and warn about dependencies
  if (!store.isMobile && navigator.userAgent.includes("Linux")) {
    // Check if xdotool or wmctrl is available
    const { Command } = await import('@tauri-apps/plugin-shell');
    try {
      const xdotoolCheck = await Command.create('which', ['xdotool']).execute();
      const wmctrlCheck = await Command.create('which', ['wmctrl']).execute();

      if (!xdotoolCheck.stdout.trim() && !wmctrlCheck.stdout.trim()) {
        const confirmed = confirm(
          "On Linux, TimiGS requires either 'xdotool' or 'wmctrl' to track active windows.\n\n" +
          "Please install one of them:\n" +
          "  - Debian/Ubuntu: sudo apt install xdotool wmctrl\n" +
          "  - Fedora: sudo dnf install xdotool wmctrl\n" +
          "  - Arch: sudo pacman -S xdotool wmctrl\n\n" +
          "Click OK to continue anyway, or Cancel to install first."
        );

        if (!confirmed) {
          return;
        }
      }
    } catch (e) {
      console.warn("Could not check for xdotool/wmctrl:", e);
    }
  }

  if (store.isTracking) {
    await store.stopTracking();
  } else {
    await store.startTracking();
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

// Update modal state
const isUpdating = ref(false);
const showUpdateModal = ref(false);
const updateVersion = ref("");
const updateProgress = ref(0);
const updateStatusText = ref('Preparing...');
let cachedUpdate: any = null;

const updateButtonText = computed(() => {
  if (!isUpdating.value) return 'Update Now';
  if (updateProgress.value > 0 && updateProgress.value < 100) return `Downloading... ${updateProgress.value}%`;
  if (updateProgress.value >= 100) return 'Installing...';
  return 'Preparing...';
});

async function checkForUpdates() {
  try {
    // Primary: GitHub API (reliable, always has releases)
    const response = await window.fetch("https://api.github.com/repos/BANSAFAn/timiGS-/releases/latest");
    if (!response.ok) throw new Error("GitHub API unavailable");
    const data = await response.json();
    const latestVersion = data.tag_name.replace("v", "");
    if (latestVersion !== appVersion.value) {
      updateVersion.value = latestVersion;
      // Try to get Tauri updater handle for downloadAndInstall
      try {
        const update = await check();
        if (update) cachedUpdate = update;
      } catch { /* Tauri updater not available, will use browser fallback */ }
      showUpdateModal.value = true;
    } else {
      notifications.info(t('settings.noUpdates', 'You are using the latest version.'));
    }
  } catch (error) {
    console.error("GitHub API check failed:", error);
    // Fallback: Tauri updater plugin
    try {
      const update = await check();
      if (update) {
        updateVersion.value = update.version;
        cachedUpdate = update;
        showUpdateModal.value = true;
      } else {
        notifications.info(t('settings.noUpdates', 'You are using the latest version.'));
      }
    } catch (e2) {
      notifications.error('Failed to check for updates. Please check your internet connection.');
    }
  }
}

async function installUpdate() {
  isUpdating.value = true;
  updateProgress.value = 0;
  updateStatusText.value = 'Downloading update...';

  try {
    // Re-check if we don't have cached update
    if (!cachedUpdate) {
      cachedUpdate = await check();
    }

    if (cachedUpdate) {
      let contentLength = 0;
      let downloaded = 0;

      await cachedUpdate.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            updateStatusText.value = 'Downloading...';
            break;
          case 'Progress':
            downloaded += event.data.chunkLength || 0;
            if (contentLength > 0) {
              updateProgress.value = Math.round((downloaded / contentLength) * 100);
            }
            break;
          case 'Finished':
            updateProgress.value = 100;
            updateStatusText.value = 'Installing...';
            break;
        }
      });

      updateStatusText.value = 'Restarting...';
      await relaunch();
    } else {
      notifications.error('No update available to install.');
      isUpdating.value = false;
    }
  } catch (error) {
    console.error('Update installation failed:', error);
    notifications.error('Update failed: ' + error);
    isUpdating.value = false;
    updateProgress.value = 0;
  }
}

// Data Management
const showResetModal = ref(false);
const resetConfirmText = ref('');
const isResetting = ref(false);
const isExporting = ref(false);

// Auto-export settings
const autoExportEnabled = ref(false);
const autoExportInterval = ref(24);
const autoExportFolder = ref('');

async function loadAutoExportSettings() {
  try {
    const settings: any = await invoke('get_auto_export_settings_cmd');
    autoExportEnabled.value = settings.enabled;
    autoExportInterval.value = settings.interval_hours;
    autoExportFolder.value = settings.folder || '';
  } catch (e) {
    console.error('Failed to load auto-export settings:', e);
  }
}

async function saveAutoExportSettings() {
  try {
    await invoke('save_auto_export_settings_cmd', {
      enabled: autoExportEnabled.value,
      intervalHours: autoExportInterval.value,
      folder: autoExportFolder.value
    });
    notifications.success('Auto-export settings saved');
  } catch (e) {
    console.error('Failed to save auto-export settings:', e);
    notifications.error('Failed to save settings');
  }
}

async function selectExportFolder() {
  try {
    const folder = await open({
      directory: true,
      multiple: false,
      defaultPath: autoExportFolder.value || undefined
    });
    if (folder) {
      autoExportFolder.value = Array.isArray(folder) ? folder[0] : folder;
      saveAutoExportSettings();
    }
  } catch (e) {
    console.error('Failed to select folder:', e);
  }
}

async function exportData(format: 'csv' | 'html' = 'csv') {
  isExporting.value = true;
  try {
    const filePath = await save({
      defaultPath: `TimiGS_Activity_${new Date().toISOString().slice(0, 10)}.${format}`,
      filters: [{ name: format.toUpperCase(), extensions: [format] }],
    });
    if (filePath) {
      await invoke(format === 'csv' ? 'export_data_csv_cmd' : 'export_data_html_cmd', { path: filePath });
      notifications.success(t('settings.exportSuccess'));
    }
  } catch (e: any) {
    console.error('Export failed:', e);
    notifications.error(t('settings.exportError') + ': ' + e);
  } finally {
    isExporting.value = false;
  }
}

async function confirmResetData() {
  if (resetConfirmText.value !== 'RESET') return;
  isResetting.value = true;
  try {
    await invoke('reset_all_data_cmd');
    notifications.success(t('settings.resetSuccess'));
    showResetModal.value = false;
    resetConfirmText.value = '';
    // Re-init settings to reflect defaults
    await initSettings();
  } catch (e: any) {
    console.error('Reset failed:', e);
    notifications.error('Reset failed: ' + e);
  } finally {
    isResetting.value = false;
  }
}

onMounted(() => {
  // Delay slightly to allow transition
  setTimeout(initSettings, 100);
  loadAutoExportSettings();
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

/* Premium Theme Switcher - Pill Style */
.theme-switcher {
  display: flex;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.theme-btn {
  position: relative;
  padding: 10px 20px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.theme-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.theme-btn.active {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
}

.theme-btn.active:hover {
  background: linear-gradient(135deg, #7c7ff7 0%, #9d6ffa 100%);
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

/* Custom Select */
.custom-select {
  position: relative;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  min-width: 200px;
  user-select: none;
}
.selected-option {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.chevron {
  margin-left: auto;
  font-size: 0.8rem;
  opacity: 0.7;
  transition: transform 0.2s;
}
.custom-select.open .chevron {
  transform: rotate(180deg);
}
.options-list {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: rgba(30, 30, 35, 0.95);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  z-index: 9999;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  padding: 6px;
}
.option-item {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
  border-radius: 8px;
  margin-bottom: 2px;
  font-weight: 500;
}
.option-item:hover {
  background: var(--bg-hover);
}
.flag-icon {
  font-size: 1.2rem;
}

/* Update Modal */
.update-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.update-modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 32px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.update-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

.update-modal-header h2 {
  margin: 0 0 16px;
  color: var(--text-primary);
}

.update-version {
  font-size: 1.1rem;
  margin-bottom: 8px;
  color: var(--color-primary);
}

.update-desc {
  color: var(--text-muted);
  margin-bottom: 24px;
}

.update-modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.updating-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;
}

/* Modern Design System */
.settings-page {
  max-width: 1000px;
  margin: 0 auto;
}

.modern-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  font-size: 3rem;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
  border-radius: 20px;
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.header-subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
  margin-top: 4px;
}

/* Modern Cards */
.modern-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.modern-card:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.card-header-modern {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.card-icon {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15));
  border-radius: 14px;
  border: 1px solid rgba(99, 102, 241, 0.25);
}

.card-title-modern {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.card-subtitle {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 4px 0 0 0;
}

/* Settings Group */
.settings-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 18px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 14px;
  transition: all 0.2s;
  gap: 14px;
}

.setting-item:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
}

.setting-left {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  width: 100%;
}

.setting-icon {
  font-size: 1.5rem;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  flex-shrink: 0;
}
.setting-icon :deep(svg) {
  width: 24px;
  height: 24px;
}

.setting-content {
  flex: 1;
  min-width: 0;
  max-width: 100%;
}

.setting-label {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
  margin-bottom: 4px;
}

.setting-description {
  font-size: 0.92rem;
  color: rgba(255, 255, 255, 0.65);
  margin: 0;
  line-height: 1.5;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Modern Theme Switcher */
.theme-switcher-modern {
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.03);
  padding: 4px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  align-self: flex-start;
}

.theme-btn-modern {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: var(--text-muted);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: 100px;
}

.theme-btn-modern:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.theme-btn-modern.active {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.theme-icon {
  font-size: 1.3rem;
}

.theme-label {
  font-size: 0.95rem;
  font-weight: 600;
}

/* Modern Select */
.modern-select {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  min-width: 180px;
  transition: all 0.2s;
}

.modern-select:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
}

.modern-select.open {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Export Buttons */
.export-buttons {
  display: flex;
  gap: 8px;
}

.export-buttons .btn {
  min-width: 80px;
}

/* Auto-Export Settings */
.auto-export-item {
  flex-direction: column;
  align-items: stretch;
}

.auto-export-settings {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;
  flex-wrap: wrap;
}

.auto-export-options {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.interval-select {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  flex-shrink: 0;
}

.folder-path {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
  display: block;
}

.btn-small {
  padding: 8px 12px;
  font-size: 0.85rem;
  flex-shrink: 0;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
  cursor: pointer;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.1);
  transition: 0.3s;
  border-radius: 26px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 2px;
  bottom: 2px;
  background-color: var(--text-muted);
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-switch input:checked + .toggle-slider {
  background-color: var(--color-primary);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(24px);
  background-color: white;
}

/* Legacy toggle-switch (div-based) */
.toggle-switch.checked .toggle-thumb {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  transform: translateX(24px);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: var(--text-muted);
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .setting-item {
    padding: 16px;
    gap: 12px;
  }
  
  .theme-switcher-modern {
    width: 100%;
  }
  
  .theme-btn-modern {
    flex: 1;
    justify-content: center;
  }
  
  .modern-select {
    width: 100%;
  }
  
  .header-icon {
    width: 60px;
    height: 60px;
    font-size: 2.5rem;
  }
}

/* Data Management - Danger Zone */
.danger-zone {
  border-color: rgba(239, 68, 68, 0.2);
  background: rgba(239, 68, 68, 0.03);
}

.danger-zone:hover {
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.06);
}

.danger-icon {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.danger-icon :deep(svg) {
  stroke: #ef4444;
}

.danger-icon-large {
  color: #ef4444;
}

.danger-icon-large :deep(svg) {
  stroke: #ef4444;
  width: 40px;
  height: 40px;
}

.reset-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 2px;
  text-align: center;
  outline: none;
  transition: all 0.2s;
}

.reset-input:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

.reset-input::placeholder {
  color: rgba(239, 68, 68, 0.4);
  letter-spacing: 4px;
}

.btn-danger {
  background: linear-gradient(135deg, #dc2626, #ef4444);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-danger:hover:not(:disabled) {
  background: linear-gradient(135deg, #b91c1c, #dc2626);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
  transform: translateY(-1px);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

</style>

