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
            <div
              class="custom-select"
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

          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Auto Sync</div>
              <div class="setting-desc">
                Automatically backup data every 30 minutes
              </div>
            </div>
            <div
              class="toggle-switch"
              :class="{ checked: localSettings.auto_sync }"
              @click="toggleAutoSync"
            >
              <div class="toggle-thumb"></div>
            </div>
          </div>
        </div>

        <!-- Google Drive (Multi-Account) -->
        <div class="glass-card">
          <div class="card-header">
            <h3 class="card-title">{{ $t("settings.googleDrive") }}</h3>
            <button class="btn btn-primary btn-sm" @click="handleGoogleAuth">
              <span v-if="isConnecting" class="spinner-sm"></span>
              {{ $t("Connect Account") }}
            </button>
          </div>

          <div class="accounts-list">
            <div v-if="cloudAccounts.length === 0" class="empty-accounts">
              <p>No accounts connected.</p>
            </div>

            <div
              v-for="acc in cloudAccounts"
              :key="acc.id"
              class="account-card"
            >
              <div class="account-info">
                <div class="account-email">{{ acc.email }}</div>
                <div class="account-date">
                  Connected: {{ new Date(acc.created_at).toLocaleDateString() }}
                </div>
                <div
                  class="account-folder"
                  v-if="selectedFolders[acc.id]"
                  style="font-size: 0.75rem; color: var(--color-primary)"
                >
                  📁 Target: {{ selectedFolders[acc.id].name }}
                </div>
              </div>
              <div class="account-actions">
                <button
                  class="btn-icon-action"
                  @click="browseFolders(acc.id)"
                  title="Browse Folders"
                >
                  📂
                </button>
                <button
                  class="btn-icon-action"
                  @click="promptCreateFolder(acc.id)"
                  title="Create Folder"
                >
                  ➕
                </button>
                <button
                  class="btn-icon-action"
                  @click="backupToAccount(acc.id)"
                  title="Export Here"
                >
                  ⬆️
                </button>
                <button
                  class="btn-icon-action"
                  @click="restoreFromAccount(acc.id)"
                  title="Import Here"
                >
                  ⬇️
                </button>
                <button
                  class="btn-icon-action btn-danger"
                  @click="unlinkAccount(acc.id)"
                  title="Unlink Account"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- GitHub -->
        <div class="glass-card">
          <div class="card-header">
            <h3 class="card-title">GitHub</h3>
            <button class="btn btn-secondary btn-sm" @click="openGitHubLogin">
              {{ isGitHubConnected ? "Reconnect" : "Connect" }}
            </button>
          </div>
          <div class="setting-desc">
            {{ isGitHubConnected ? "Connected" : "Track coding activity" }}
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

    <!-- Update Modal -->
    <Teleport to="body">
      <div
        v-if="showUpdateModal"
        class="update-modal-overlay"
        @click.self="showUpdateModal = false"
      >
        <div class="update-modal">
          <div class="update-modal-header">
            <div class="update-icon">🚀</div>
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
          </div>
          <div class="update-modal-actions">
            <button class="btn btn-secondary" @click="showUpdateModal = false">
              Later
            </button>
            <button class="btn btn-primary" @click="installUpdate">
              <span v-if="isUpdating" class="updating-spinner"></span>
              {{ isUpdating ? "Installing..." : "Update Now" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Folder Modal -->
    <Teleport to="body">
      <div
        v-if="showFolderModal"
        class="update-modal-overlay"
        @click.self="showFolderModal = false"
      >
        <div class="update-modal" style="text-align: left; max-width: 500px">
          <div
            class="update-modal-header"
            style="
              justify-content: space-between;
              display: flex;
              align-items: center;
            "
          >
            <h2 style="margin: 0">Select Folder</h2>
            <button class="btn-icon" @click="showFolderModal = false">✕</button>
          </div>
          <div
            class="update-modal-body"
            style="max-height: 400px; overflow-y: auto; text-align: left"
          >
            <div
              v-if="availableFolders.length === 0"
              class="text-muted"
              style="padding: 20px; text-align: center"
            >
              Loading folders or empty...
            </div>
            <div
              v-for="folder in availableFolders"
              :key="folder.id"
              class="folder-item"
              @click="selectFolder(folder)"
            >
              <span class="folder-icon">📁</span> {{ folder.name }}
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, onErrorCaptured, computed } from "vue";
import { useI18n } from "vue-i18n";
import { invoke } from "@tauri-apps/api/core";
import { useActivityStore } from "../stores/activity";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useRouter } from "vue-router";

const { locale } = useI18n();
const router = useRouter();
const store = useActivityStore();

// Language State
const langOpen = ref(false);
const availableLanguages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "uk", name: "Українська", flag: "🇺🇦" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "zh-CN", name: "中文 (简体)", flag: "🇨🇳" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
];

const currentLangFlag = computed(
  () =>
    availableLanguages.find((l) => l.code === localSettings.language)?.flag ||
    "🌐"
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
  auto_sync: false,
});

// Auto Sync Interval
let syncInterval: any = null;

function startAutoSync() {
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(() => {
    const githubToken = localStorage.getItem("github_token");
    safeInvoke("backup_data", { githubToken });
  }, 30 * 60 * 1000);
}

function stopAutoSync() {
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = null;
}

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

      if (localSettings.auto_sync) {
        startAutoSync();
      }

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
    fetchCloudAccounts();
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

function toggleAutoSync() {
  localSettings.auto_sync = !localSettings.auto_sync;
  saveSettings();
  if (localSettings.auto_sync) {
    startAutoSync();
  } else {
    stopAutoSync();
  }
}

function toggleMinimize() {
  localSettings.minimize_to_tray = !localSettings.minimize_to_tray;
  saveSettings();
}

