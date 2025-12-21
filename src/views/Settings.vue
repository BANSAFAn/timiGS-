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
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="uk">Українська</option>
                  <option value="zh">简体中文</option>
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

            <!-- GitHub Connection -->
            <div class="settings-row">
              <div class="settings-info">
                <h4>{{ $t('github.connection') || 'GitHub Connection' }}</h4>
                <p>{{ $t('github.connectDesc') || 'Connect your GitHub account to track your coding activity' }}</p>
              </div>
              <div v-if="!isGitHubConnected" class="github-connect">
                <input 
                  type="password" 
                  v-model="githubToken" 
                  :placeholder="$t('github.tokenPlaceholder') || 'Enter your Personal Access Token'"
                  class="input token-input"
                />
                <button class="btn-github-connect" @click="connectGitHub">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                  </svg>
                  {{ $t('github.connect') || 'Connect GitHub' }}
                </button>
                <a class="token-link" href="https://github.com/settings/tokens" target="_blank">{{ $t('github.getToken') || 'Get your token here' }} →</a>
              </div>
              <div v-else class="sync-actions">
                <div class="sync-status synced">
                  <span class="sync-indicator synced"></span>
                  {{ $t('settings.connected') || 'Connected' }}
                </div>
                <button class="btn-outline small" @click="disconnectGitHub">{{ $t('github.disconnect') || 'Disconnect' }}</button>
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

            <!-- Email Reports -->
            <div class="settings-row">
              <div class="settings-info">
                <h4>{{ $t('settings.emailReports') || 'Email Reports' }}</h4>
                <p>{{ $t('settings.emailReportsDesc') || 'Send weekly activity report to your email' }}</p>
              </div>
              <div class="email-report-section">
                <input 
                  type="email" 
                  v-model="reportEmail" 
                  :placeholder="$t('settings.emailPlaceholder') || 'your@email.com'"
                  class="input email-input"
                />
                <button class="btn-send-report" @click="sendEmailReport">
                  📧 {{ $t('settings.sendReport') || 'Send Report' }}
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
const reportEmail = ref('');

const localSettings = reactive<Settings>({
  language: 'en',
  theme: 'dark',
  autostart: true,
  minimize_to_tray: true
});

// GitHub connection
const githubToken = ref('');
const isGitHubConnected = ref(false);

async function connectGitHub() {
  if (!githubToken.value) return;
  
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${githubToken.value}` }
    });
    
    if (response.ok) {
      localStorage.setItem('github_token', githubToken.value);
      isGitHubConnected.value = true;
      // Trigger storage event for App.vue to update nav
      window.dispatchEvent(new Event('storage'));
      showNotification('GitHub connected!');
    } else {
      showNotification('Invalid token');
    }
  } catch (e) {
    showNotification('Connection failed');
  }
}

function disconnectGitHub() {
  localStorage.removeItem('github_token');
  githubToken.value = '';
  isGitHubConnected.value = false;
  window.dispatchEvent(new Event('storage'));
  showNotification('GitHub disconnected');
}

function checkGitHubStatus() {
  isGitHubConnected.value = !!localStorage.getItem('github_token');
}

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

async function sendEmailReport() {
  if (!reportEmail.value || !reportEmail.value.includes('@')) {
    showNotification('Please enter a valid email address');
    return;
  }
  
  // Fetch latest data
  await store.fetchTodayData();
  await store.fetchWeeklyStats();
  
  const report = store.generateWeeklyReport();
  const subject = encodeURIComponent('TimiGS Weekly Activity Report');
  const body = encodeURIComponent(report);
  
  // Open mailto link
  window.open(`mailto:${reportEmail.value}?subject=${subject}&body=${body}`, '_blank');
  showNotification('Email client opened with report!');
}

onMounted(async () => {
  await store.fetchSettings();
  await store.fetchTrackingStatus();
  Object.assign(localSettings, store.settings);
  await checkGoogleUser();
  checkGitHubStatus();
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

.email-report-section {
  display: flex;
  gap: 12px;
  align-items: center;
}

.email-input {
  width: 220px;
  padding: 10px 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all var(--transition-fast);
}

.email-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.email-input::placeholder {
  color: var(--text-muted);
}

.btn-send-report {
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent-1));
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-send-report:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.github-connect {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.token-input {
  width: 250px;
  padding: 10px 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.token-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.btn-github-connect {
  padding: 10px 20px;
  background: #24292e;
  border: none;
  border-radius: var(--radius-md);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-github-connect:hover {
  background: #1a1e22;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.token-link {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.875rem;
}

.token-link:hover {
  text-decoration: underline;
}
</style>
