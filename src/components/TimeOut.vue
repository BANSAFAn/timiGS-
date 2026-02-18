<template>
  <div class="timeout-widget">
    <!-- Setup State -->
    <div v-if="!status" class="timeout-setup">
      <div class="setup-section">
        <label class="section-label">💼 Work Interval</label>
        <div class="time-inputs">
          <div class="input-group">
            <label>Hours</label>
            <input type="number" v-model.number="workHours" min="0" max="24" placeholder="0" class="time-input" />
          </div>
          <span class="separator">:</span>
          <div class="input-group">
            <label>Minutes</label>
            <input type="number" v-model.number="workMinutes" min="0" max="59" placeholder="45" class="time-input" />
          </div>
          <span class="separator">:</span>
          <div class="input-group">
            <label>Seconds</label>
            <input type="number" v-model.number="workSeconds" min="0" max="59" placeholder="0" class="time-input" />
          </div>
        </div>
        <p class="hint">How long to work before a break</p>
      </div>

      <div class="setup-section">
        <label class="section-label">☕ Break Duration</label>
        <div class="time-inputs">
          <div class="input-group">
            <label>Hours</label>
            <input type="number" v-model.number="breakHours" min="0" max="24" placeholder="0" class="time-input" />
          </div>
          <span class="separator">:</span>
          <div class="input-group">
            <label>Minutes</label>
            <input type="number" v-model.number="breakMinutes" min="0" max="59" placeholder="10" class="time-input" />
          </div>
          <span class="separator">:</span>
          <div class="input-group">
            <label>Seconds</label>
            <input type="number" v-model.number="breakSeconds" min="0" max="59" placeholder="0" class="time-input" />
          </div>
        </div>
        <p class="hint">How long each break lasts (all apps blocked)</p>
      </div>

      <div class="setup-section">
        <label class="section-label">🎵 Background Music</label>
        <div class="folder-selection">
          <div class="folder-display">
            <span class="folder-path">Using built-in music folder (public/music)</span>
          </div>
        </div>
        <p class="hint">Place MP3/WAV files in the 'public/music' folder to play them.</p>
      </div>

      <div class="setup-section">
        <label class="section-label">🔒 Lock Password</label>
        <input type="password" v-model="password" class="password-input" placeholder="Password to cancel..." />
      </div>

      <button @click="startTimeout" class="btn-start" :disabled="!canStart">
        ☕ Activate Time OUT
      </button>
    </div>

    <!-- Active State -->
    <div v-else class="timeout-active">
      <!-- During Break -->
      <div v-if="status.break_active" class="break-overlay">
        <div class="break-emoji">☕</div>
        <h3 class="break-title">Time to relax!</h3>
        <p class="break-subtitle">Take a break, drink some tea, stretch!</p>

        <div class="circular-progress break-progress">
          <svg viewBox="0 0 100 100">
            <circle class="bg" cx="50" cy="50" r="45"></circle>
            <circle class="fg break-fg" cx="50" cy="50" r="45" :stroke-dasharray="283" :stroke-dashoffset="breakProgressOffset"></circle>
          </svg>
          <div class="time-display">{{ breakFormattedTime }}</div>
        </div>

        <p class="break-note">All applications are blocked during break</p>
      </div>

      <!-- Working Period -->
      <div v-else class="working-state">
        <div class="status-badge working">
          <span class="status-dot"></span>
          Working
        </div>

        <div class="next-break-info">
          <span class="next-label">Next break in</span>
          <span class="next-time">{{ workFormattedTime }}</span>
        </div>

        <div class="schedule-info">
          <div class="schedule-item">
            <span class="schedule-icon">💼</span>
            <span>Work: {{ status.interval_secs / 60 }}min</span>
          </div>
          <div class="schedule-item">
            <span class="schedule-icon">☕</span>
            <span>Break: {{ status.break_duration_secs / 60 }}min</span>
          </div>
        </div>
      </div>

      <!-- Cancel -->
      <div class="cancel-section">
        <input type="password" v-model="cancelPassword" class="password-input small" placeholder="Password to cancel..." />
        <button @click="stopTimeout" class="btn-cancel">
          ✋ Cancel Time OUT
        </button>
        <p v-if="cancelError" class="error-text">{{ cancelError }}</p>
      </div>
    </div>
  </div>

  <!-- Full-screen break overlay -->
  <Teleport to="body">
    <div v-if="status?.break_active" class="fullscreen-break-overlay" @click.prevent>
      <div class="overlay-content">
        <div class="overlay-emoji">☕</div>
        <h2>Time to Rest!</h2>
        <p>Take a break, drink some tea, and relax.</p>
        <div class="overlay-timer">{{ breakFormattedTime }}</div>
        <div class="overlay-cancel">
          <input type="password" v-model="overlayCancelPassword" class="overlay-input" placeholder="Enter password to cancel..." @keydown.enter="stopTimeoutOverlay" />
          <button @click="stopTimeoutOverlay" class="overlay-btn">Cancel</button>
          <p v-if="overlayCancelError" class="error-text">{{ overlayCancelError }}</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';


