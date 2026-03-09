<template>
  <div class="sync-container">
    <div class="sync-header">
      <h1>{{ t('sync.title') }}</h1>
      <p class="sync-description">{{ t('sync.description') }}</p>
    </div>

    <!-- Device Info -->
    <div class="card device-info">
      <div class="device-icon">
        <IconDevice :type="syncStore.deviceType" />
      </div>
      <div class="device-details">
        <h3>{{ syncStore.deviceName }}</h3>
        <p class="device-id">{{ syncStore.deviceId }}</p>
        <span class="status-badge" :class="syncStore.connectionStatus">
          {{ t(`sync.status.${syncStore.connectionStatus}`) }}
        </span>
      </div>
    </div>

    <!-- Pairing Section -->
    <div class="card pairing-section">
      <h2>{{ t('sync.pairing.title') }}</h2>
      
      <div v-if="!syncStore.isPaired" class="pairing-options">
        <!-- Generate Code -->
        <div class="pairing-option">
          <h3>{{ t('sync.pairing.generateCode') }}</h3>
          <p>{{ t('sync.pairing.generateCodeDesc') }}</p>
          
          <div v-if="pairingCode" class="code-display">
            <div class="code">{{ formatCode(pairingCode) }}</div>
            <p class="code-expires">{{ t('sync.pairing.expiresIn') }}: {{ expiresIn }}s</p>
          </div>
          
          <button 
            class="btn btn-primary" 
            @click="generateCode"
            :disabled="generatingCode"
          >
            {{ generatingCode ? t('common.generating') : t('sync.pairing.generateCodeBtn') }}
          </button>
        </div>

        <!-- Enter Code -->
        <div class="pairing-option">
          <h3>{{ t('sync.pairing.enterCode') }}</h3>
          <p>{{ t('sync.pairing.enterCodeDesc') }}</p>
          
          <div class="code-input-group">
            <input 
              v-model="enteredCode" 
              type="text" 
              maxlength="6"
              :placeholder="t('sync.pairing.codePlaceholder')"
              class="code-input"
            />
            <button 
              class="btn btn-secondary"
              @click="acceptCode"
              :disabled="!enteredCode || acceptingCode"
            >
              {{ acceptingCode ? t('common.connecting') : t('sync.pairing.connectBtn') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Paired Devices -->
      <div v-else class="paired-devices">
        <h3>{{ t('sync.pairing.pairedDevices') }}</h3>
        
        <div v-for="device in syncStore.pairedDevices" :key="device.id" class="paired-device">
          <div class="paired-device-info">
            <IconDevice :type="device.type" />
            <div>
              <h4>{{ device.name }}</h4>
              <p class="device-id-small">{{ device.id }}</p>
              <p class="last-sync">
                {{ device.lastSync ? formatLastSync(device.lastSync) : t('sync.pairing.neverSynced') }}
              </p>
            </div>
          </div>
          
          <button 
            class="btn btn-danger btn-small"
            @click="removeDevice(device.id)"
          >
            {{ t('sync.pairing.remove') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Sync Methods -->
    <div class="card sync-methods">
      <h2>{{ t('sync.methods.title') }}</h2>
      
      <div class="method-option">
        <div class="method-header">
          <div>
            <h3>{{ t('sync.methods.p2p.title') }}</h3>
            <p>{{ t('sync.methods.p2p.description') }}</p>
          </div>
          <label class="toggle">
            <input type="checkbox" v-model="useP2P" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="method-option">
        <div class="method-header">
          <div>
            <h3>{{ t('sync.methods.api.title') }}</h3>
            <p>{{ t('sync.methods.api.description') }}</p>
          </div>
        </div>
        
        <div class="api-config">
          <input 
            v-model="apiEndpoint"
            type="url"
            :placeholder="t('sync.methods.api.endpointPlaceholder')"
            class="input-field"
          />
          <input 
            v-model="apiToken"
            type="password"
            :placeholder="t('sync.methods.api.tokenPlaceholder')"
            class="input-field"
          />
          <button class="btn btn-secondary" @click="saveAPIConfig">
            {{ t('common.save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Sync Queue -->
    <div v-if="syncStore.pendingCount > 0" class="card sync-queue">
      <h2>{{ t('sync.queue.title') }} ({{ syncStore.pendingCount }})</h2>
      
      <div class="queue-list">
        <div v-for="item in syncStore.pendingSyncs" :key="item.id" class="queue-item">
          <div class="queue-item-info">
            <span class="queue-type">{{ item.payload.type }}</span>
            <span class="queue-time">{{ formatTime(item.createdAt) }}</span>
            <span class="queue-retries">{{ t('sync.queue.retries') }}: {{ item.retries }}</span>
          </div>
          <span class="queue-status" :class="item.status">
            {{ t(`sync.queue.status.${item.status}`) }}
          </span>
        </div>
      </div>
      
      <button class="btn btn-primary" @click="syncNow" :disabled="syncStore.isSyncing">
        {{ syncStore.isSyncing ? t('sync.syncing') : t('sync.syncNow') }}
      </button>
    </div>

    <!-- Export/Import -->
    <div class="card export-import">
      <h2>{{ t('sync.backup.title') }}</h2>
      
      <div class="backup-actions">
        <button class="btn btn-secondary" @click="exportBackup">
          {{ t('sync.backup.export') }}
        </button>
        
        <button class="btn btn-secondary" @click="triggerImport">
          {{ t('sync.backup.import') }}
        </button>
        
        <input 
          ref="importInput"
          type="file" 
          accept=".json"
          style="display: none"
          @change="importBackup"
        />
      </div>
    </div>

    <!-- Sync Settings -->
    <div class="card sync-settings">
      <h2>{{ t('sync.settings.title') }}</h2>
      
      <div class="setting-row">
        <label>
          <input type="checkbox" v-model="syncEnabled" />
          {{ t('sync.settings.enableSync') }}
        </label>
      </div>
      
      <div class="setting-row">
        <label>
          <input type="checkbox" v-model="autoSync" />
          {{ t('sync.settings.autoSync') }}
        </label>
      </div>
      
      <div class="setting-row">
        <label>
          <input type="checkbox" v-model="syncOnMetered" />
          {{ t('sync.settings.syncOnMetered') }}
        </label>
      </div>
      
      <button class="btn btn-danger" @click="clearAllSyncData">
        {{ t('sync.settings.clearData') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSyncStore } from '../stores/sync';
import { writeTextFile } from '@tauri-apps/plugin-fs';

const { t } = useI18n();
const syncStore = useSyncStore();

// Pairing state
const pairingCode = ref<string>('');
const enteredCode = ref('');
const generatingCode = ref(false);
const acceptingCode = ref(false);
const expiresIn = ref(300);

// Sync methods
const useP2P = ref(false);
const apiEndpoint = ref('');
const apiToken = ref('');

// Settings
const syncEnabled = ref(true);
const autoSync = ref(true);
const syncOnMetered = ref(false);

// Refs
const importInput = ref<HTMLInputElement | null>(null);

// Countdown timer for pairing code
let countdownInterval: number | null = null;

onMounted(async () => {
  await syncStore.initialize();
  syncStore.loadAPIConfig();
  syncStore.loadP2PPreference();

  useP2P.value = syncStore.useP2P;
  apiEndpoint.value = syncStore.apiEndpoint;
  apiToken.value = syncStore.apiToken;
  syncEnabled.value = syncStore.syncEnabled;

  // Listen for sync events
  window.addEventListener('timigs-sync-received', handleSyncReceived);
  
  // Listen for pairing completed event
  window.addEventListener('timigs-sync-paired', () => {
    // Force UI refresh when pairing completes
    console.log('[Sync] Pairing completed, refreshing UI');
  });

  // Start auto-sync if enabled
  if (autoSync.value) {
    startAutoSync();
  }
});

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval);
  window.removeEventListener('timigs-sync-received', handleSyncReceived);
  stopAutoSync();
});

// Watch for P2P changes
useP2P.value = syncStore.useP2P;

// Generate pairing code
async function generateCode() {
  generatingCode.value = true;
  try {
    const result = await syncStore.createPairing();
    pairingCode.value = result.code;
    
    // Start countdown
    expiresIn.value = 300;
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = window.setInterval(() => {
      expiresIn.value--;
      if (expiresIn.value <= 0) {
        pairingCode.value = '';
        if (countdownInterval) clearInterval(countdownInterval);
      }
    }, 1000);
  } catch (error) {
    console.error('Failed to generate code:', error);
  } finally {
    generatingCode.value = false;
  }
}

// Accept pairing code
async function acceptCode() {
  if (!enteredCode.value) return;

  acceptingCode.value = true;
  try {
    // Get our device info to send to the remote device
    const deviceInfo = {
      deviceId: syncStore.deviceId,
      deviceName: syncStore.deviceName,
      deviceType: syncStore.deviceType
    };

    const success = await syncStore.acceptPairing(
      enteredCode.value,
      deviceInfo.deviceId,
      deviceInfo.deviceName,
      deviceInfo.deviceType
    );

    if (success) {
      enteredCode.value = '';
      // Refresh the UI by re-initializing
      await syncStore.initialize();
    }
  } catch (error) {
    console.error('Failed to accept code:', error);
  } finally {
    acceptingCode.value = false;
  }
}

// Remove paired device
async function removeDevice(deviceId: string) {
  if (confirm(t('sync.pairing.removeConfirm'))) {
    await syncStore.removePairedDevice(deviceId);
  }
}

// Save API config
function saveAPIConfig() {
  syncStore.configureAPI(apiEndpoint.value, apiToken.value);
}

// Sync now
async function syncNow() {
  try {
    await syncStore.syncNow();
  } catch (error) {
    console.error('Sync failed:', error);
    alert(t('sync.syncFailed'));
  }
}

// Export backup
async function exportBackup() {
  try {
    const backup = await syncStore.exportBackup();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `timiGS-backup-${timestamp}.json`;
    
    // Save file
    await writeTextFile(filename, JSON.stringify(backup, null, 2));
  } catch (error) {
    console.error('Export failed:', error);
    alert(t('sync.backup.exportFailed'));
  }
}

// Trigger import file picker
async function triggerImport() {
  importInput.value?.click();
}

// Import backup
async function importBackup(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  
  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string);
        await syncStore.receiveSyncPayload({
          id: `import-${Date.now()}`,
          timestamp: Date.now(),
          type: 'full_backup',
          data: backup,
          deviceId: syncStore.deviceId,
          deviceType: syncStore.deviceType
        });
        alert(t('sync.backup.importSuccess'));
      } catch (error) {
        console.error('Import failed:', error);
        alert(t('sync.backup.importFailed'));
      }
    };
    reader.readAsText(file);
  } finally {
    target.value = '';
  }
}

// Clear all sync data
async function clearAllSyncData() {
  if (confirm(t('sync.settings.clearDataConfirm'))) {
    syncStore.clearSyncData();
  }
}

// Handle received sync
async function handleSyncReceived(event: Event) {
  const customEvent = event as CustomEvent;
  await syncStore.receiveSyncPayload(customEvent.detail);
}

// Auto-sync
let autoSyncInterval: number | null = null;

function startAutoSync() {
  if (autoSyncInterval) return;
  autoSyncInterval = window.setInterval(() => {
    if (syncEnabled.value && syncStore.isPaired) {
      syncStore.processQueue();
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}

function stopAutoSync() {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
  }
}

// Formatters
function formatCode(code: string): string {
  return code.match(/.{1,3}/g)?.join('-') || code;
}

function formatLastSync(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return t('sync.time.minutesAgo', { count: minutes });
  if (hours < 24) return t('sync.time.hoursAgo', { count: hours });
  return t('sync.time.daysAgo', { count: days });
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

// Icon component with SVG
function IconDevice({ type }: { type: 'desktop' | 'mobile' }) {
  if (type === 'desktop') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
      <line x1="8" y1="21" x2="16" y2="21"></line>
      <line x1="12" y1="17" x2="12" y2="21"></line>
    </svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
    <line x1="12" y1="18" x2="12" y2="18"></line>
  </svg>`;
}
</script>

<style scoped>
.sync-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.sync-header {
  margin-bottom: 32px;
  text-align: center;
}

.sync-header h1 {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.sync-description {
  color: var(--text-muted);
  font-size: 1rem;
}

.card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.card:hover {
  border-color: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
}

.card h2 {
  margin-bottom: 20px;
  font-size: 1.25rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Device Info */
.device-info {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 28px;
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.1) 0%, rgba(167, 139, 250, 0.05) 100%);
  border: 1px solid rgba(96, 165, 250, 0.2);
}

.device-icon {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(167, 139, 250, 0.2) 100%);
  border-radius: 16px;
  color: #60a5fa;
}

.device-icon :deep(svg) {
  width: 40px;
  height: 40px;
}

.device-details h3 {
  margin-bottom: 6px;
  font-size: 1.25rem;
  font-weight: 600;
}

.device-id {
  color: var(--text-muted);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.85rem;
  margin-bottom: 12px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  display: inline-block;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-badge::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.status-badge.connected {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.status-badge.disconnected {
  background: rgba(107, 114, 128, 0.15);
  color: #6b7280;
}

.status-badge.connecting {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.status-badge.error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

/* Pairing */
.pairing-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.pairing-option {
  background: rgba(0, 0, 0, 0.15);
  padding: 20px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.pairing-option h3 {
  margin-bottom: 8px;
  font-size: 1.1rem;
  font-weight: 600;
}

.pairing-option p {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-bottom: 16px;
}

.code-display {
  background: rgba(0, 0, 0, 0.3);
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  margin-bottom: 16px;
  border: 1px solid rgba(96, 165, 250, 0.2);
}

.code {
  font-size: 2rem;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 8px;
  color: #60a5fa;
  margin-bottom: 8px;
}

.code-expires {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.code-input-group {
  display: flex;
  gap: 10px;
}

.code-input {
  flex: 1;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 1.1rem;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: 4px;
  text-align: center;
  transition: all 0.2s;
}

.code-input:focus {
  outline: none;
  border-color: #60a5fa;
  background: rgba(255, 255, 255, 0.08);
}

/* Paired Devices */
.paired-devices {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.paired-devices h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.paired-device {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s;
}

.paired-device:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.paired-device-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.paired-device-info :deep(svg) {
  width: 40px;
  height: 40px;
  color: #60a5fa;
}

.paired-device-info h4 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.device-id-small {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-family: 'JetBrains Mono', monospace;
}

.last-sync {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 2px;
}

/* Sync Methods */
.method-option {
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  margin-bottom: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.method-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.method-header h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.method-header p {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.api-config {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.input-field {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.2s;
}

.input-field:focus {
  outline: none;
  border-color: #60a5fa;
  background: rgba(255, 255, 255, 0.08);
}

/* Toggle */
.toggle {
  position: relative;
  display: inline-block;
  width: 52px;
  height: 28px;
  flex-shrink: 0;
}

.toggle input {
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
  background: rgba(255, 255, 255, 0.1);
  border-radius: 28px;
  transition: all 0.3s;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: all 0.3s;
}

.toggle input:checked + .toggle-slider {
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

/* Sync Queue */
.sync-queue h2 {
  display: flex;
  align-items: center;
  gap: 10px;
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  max-height: 300px;
  overflow-y: auto;
}

.queue-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.queue-item-info {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.queue-type {
  font-size: 0.85rem;
  font-weight: 600;
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.15);
  padding: 4px 10px;
  border-radius: 6px;
}

.queue-time {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.queue-retries {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.queue-status {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  padding: 3px 8px;
  border-radius: 6px;
}

.queue-status.pending {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.queue-status.syncing {
  background: rgba(96, 165, 250, 0.15);
  color: #60a5fa;
}

.queue-status.completed {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.queue-status.failed {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

/* Export/Import */
.export-import h2 {
  margin-bottom: 16px;
}

.backup-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* Sync Settings */
.sync-settings h2 {
  margin-bottom: 20px;
}

.setting-row {
  margin-bottom: 16px;
}

.setting-row label {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
  cursor: pointer;
}

.setting-row input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #60a5fa;
  cursor: pointer;
}

/* Buttons */
.btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-danger {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.btn-danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.4);
}

.btn-small {
  padding: 8px 16px;
  font-size: 0.85rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .sync-container {
    padding: 16px;
  }

  .sync-header h1 {
    font-size: 1.5rem;
  }

  .device-info {
    flex-direction: column;
    text-align: center;
  }

  .device-icon {
    width: 56px;
    height: 56px;
  }

  .pairing-options {
    grid-template-columns: 1fr;
  }

  .code-input-group {
    flex-direction: column;
  }

  .method-header {
    flex-direction: column;
  }

  .toggle {
    width: 100%;
    max-width: 60px;
  }

  .queue-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .backup-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
