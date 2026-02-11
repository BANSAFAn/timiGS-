<template>
  <div class="focus-mode">
    <!-- Setup State -->
    <div v-if="!status" class="focus-setup">
      <div class="setup-section">
        <label class="section-label">🎯 Select Application</label>
        <select v-model="selectedApp" class="app-select">
          <option value="" disabled>Choose an app to focus on...</option>
          <option v-for="app in recentApps" :key="app.app_name" :value="app">
            {{ app.app_name }} ({{ formatDuration(app.total_seconds) }})
          </option>
        </select>
      </div>

      <div class="setup-section">
        <label class="section-label">⏱️ Duration</label>
        <div class="time-inputs">
          <div class="input-group">
            <label>{{ t('common.hours', 'Hours') }}</label>
            <input type="number" v-model.number="hours" min="0" max="24" placeholder="0" class="time-input" />
          </div>
          <span class="separator">:</span>
          <div class="input-group">
            <label>{{ t('common.minutes', 'Minutes') }}</label>
            <input type="number" v-model.number="minutes" min="0" max="59" placeholder="30" class="time-input" />
          </div>
          <span class="separator">:</span>
          <div class="input-group">
            <label>{{ t('common.seconds', 'Seconds') }}</label>
            <input type="number" v-model.number="seconds" min="0" max="59" placeholder="0" class="time-input" />
          </div>
        </div>
      </div>

      <div class="setup-section">
        <label class="section-label">🔒 Lock Password</label>
        <input type="password" v-model="password" class="password-input" placeholder="Enter a password to lock..." />
        <p class="hint">You'll need this password to cancel focus mode early</p>
      </div>

      <button @click="startFocus" class="btn-start" :disabled="!canStart">
        🚀 Start Focus Mode
      </button>
    </div>

    <!-- Active State -->
    <div v-else class="focus-active">
      <div class="focus-target">
        <div class="target-badge">🎯</div>
        <div class="target-info">
          <span class="target-name">{{ status.app_name }}</span>
          <span class="target-label">Focused Application</span>
        </div>
      </div>

      <div class="circular-progress">
        <svg viewBox="0 0 100 100">
          <circle class="bg" cx="50" cy="50" r="45"></circle>
          <circle class="fg" cx="50" cy="50" r="45" :stroke-dasharray="283" :stroke-dashoffset="progressOffset"></circle>
        </svg>
        <div class="time-display">{{ formattedTime }}</div>
      </div>

      <p class="focus-message">Other apps will be blocked</p>

      <div class="cancel-section">
        <input type="password" v-model="cancelPassword" class="password-input small" placeholder="Enter password to cancel..." />
        <button @click="stopFocus" class="btn-cancel">
          ✋ Cancel Focus
        </button>
        <p v-if="cancelError" class="error-text">{{ cancelError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { invoke } from '@tauri-apps/api/core';

const { t } = useI18n();

interface AppSummary {
  app_name: string;
  exe_path: string;
  total_seconds: number;
}

interface FocusStatus {
  active: boolean;
  app_name: string;
  exe_path: string;
  remaining_secs: number;
  total_secs: number;
}

const recentApps = ref<AppSummary[]>([]);
const selectedApp = ref<AppSummary | null>(null);
const hours = ref<number>(0);
const minutes = ref<number>(30);
const seconds = ref<number>(0);
const password = ref('');
const cancelPassword = ref('');
const cancelError = ref('');
const status = ref<FocusStatus | null>(null);
let pollInterval: number | null = null;

const canStart = computed(() => selectedApp.value && (hours.value > 0 || minutes.value > 0 || seconds.value > 0) && password.value.length >= 1);

const formattedTime = computed(() => {
  if (!status.value) return '';
  const r = status.value.remaining_secs;
  const h = Math.floor(r / 3600);
  const m = Math.floor((r % 3600) / 60);
  const s = r % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

const progressOffset = computed(() => {
  if (!status.value || status.value.total_secs === 0) return 283;
  return 283 - (283 * status.value.remaining_secs) / status.value.total_secs;
});

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

async function loadApps() {
  try {
    const summary = await invoke<AppSummary[]>('get_today_summary');
    recentApps.value = summary.sort((a, b) => b.total_seconds - a.total_seconds);
  } catch (e) {
    console.error('Failed to load apps:', e);
  }
}

async function loadStatus() {
  try {
    const s = await invoke<FocusStatus | null>('get_focus_status_cmd');
    if (s && s.active) {
      status.value = s;
      startPolling();
    } else {
      status.value = null;
    }
  } catch (e) {
    console.error('Failed to get focus status:', e);
  }
}

async function startFocus() {
  if (!selectedApp.value || !canStart.value) return;
  const totalSecs = (hours.value || 0) * 3600 + (minutes.value || 0) * 60 + (seconds.value || 0);
  try {
    await invoke('start_focus_cmd', {
      appName: selectedApp.value.app_name,
      exePath: selectedApp.value.exe_path,
      durationSecs: totalSecs,
      password: password.value,
    });
    password.value = '';
    await loadStatus();
  } catch (e: any) {
    alert(e);
  }
}

async function stopFocus() {
  cancelError.value = '';
  try {
    await invoke('stop_focus_cmd', { password: cancelPassword.value });
    cancelPassword.value = '';
    status.value = null;
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  } catch (e: any) {
    cancelError.value = e;
  }
}

function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = window.setInterval(async () => {
    const s = await invoke<FocusStatus | null>('get_focus_status_cmd');
    if (!s || !s.active) {
      status.value = null;
      if (pollInterval) clearInterval(pollInterval);
    } else {
      status.value = s;
    }
  }, 1000);
}

onMounted(() => {
  loadApps();
  loadStatus();
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<style scoped>
.focus-setup, .focus-active {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setup-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.app-select {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 0.95rem;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s;
}
.app-select:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}
.app-select option {
  background: #1a1a2e;
  color: white;
}

.time-inputs {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}
.input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.input-group label {
  font-size: 0.75rem;
  color: var(--text-muted);
}
.time-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 12px;
  border-radius: 10px;
  text-align: center;
  font-size: 1.2rem;
}
.time-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}
.separator {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-muted);
  padding-bottom: 12px;
}

.password-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 0.95rem;
}
.password-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}
.password-input.small {
  padding: 10px 12px;
  font-size: 0.9rem;
}

