<template>
  <div class="shutdown-timer">
    <h3>{{ t('shutdownTimer.title', 'Shutdown Timer') }}</h3>
    
    <div v-if="timeLeft === null" class="timer-setup">
      <div class="input-group">
        <label for="minutes">{{ t('shutdownTimer.enterMinutes', 'Enter minutes:') }}</label>
        <input 
          id="minutes" 
          type="number" 
          v-model.number="minutesInput" 
          min="1" 
          placeholder="60"
        />
      </div>
      <button @click="startTimer" class="btn-primary">
        {{ t('shutdownTimer.start', 'Start Timer') }}
      </button>
    </div>

    <div v-else class="timer-running">
      <div class="time-display">
        {{ formattedTime }}
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

const minutesInput = ref<number | null>(60);
const timeLeft = ref<number | null>(null);
let intervalId: number | null = null;

const formattedTime = computed(() => {
  if (timeLeft.value === null) return '';
  const hours = Math.floor(timeLeft.value / 3600);
  const minutes = Math.floor((timeLeft.value % 3600) / 60);
  const seconds = timeLeft.value % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

function startTimer() {
  if (minutesInput.value && minutesInput.value > 0) {
    timeLeft.value = minutesInput.value * 60;
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
    // Optional: Send a notification before shutdown
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(t('app.name'), { 
        body: t('shutdownTimer.shutdownNow', 'Time is up! Shutting down PC...') 
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
           new Notification(t('app.name'), { 
            body: t('shutdownTimer.shutdownNow', 'Time is up! Shutting down PC...') 
          });
        }
      });
    }

    // Invoke backend command
    console.log("Shutting down...");
    await invoke('shutdown_pc');
  } catch (error) {
    console.error('Failed to shutdown:', error);
    alert(t('common.error') + ': ' + error);
  }
}

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
</script>

<style scoped>
.shutdown-timer {
  background: var(--surface-card);
  padding: 1.5rem;
  border-radius: 12px;
  margin-top: 1rem;
}

h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.2rem;
  color: var(--text-primary);
}

.input-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

label {
  color: var(--text-secondary);
}

input {
  background: var(--surface-ground);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  padding: 0.5rem;
  border-radius: 6px;
  width: 80px;
}

.timer-running {
  text-align: center;
}

.time-display {
  font-size: 3rem;
  font-weight: bold;
  font-variant-numeric: tabular-nums;
  color: var(--primary-color);
  margin: 1rem 0;
}

.timer-message {
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-danger:hover {
  opacity: 0.9;
}
</style>
