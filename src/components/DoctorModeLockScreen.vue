<template>
  <div v-if="doctorModeStore.isLocked" class="lock-screen-overlay">
    <div class="lock-screen-bg">
      <div class="lock-pattern"></div>
    </div>
    
    <div class="lock-screen-content">
      <div class="lock-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          <circle cx="12" cy="16" r="1"></circle>
        </svg>
      </div>
      
      <h1 class="lock-title">Computer Locked</h1>
      <p class="lock-subtitle">For Your Health</p>
      
      <div class="lock-message">
        <p>You've been at your PC for too long without taking breaks.</p>
        <p class="highlight">Please go for a walk, drink some tea, or rest your eyes.</p>
        <p class="highlight">Your health is more important than any task!</p>
      </div>
      
      <div class="lock-timer">
        <div class="timer-circle">
          <svg class="timer-svg" viewBox="0 0 120 120">
            <circle
              class="timer-bg"
              cx="60"
              cy="60"
              r="54"
            ></circle>
            <circle
              class="timer-progress"
              cx="60"
              cy="60"
              r="54"
              :style="{
                strokeDasharray: `${circumference}`,
                strokeDashoffset: `${circumference * (1 - progress)}`
              }"
            ></circle>
          </svg>
          <div class="timer-text">
            <span class="timer-minutes">{{ formatTime(doctorModeStore.lockTimeRemainingSeconds).minutes }}</span>
            <span class="timer-colon">:</span>
            <span class="timer-seconds">{{ formatTime(doctorModeStore.lockTimeRemainingSeconds).seconds }}</span>
          </div>
        </div>
        <p class="timer-label">Time remaining</p>
      </div>
      
      <div class="lock-tips">
        <h3>💡 Healthy Break Ideas:</h3>
        <ul>
          <li>🚶 Take a 10-minute walk outside</li>
          <li>🧘 Do some stretching exercises</li>
          <li>️ Rest your eyes - look at distant objects</li>
          <li>💧 Drink a glass of water or tea</li>
          <li>🌿 Get some fresh air</li>
        </ul>
      </div>
      
      <button 
        v-if="showEmergencyUnlock" 
        class="btn-emergency"
        @click="handleEmergencyUnlock"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        Emergency Unlock
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useDoctorModeStore } from '../stores/doctorMode';

const doctorModeStore = useDoctorModeStore();
const showEmergencyUnlock = ref(false);

const circumference = 2 * Math.PI * 54;

const progress = computed(() => {
  if (!doctorModeStore.lockEndTime) return 0;
  const totalDuration = doctorModeStore.lockDurationMins * 60000;
  const elapsed = Date.now() - (doctorModeStore.lockEndTime - totalDuration);
  return Math.min(1, Math.max(0, elapsed / totalDuration));
});

function formatTime(totalSeconds: number) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return {
    minutes: mins.toString().padStart(2, '0'),
    seconds: secs.toString().padStart(2, '0')
  };
}

function handleEmergencyUnlock() {
  if (confirm('Are you sure you want to unlock? This should only be used in emergencies.')) {
    doctorModeStore.emergencyUnlock();
  }
}

// Update timer every second for smooth animation
let timerInterval: any = null;

onMounted(() => {
  // Update currentTime every second to make the timer reactive
  timerInterval = setInterval(() => {
    doctorModeStore.currentTime = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
});
</script>

<style scoped>
.lock-screen-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.lock-screen-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #0a0b10 0%, #1a1b26 50%, #0a0b10 100%);
  overflow: hidden;
}

.lock-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(91, 110, 225, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 20%, rgba(236, 72, 153, 0.05) 0%, transparent 50%);
  animation: patternMove 20s ease-in-out infinite;
}

@keyframes patternMove {
  0%, 100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(-20px, -20px);
  }
}

.lock-screen-content {
  position: relative;
  z-index: 2;
  max-width: 600px;
  width: 90%;
  padding: 48px;
  background: rgba(26, 27, 38, 0.95);
  border: 1px solid rgba(91, 110, 225, 0.3);
  border-radius: 24px;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 100px rgba(91, 110, 225, 0.2);
  animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.lock-icon {
  margin-bottom: 24px;
  color: var(--color-primary);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

.lock-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-main);
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.lock-subtitle {
  font-size: 1.1rem;
  color: var(--color-primary);
  margin: 0 0 32px 0;
  font-weight: 500;
}

.lock-message {
  margin-bottom: 40px;
  padding: 24px;
  background: rgba(91, 110, 225, 0.1);
  border-radius: 16px;
  border: 1px solid rgba(91, 110, 225, 0.2);
}

.lock-message p {
  margin: 8px 0;
  color: var(--text-main);
  font-size: 1rem;
  line-height: 1.6;
}

.lock-message .highlight {
  color: var(--color-primary);
  font-weight: 600;
}

.lock-timer {
  margin-bottom: 40px;
}

.timer-circle {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 16px;
}

.timer-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.timer-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 8;
}

.timer-progress {
  fill: none;
  stroke: var(--color-primary);
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear;
  filter: drop-shadow(0 0 10px rgba(91, 110, 225, 0.5));
}

.timer-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-family: 'Consolas', monospace;
}

.timer-minutes,
.timer-seconds {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-main);
}

.timer-colon {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.timer-label {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0;
}

.lock-tips {
  text-align: left;
  margin-bottom: 32px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.lock-tips h3 {
  font-size: 1.1rem;
  color: var(--text-main);
  margin: 0 0 16px 0;
  font-weight: 600;
}

.lock-tips ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.lock-tips li {
  padding: 8px 0;
  color: var(--text-muted);
  font-size: 0.95rem;
  line-height: 1.5;
}

.btn-emergency {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-emergency:hover {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .lock-screen-content {
    padding: 32px 24px;
  }

  .lock-title {
    font-size: 2rem;
  }

  .lock-subtitle {
    font-size: 1rem;
  }

  .lock-message {
    padding: 16px;
  }

  .lock-message p {
    font-size: 0.9rem;
  }

  .timer-circle {
    width: 100px;
    height: 100px;
  }

  .timer-minutes,
  .timer-seconds {
    font-size: 1.5rem;
  }

  .timer-colon {
    font-size: 1.5rem;
  }

  .lock-tips {
    padding: 16px;
  }

  .lock-tips h3 {
    font-size: 1rem;
  }

  .lock-tips li {
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .lock-screen-content {
    padding: 24px 16px;
  }

  .lock-title {
    font-size: 1.5rem;
  }

  .lock-subtitle {
    font-size: 0.9rem;
  }

  .lock-icon svg {
    width: 60px;
    height: 60px;
  }

  .timer-circle {
    width: 80px;
    height: 80px;
  }

  .timer-minutes,
  .timer-seconds {
    font-size: 1.2rem;
  }

  .timer-colon {
    font-size: 1.2rem;
  }
}
</style>
