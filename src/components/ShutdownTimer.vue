<template>
  <div class="shutdown-timer">
    <h3>{{ t('shutdownTimer.title', 'Shutdown Timer') }}</h3>
    
    <div v-if="timeLeft === null" class="timer-setup">
      <div class="time-inputs">
        <div class="input-group">
          <label>{{ t('common.hours', 'Hours') }}</label>
          <input type="number" v-model.number="hoursInput" min="0" placeholder="0" class="time-input" />
        </div>
        <span class="separator">:</span>
        <div class="input-group">
          <label>{{ t('common.minutes', 'Minutes') }}</label>
          <input type="number" v-model.number="minutesInput" min="0" max="59" placeholder="0" class="time-input" />
        </div>
        <span class="separator">:</span>
        <div class="input-group">
          <label>{{ t('common.seconds', 'Seconds') }}</label>
          <input type="number" v-model.number="secondsInput" min="0" max="59" placeholder="0" class="time-input" />
        </div>
      </div>
      
      <button @click="startTimer" class="btn-primary full-width">
        {{ t('shutdownTimer.start', 'Start Timer') }}
      </button>
    </div>

    <div v-else class="timer-running">
      <div class="circular-progress">
        <svg viewBox="0 0 100 100">
          <circle class="bg" cx="50" cy="50" r="45"></circle>
          <circle class="fg" cx="50" cy="50" r="45" :stroke-dasharray="283" :stroke-dashoffset="progressOffset"></circle>
        </svg>
        <div class="time-display">{{ formattedTime }}</div>
      </div>
      <p class="timer-message">
        {{ t('shutdownTimer.pcWillShutdown', 'PC will shutdown when timer ends.') }}
      </p>
      <button @click="cancelTimer" class="btn-danger">
        {{ t('shutdownTimer.cancel', 'Cancel Timer') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { invoke } from '@tauri-apps/api/core';

const { t } = useI18n();

const hoursInput = ref<number | null>(0);
const minutesInput = ref<number | null>(60);
const secondsInput = ref<number | null>(0);

const timeLeft = ref<number | null>(null);
const totalDuration = ref<number>(0);
let intervalId: number | null = null;

const formattedTime = computed(() => {
  if (timeLeft.value === null) return '';
  const hours = Math.floor(timeLeft.value / 3600);
  const minutes = Math.floor((timeLeft.value % 3600) / 60);
  const seconds = timeLeft.value % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

const progressOffset = computed(() => {
  if (timeLeft.value === null || totalDuration.value === 0) return 0;
  return 283 - (283 * timeLeft.value) / totalDuration.value;
});

function startTimer() {
  const h = hoursInput.value || 0;
  const m = minutesInput.value || 0;
  const s = secondsInput.value || 0;
  const total = h * 3600 + m * 60 + s;

  if (total > 0) {
    totalDuration.value = total;
    timeLeft.value = total;
    intervalId = window.setInterval(tick, 1000);
  }
}

function cancelTimer() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  timeLeft.value = null;
}

async function tick() {
  if (timeLeft.value !== null) {
    timeLeft.value--;
    
    if (timeLeft.value <= 0) {
      cancelTimer();
      await triggerShutdown();
    }
  }
}

async function triggerShutdown() {
  try {
    if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
           new Notification(t('app.name'), { 
            body: t('shutdownTimer.shutdownNow', 'Time is up! Shutting down PC...') 
          });
        }
      });
    }
    await invoke('shutdown_pc');
  } catch (error) {
    console.error('Failed to shutdown:', error);
    alert(t('common.error') + ': ' + error);
  }
}

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>

<style scoped>
.shutdown-timer {
  background: var(--bg-secondary);
  padding: 1.5rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
}

h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-inputs {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.input-group label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.time-input {
  width: 100%;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 12px;
  border-radius: var(--radius-md);
  text-align: center;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.time-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.separator {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-muted);
  padding-bottom: 15px;
}

.full-width {
  width: 100%;
  padding: 12px;
  font-size: 1rem;
}

.timer-running {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.circular-progress {
  position: relative;
  width: 150px;
  height: 150px;
  margin: 10px 0 20px;
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

.bg { stroke: var(--bg-tertiary); }
.fg { 
  stroke: var(--primary); 
  transition: stroke-dashoffset 1s linear;
}

.time-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.timer-message {
  color: var(--text-muted);
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.btn-primary {
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.2s;
}
.btn-primary:hover { opacity: 0.9; }

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.2s;
}
.btn-danger:hover { opacity: 0.9; }
</style>
