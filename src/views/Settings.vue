<template>
  <div class="page">
    <div class="page-container">
      <div class="page-header">
        <h2>{{ $t('settings.title') }}</h2>
      </div>

      <div class="settings-grid">
        <!-- Appearance Card -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">{{ $t('settings.appearance') || 'Appearance' }}</h3>
          </div>
          <!-- Language Section -->
          <div class="settings-section">
            <div class="settings-section-title">{{ $t('settings.language') }}</div>
            <div class="settings-row">
              <div class="settings-info">
                <h4>{{ $t('settings.language') }}</h4>
              </div>
              <div class="select-wrapper">
                <select class="select" v-model="localSettings.language" @change="updateSettings">
                  <option value="en">English</option>
                  <option value="uk">Українська</option>
                  <option value="de">Deutsch</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Theme Section -->
          <div class="settings-section">
            <div class="settings-section-title">{{ $t('settings.theme') }}</div>
            <div class="settings-row">
              <div class="settings-info">
                <h4>{{ $t('settings.theme') }}</h4>
              </div>
              <div class="select-wrapper">
                <select class="select" v-model="localSettings.theme" @change="updateSettings">
                  <option value="dark">{{ $t('settings.themeDark') }}</option>
                  <option value="light">{{ $t('settings.themeLight') }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Tracking & System Card -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">{{ $t('settings.system') || 'System' }}</h3>
          </div>
          <!-- Tracking Section -->
          <div class="settings-section">
            <div class="settings-section-title">{{ $t('settings.tracking') }}</div>
            <div class="settings-row">
              <div class="settings-info">
                 <h4>{{ store.isTracking ? $t('settings.trackingActive') : $t('settings.trackingInactive') }}</h4>
              </div>
              <button v-if="store.isTracking" class="btn btn-danger" @click="store.stopTracking">
                {{ $t('settings.stopTracking') }}
              </button>
              <button v-else class="btn btn-success" @click="store.startTracking">
                {{ $t('settings.startTracking') }}
              </button>
            </div>
            <div class="settings-row">
              <div class="settings-info">
                <h4>{{ $t('settings.autostart') }}</h4>
              </div>
              <label class="toggle">
                <input type="checkbox" v-model="localSettings.autostart" @change="updateSettings" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="settings-row">
              <div class="settings-info">
                <h4>{{ $t('settings.minimizeToTray') }}</h4>
              </div>
              <label class="toggle">
                <input type="checkbox" v-model="localSettings.minimize_to_tray" @change="updateSettings" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <!-- Data Card -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">{{ $t('settings.dataManagement') }}</h3>
          </div>
          <!-- Data Sync Section -->
          <div class="settings-section">
            <div class="settings-section-title">{{ $t('settings.dataSync') || 'Data Sync' }}</div>
            
            <!-- Google Drive Sync -->
            <div class="settings-row">
              <div class="settings-info">
                <h4>{{ $t('settings.syncGoogle') || 'Google Account Sync' }}</h4>
                <p>{{ $t('settings.syncGoogleDesc') || 'Sync your activity data to Google Drive' }}</p>
              </div>
              <div v-if="!isGoogleConnected" class="export-section">
                <button class="btn-google" @click="connectGoogle">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {{ $t('settings.connectGoogle') || 'Connect Google' }}
                </button>
              </div>
              <div v-else class="sync-actions">
                 <div class="sync-status synced">
                   <span class="sync-indicator synced"></span>
                   {{ $t('settings.connected') || 'Connected' }}
                 </div>
                 <div class="sync-buttons">
                    <button class="btn-outline small" @click="startBackup" title="Upload to Drive">
                      ↑ Backup
                    </button>
                    <button class="btn-outline small" @click="startRestore" title="Download from Drive">
                      ↓ Restore
                    </button>
                 </div>
              </div>
            </div>

            <!-- Local Storage -->
            <div class="settings-row">
              <div class="settings-info">
                <h4>{{ $t('settings.localStorage') || 'Local Storage' }}</h4>
                <p>{{ $t('settings.localStorageDesc') || 'Export or import your data locally' }}</p>
              </div>
              <div class="export-section">
                <button class="btn-outline" @click="exportDataJSON">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  JSON
                </button>
                <button class="btn-outline" @click="exportDataCSV">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  CSV
                </button>
                <button class="btn-outline" @click="importData">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {{ $t('settings.import') || 'Import' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- About Card -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">{{ $t('settings.about') }}</h3>
          </div>
          <div class="settings-section">
            <div class="settings-row">
              <div class="settings-info">
                <h4>{{ $t('settings.version') }}</h4>
                <p>TimiGS Application</p>
              </div>
              <span class="version-badge">{{ latestVersion }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showToast" class="toast success">
        <span>✓</span>
        {{ toastMessage }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useActivityStore, type Settings } from '../stores/activity';
import { setLanguage } from '../i18n';
import { invoke } from '@tauri-apps/api/core';


const { t } = useI18n();
const store = useActivityStore();
const showToast = ref(false);
const toastMessage = ref('');
const isGoogleConnected = ref(false);

const localSettings = reactive<Settings>({
  language: 'en',
  theme: 'dark',
  autostart: true,
  minimize_to_tray: true
});

function showNotification(message: string) {
  toastMessage.value = message;
  showToast.value = true;
  setTimeout(() => showToast.value = false, 2000);
}

async function updateSettings() {
  setLanguage(localSettings.language);
  document.documentElement.setAttribute('data-theme', localSettings.theme);
  await store.saveSettings({ ...localSettings });
  showNotification(t('settings.saved'));
}

async function connectGoogle() {
  try {
    showNotification('Starting Google login...');
    const result = await invoke('login_google');
    showNotification(result as string);
    isGoogleConnected.value = true;
    await checkGoogleUser();
  } catch (e) {
    showNotification(`Login failed: ${e}`);
  }
}

async function checkGoogleUser() {
  try {
      const user = await invoke<string | null>('get_google_user');
      if (user) {
        isGoogleConnected.value = true;
      }
  } catch(e) {
      console.error(e);
  }
}

async function startBackup() {
  try {
    showNotification('Backing up data...');
    const result = await invoke('backup_data');
    showNotification(result as string);
  } catch (e) {
    showNotification(`Backup failed: ${e}`);
  }
}

async function startRestore() {
  try {
    showNotification('Restoring data...');
    const result = await invoke('restore_data');
    showNotification(result as string);
  } catch (e) {
    showNotification(`Restore failed: ${e}`);
  }
}

function exportDataJSON() {
  const data = {
    sessions: store.todaySessions,
    summary: store.todaySummary,
    exportedAt: new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadFile(blob, 'timigs-data.json');
  showNotification('Data exported as JSON!');
}

function exportDataCSV() {
  const headers = ['App Name', 'Window Title', 'Start Time', 'End Time', 'Duration (seconds)'];
  const rows = store.todaySessions.map(s => [
    s.app_name,
    s.window_title.replace(/,/g, ';'),
    s.start_time,
    s.end_time || '',
    s.duration_seconds
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  downloadFile(blob, 'timigs-data.csv');
  showNotification('Data exported as CSV!');
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        showNotification('Data imported successfully!');
        console.log('Imported data:', data);
      } catch {
        showNotification('Failed to import data');
      }
    }
  };
  input.click();
}

const latestVersion = ref('1.1.0');

async function fetchLatestVersion() {
  try {
    const response = await fetch('https://api.github.com/repos/baneronetwo/timiGS-/releases/latest');
    if (response.ok) {
      const data = await response.json();
      latestVersion.value = data.tag_name || '1.1.0';
    }
  } catch (e) {
    console.error('Failed to fetch version:', e);
  }
}

onMounted(async () => {
  await store.fetchSettings();
  await store.fetchTrackingStatus();
  Object.assign(localSettings, store.settings);
  await checkGoogleUser();
  fetchLatestVersion();
});
</script>

<style scoped>
.version-badge {
  background: var(--bg-tertiary);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  color: var(--text-muted);
}

.sync-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
}

.sync-buttons {
    display: flex;
    gap: 8px;
}

.btn-outline.small {
    padding: 6px 12px;
    font-size: 0.8rem;
    height: auto;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

@media (max-width: 800px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