useI18n();

interface TimeoutStatus {
  active: boolean;
  break_active: boolean;
  interval_secs: number;
  break_duration_secs: number;
  next_break_in: number;
  break_remaining: number;
}

const workHours = ref<number>(0);
const workMinutes = ref<number>(45);
const workSeconds = ref<number>(0);
const breakHours = ref<number>(0);
const breakMinutes = ref<number>(10);
const breakSeconds = ref<number>(0);
const password = ref('');
const cancelPassword = ref('');
const overlayCancelPassword = ref('');
const cancelError = ref('');
const overlayCancelError = ref('');
const status = ref<TimeoutStatus | null>(null);
let pollInterval: number | null = null;



const workTotalSecs = computed(() => (workHours.value || 0) * 3600 + (workMinutes.value || 0) * 60 + (workSeconds.value || 0));
const breakTotalSecs = computed(() => (breakHours.value || 0) * 3600 + (breakMinutes.value || 0) * 60 + (breakSeconds.value || 0));

const canStart = computed(() => workTotalSecs.value > 0 && breakTotalSecs.value > 0 && password.value.length >= 1);

const workFormattedTime = computed(() => {
  if (!status.value) return '';
  const r = status.value.next_break_in;
  const m = Math.floor(r / 60);
  const s = r % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

const breakFormattedTime = computed(() => {
  if (!status.value) return '';
  const r = status.value.break_remaining;
  const m = Math.floor(r / 60);
  const s = r % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

const breakProgressOffset = computed(() => {
  if (!status.value || status.value.break_duration_secs === 0) return 283;
  return 283 - (283 * status.value.break_remaining) / status.value.break_duration_secs;
});

async function loadStatus() {
  try {
    const s = await invoke<TimeoutStatus | null>('get_timeout_status_cmd');
    if (s && s.active) {
      status.value = s;
      startPolling();
    } else {
      status.value = null;
    }
  } catch (e) {
    console.error('Failed to get timeout status:', e);
  }
}

async function startTimeout() {
  if (!canStart.value) return;
  try {
    await invoke('start_timeout_cmd', {
      intervalSecs: workTotalSecs.value,
      breakDurationSecs: breakTotalSecs.value,
      password: password.value,
    });
    password.value = '';
    await loadStatus();
  } catch (e: any) {
    alert(e);
  }
}

async function stopTimeout() {
  cancelError.value = '';
  try {
    await invoke('stop_timeout_cmd', { password: cancelPassword.value });
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

async function stopTimeoutOverlay() {
  overlayCancelError.value = '';
  try {
    await invoke('stop_timeout_cmd', { password: overlayCancelPassword.value });
    overlayCancelPassword.value = '';
    status.value = null;
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  } catch (e: any) {
    overlayCancelError.value = e;
  }
}

function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = window.setInterval(async () => {
    const s = await invoke<TimeoutStatus | null>('get_timeout_status_cmd');
    if (!s || !s.active) {
      status.value = null;
      if (pollInterval) clearInterval(pollInterval);
    } else {
      status.value = s;
    }
  }, 1000);
}

onMounted(async () => {
  loadStatus();
  await listen('timeout-break-start', () => {
    loadStatus();
  });
  await listen('timeout-break-end', () => {
    loadStatus();
  });
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<style scoped>
.timeout-setup, .timeout-active {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.setup-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
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
.separator {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-muted);
  padding-bottom: 12px;
}

.time-input {
  flex: 1;
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
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.2);
}

.unit {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 500;
  min-width: 32px;
}

.hint {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0;
}

/* Music Folder Styles */
.folder-selection {
  display: flex;
  gap: 10px;
  align-items: center;
}

.folder-display {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px 12px;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.folder-path {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.9rem;
  color: #10b981;
}

.folder-placeholder {
  color: rgba(255, 255, 255, 0.3);
  font-size: 0.9rem;
  font-style: italic;
}

.btn-browse {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.btn-browse:hover {
  background: rgba(255, 255, 255, 0.2);
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
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.2);
}
.password-input.small {
  padding: 10px 12px;
  font-size: 0.9rem;
}

.btn-start {
  background: linear-gradient(135deg, #14b8a6, #0d9488);
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
  box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
}
.btn-start:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Active States */
.working-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}
.status-badge.working {
  background: rgba(20, 184, 166, 0.15);
  color: #14b8a6;
  border: 1px solid rgba(20, 184, 166, 0.3);
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #14b8a6;
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.next-break-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.next-label {
  font-size: 0.85rem;
  color: var(--text-muted);
}
.next-time {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  font-variant-numeric: tabular-nums;
}

.schedule-info {
  display: flex;
  gap: 20px;
}
.schedule-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-muted);
}
.schedule-icon {
  font-size: 1rem;
}

/* Break Overlay in card */
.break-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
}
.break-emoji {
  font-size: 3rem;
  animation: bounce 1.5s ease-in-out infinite;
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
.break-title {
  margin: 0;
  color: #fbbf24;
  font-size: 1.3rem;
}
.break-subtitle {
  color: var(--text-muted);
  margin: 0;
  font-size: 0.9rem;
}

.circular-progress {
  position: relative;
  width: 140px;
  height: 140px;
  margin: 6px 0;
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
.fg { stroke: #14b8a6; transition: stroke-dashoffset 1s linear; }
.break-fg { stroke: #fbbf24; }
.time-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.6rem;
  font-weight: 700;
  color: white;
  font-variant-numeric: tabular-nums;
}

.break-note {
  color: var(--text-muted);
  font-size: 0.8rem;
  margin: 0;
}

/* Cancel */
.cancel-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-top: 8px;
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

/* Fullscreen Break Overlay */
.fullscreen-break-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(30px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}
.overlay-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.overlay-emoji {
  font-size: 6rem;
  animation: bounce 1.5s ease-in-out infinite;
}
.overlay-content h2 {
  font-size: 2.5rem;
  color: #fbbf24;
  margin: 0;
}
.overlay-content p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.2rem;
  margin: 0;
}
.overlay-timer {
  font-size: 4rem;
  font-weight: 700;
  color: white;
  font-variant-numeric: tabular-nums;
  margin: 20px 0;
}
.overlay-cancel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
}
.overlay-input {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 1rem;
  width: 280px;
  text-align: center;
}
.overlay-input:focus {
  outline: none;
  border-color: #fbbf24;
}
.overlay-btn {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.4);
  padding: 10px 30px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.overlay-btn:hover {
  background: rgba(239, 68, 68, 0.3);
}
</style>