function toggleDiscord() {
  localSettings.discord_rpc = !localSettings.discord_rpc;
  saveSettings();
}

// Google Drive & Cloud
const cloudAccounts = ref<any[]>([]);
const isConnecting = ref(false);

// Folder Selection State
const showFolderModal = ref(false);
const availableFolders = ref<any[]>([]);
const currentBrowsingAccount = ref<number | null>(null);
const selectedFolders = reactive<Record<number, { id: string; name: string }>>(
  {}
);

async function fetchCloudAccounts() {
  const accounts: any = await safeInvoke("get_cloud_accounts");
  if (Array.isArray(accounts)) {
    cloudAccounts.value = accounts;
  }
}

async function handleGoogleAuth() {
  isConnecting.value = true;
  try {
    await safeInvoke("login_google");
    // Wait a bit for DB update then refresh list
    setTimeout(fetchCloudAccounts, 2000);
  } finally {
    isConnecting.value = false;
  }
}

async function unlinkAccount(id: number) {
  if (confirm("Are you sure you want to unlink this account?")) {
    await safeInvoke("remove_cloud_account", { id });
    await fetchCloudAccounts();
    delete selectedFolders[id];
  }
}

async function promptCreateFolder(accountId: number) {
  const name = prompt("Enter folder name:");
  if (name) {
    try {
      await safeInvoke("create_drive_folder", { accountId, name });
      alert(`Folder '${name}' created successfully!`);
    } catch (e) {
      alert("Failed to create folder: " + e);
    }
  }
}

async function browseFolders(accountId: number) {
  currentBrowsingAccount.value = accountId;
  availableFolders.value = [];
  showFolderModal.value = true;

  try {
    const folders: any = await safeInvoke("list_drive_folders", { accountId });
    if (Array.isArray(folders)) {
      availableFolders.value = folders;
    }
  } catch (e) {
    alert("Failed to load folders: " + e);
    showFolderModal.value = false;
  }
}

function selectFolder(folder: any) {
  if (currentBrowsingAccount.value !== null) {
    selectedFolders[currentBrowsingAccount.value] = folder;
    showFolderModal.value = false;
  }
}

async function backupToAccount(accountId: number) {
  const folder = selectedFolders[accountId];
  const folderName = folder ? folder.name : "Default (TimiGS Logs)";
  const folderId = folder ? folder.id : null;

  if (confirm(`Export data to this account?\nTarget Folder: ${folderName}`)) {
    try {
      const githubToken = localStorage.getItem("github_token");
      await safeInvoke("backup_data", { accountId, githubToken, folderId });
      alert("Export successful!");
    } catch (e) {
      alert("Export failed: " + e);
    }
  }
}

async function restoreFromAccount(accountId: number) {
  const folder = selectedFolders[accountId];
  const folderName = folder ? folder.name : "Default (Global Search)";
  const folderId = folder ? folder.id : null;

  if (
    confirm(
      `Import data from this account?\nSource Folder: ${folderName}\nWARNING: Current local data will be replaced!`
    )
  ) {
    try {
      await safeInvoke("restore_data", { accountId, folderId });
      alert("Import successful! Please restart the app.");
    } catch (e) {
      alert("Import failed: " + e);
    }
  }
}

// GitHub
function checkGitHubStatus() {
  isGitHubConnected.value = !!localStorage.getItem("github_token");
}

function openGitHubLogin() {
  router.push("/github");
}

// Update modal state
const showUpdateModal = ref(false);
const updateVersion = ref("");
const isUpdating = ref(false);
let pendingUpdate: any = null;

async function checkForUpdates() {
  try {
    const update = await check();
    if (update?.available) {
      updateVersion.value = update.version;
      pendingUpdate = update;
      showUpdateModal.value = true;
    } else {
      // No update available - show toast or subtle message
      alert("You are on the latest version.");
    }
  } catch (error) {
    console.error("Update check failed:", error);
    alert(`Update check failed: ${error}`);
  }
}

async function installUpdate() {
  if (!pendingUpdate) return;

  isUpdating.value = true;
  try {
    await pendingUpdate.downloadAndInstall();
    await relaunch();
  } catch (e) {
    console.error("Update failed:", e);
    alert("Update failed: " + e);
    isUpdating.value = false;
  }
}

const exportData = () => {
  const githubToken = localStorage.getItem("github_token");
  safeInvoke("backup_data", { githubToken }).then(() => alert("Exported!"));
};
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

/* Multi-Account Styles */
.accounts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
}

.account-card {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  padding: 16px;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.account-email {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
  word-break: break-all;
}

.account-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.account-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  flex-wrap: wrap;
}

.account-actions .btn {
  flex: 1;
  min-width: 0;
  font-size: 0.75rem;
  padding: 6px 8px;
  white-space: nowrap;
}

.account-actions .btn-icon {
  flex: 0 0 auto;
  padding: 6px;
}

.btn-icon.danger {
  color: #ff4d4f;
  background: rgba(255, 77, 79, 0.1);
}

.btn-icon.danger:hover {
  background: rgba(255, 77, 79, 0.2);
}

.spinner-sm {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;
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
  z-index: 100;
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

/* Account Actions */
.account-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.btn-icon-action {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.1rem;
}
.btn-icon-action:hover {
  background: var(--bg-hover);
  transform: translateY(-2px);
}
.btn-icon-action.btn-danger:hover {
  background: rgba(255, 69, 58, 0.2);
  border-color: #ff453a;
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

.folder-item {
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;
}
.folder-item:hover {
  background: var(--bg-hover);
}
.folder-item:last-child {
  border-bottom: none;
}
.folder-icon {
  font-size: 1.2rem;
}
</style>
