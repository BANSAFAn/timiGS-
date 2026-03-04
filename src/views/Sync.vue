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
    // In a real implementation, this would connect to the remote device
    // For now, we'll simulate successful pairing
    const success = await syncStore.acceptPairing(
      enteredCode.value,
      'remote-device-id',
      'Remote Device',
      syncStore.deviceType === 'desktop' ? 'mobile' : 'desktop'
    );
    
    if (success) {
      enteredCode.value = '';
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

// Icon component
function IconDevice({ type }: { type: 'desktop' | 'mobile' }) {
  return type === 'desktop' 
    ? '🖥️' 
    : '📱';
}
</script>

<style scoped>
.sync-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.sync-header {
  margin-bottom: 30px;
}

.sync-header h1 {
  font-size: 2rem;
  margin-bottom: 10px;
}

.sync-description {
  color: var(--text-muted);
}

.card {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card h2 {
  margin-bottom: 20px;
  font-size: 1.5rem;
}

/* Device Info */
.device-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.device-icon {
  font-size: 3rem;
}

.device-details h3 {
  margin-bottom: 5px;
}

.device-id {
  color: var(--text-muted);
  font-family: monospace;
  font-size: 0.9rem;
  margin-bottom: 10px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.connected {
  background: rgba(34, 197, 94, 0.2);
  color: rgb(34, 197, 94);
}

.status-badge.disconnected {
  background: rgba(107, 114, 128, 0.2);
  color: rgb(107, 114, 128);
}

.status-badge.connecting {
  background: rgba(251, 191, 36, 0.2);
  color: rgb(251, 191, 36);
}

.status-badge.error {
  background: rgba(239, 68, 68, 0.2);
  color: rgb(239, 68, 68);
}

/* Pairing */
.pairing-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.pairing-option h3 {
  margin-bottom: 10px;
}

.pairing-option p {
  color: var(--text-muted);
  margin-bottom: 15px;
}

.code-display {
  background: var(--bg-secondary);
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  margin: 15px 0;
}

.code {
  font-size: 2rem;
  font-family: monospace;
  letter-spacing: 4px;
  font-weight: bold;
  color: var(--primary);
}

.code-expires {
  color: var(--text-muted);
  margin-top: 10px;
}

.code-input-group {
  display: flex;
  gap: 10px;
}

.code-input {
  flex: 1;
  padding: 12px;
  font-size: 1.2rem;
  text-align: center;
  letter-spacing: 4px;
  font-family: monospace;
  text-transform: uppercase;
}

/* Paired Devices */
.paired-device {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: var(--bg-secondary);
  border-radius: 8px;
  margin-bottom: 10px;
}

.paired-device-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.paired-device-info h4 {
  margin-bottom: 5px;
}

.device-id-small {
  color: var(--text-muted);
  font-family: monospace;
  font-size: 0.8rem;
}

.last-sync {
  font-size: 0.85rem;
  color: var(--text-muted);
}

/* Sync Methods */
.method-option {
  margin-bottom: 20px;
}

.method-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.method-header h3 {
  margin-bottom: 5px;
}

.method-header p {
  color: var(--text-muted);
}

.api-config {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
}

.input-field {
  padding: 12px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--input-bg);
  color: var(--text);
}

/* Sync Queue */
.queue-list {
  margin-bottom: 15px;
}

.queue-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: var(--bg-secondary);
  border-radius: 6px;
  margin-bottom: 8px;
}

.queue-item-info {
  display: flex;
  gap: 15px;
  font-size: 0.9rem;
}

.queue-type {
  font-weight: 500;
  text-transform: capitalize;
}

.queue-time,
.queue-retries {
  color: var(--text-muted);
}

.queue-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  text-transform: capitalize;
}

.queue-status.pending {
  background: rgba(251, 191, 36, 0.2);
  color: rgb(251, 191, 36);
}

.queue-status.sent {
  background: rgba(59, 130, 246, 0.2);
  color: rgb(59, 130, 246);
}

.queue-status.confirmed {
  background: rgba(34, 197, 94, 0.2);
  color: rgb(34, 197, 94);
}

/* Backup */
.backup-actions {
  display: flex;
  gap: 10px;
}

/* Settings */
.setting-row {
  margin-bottom: 15px;
}

.setting-row label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

/* Toggle Switch */
.toggle {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
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
  background-color: var(--border-color);
  transition: 0.3s;
  border-radius: 26px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle input:checked + .toggle-slider {
  background-color: var(--primary);
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--border-color);
}

.btn-danger {
  background: rgba(239, 68, 68, 0.2);
  color: rgb(239, 68, 68);
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.3);
}

.btn-small {
  padding: 6px 12px;
  font-size: 0.9rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