.hint {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0;
}

.btn-start {
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  letter-spacing: 0.5px;
}
.btn-start:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}
.btn-start:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Active State */
.focus-active {
  align-items: center;
  text-align: center;
}

.focus-target {
  display: flex;
  align-items: center;
  gap: 14px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  padding: 16px 24px;
  border-radius: 16px;
  width: 100%;
}
.target-badge {
  font-size: 1.8rem;
}
.target-info {
  display: flex;
  flex-direction: column;
  text-align: left;
}
.target-name {
  font-weight: 700;
  font-size: 1.1rem;
  color: #a78bfa;
}
.target-label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.circular-progress {
  position: relative;
  width: 160px;
  height: 160px;
  margin: 10px 0;
}
svg {
  transform: rotate(-90deg);
  width: 100%;
  height: 100%;
}
circle {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
}
.bg { stroke: rgba(255, 255, 255, 0.05); }
.fg {
  stroke: #8b5cf6;
  transition: stroke-dashoffset 1s linear;
}
.time-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.8rem;
  font-weight: 700;
  color: white;
  font-variant-numeric: tabular-nums;
}

.focus-message {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0;
}

.cancel-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  margin-top: 10px;
}

.btn-cancel {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 10px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-cancel:hover {
  background: rgba(239, 68, 68, 0.25);
}

.error-text {
  color: #ef4444;
  font-size: 0.85rem;
  margin: 0;
}
</style>
