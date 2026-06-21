<template>
  <div
    v-if="status?.break_active"
    class="fullscreen-break-overlay"
    @click.prevent
  >
    <div class="overlay-content">
      <div class="overlay-emoji" v-html="Icons.timeoutBreak"></div>
      <h2>{{ t('timeout.timeToRest', 'Time to Rest!') }}</h2>
      <p>{{ t('timeout.takeBreakRelax', 'Take a break, drink some tea, and relax.') }}</p>
      <div v-if="bypassMessage" class="bypass-warning-banner">
        {{ bypassMessage }}
      </div>
      <div class="overlay-timer">{{ breakFormattedTime }}</div>

      
      <div class="music-controls" v-if="hasMusicAvailable">
        <button class="music-btn" @click="toggleMusic" title="Play/Pause">
          <span v-if="isPlaying" v-html="Icons.timeoutPause"></span>
          <span v-else v-html="Icons.timeoutPlay"></span>
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          v-model.number="volume"
          @input="updateVolume"
          class="volume-slider"
        />
      </div>

      <div class="overlay-cancel">
        <input
          type="password"
          v-model="overlayCancelPassword"
          class="overlay-input"
          :placeholder="t('timeout.passwordPlaceholder', 'Enter password...')"
          @keydown.enter="stopTimeoutOverlay"
        />
        <button @click="stopTimeoutOverlay" class="overlay-btn">
          {{ t('common.cancel', 'Cancel') }}
        </button>
        <p v-if="overlayCancelError" class="error-text">
          {{ overlayCancelError }}
        </p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useI18n } from "vue-i18n";
import { Icons } from "./icons/IconMap";

const { t } = useI18n();


interface TimeoutStatus {
  active: boolean;
  break_active: boolean;
  interval_secs: number;
  break_duration_secs: number;
  next_break_in: number;
  break_remaining: number;
}

const status = ref<TimeoutStatus | null>(null);
const overlayCancelPassword = ref("");
const overlayCancelError = ref("");
let pollInterval: number | null = null;


const isPlaying = ref(false);
const bypassMessage = ref("");
const volume = ref(0.5);
const musicFiles = ref<any[]>([]);
const selectedMusic = ref<string>("");
const playMusicDuringBreak = ref<boolean>(true);

const hasMusicAvailable = computed(() => {
  return playMusicDuringBreak.value && selectedMusic.value && musicFiles.value.some(f => f.filename === selectedMusic.value);
});

const breakFormattedTime = computed(() => {
  if (!status.value) return "00:00";
  const r = status.value.break_remaining;
  const m = Math.floor(r / 60);
  const s = r % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
});

async function loadMusicFiles() {
  try {
    musicFiles.value = await invoke("get_music_files_cmd");
  } catch (e) {
    console.error("Global overlay: Failed to load music files", e);
  }
}

async function loadStatus() {
  try {
    const s = await invoke<TimeoutStatus | null>("get_timeout_status_cmd");
    if (s && s.active) {
      const wasBreakActive = status.value?.break_active || false;
      status.value = s;
      if (s.break_active !== wasBreakActive) {
        manageAudio(s.break_active);
      }
      startPolling();
    } else {
      status.value = null;
      manageAudio(false);
    }
  } catch (e) {
    console.error("Global overlay: Failed to get timeout status:", e);
  }
}

async function manageAudio(breakActive: boolean) {
  const savedPlayState = localStorage.getItem("timigs-timeout-play");
  if (savedPlayState !== null) playMusicDuringBreak.value = savedPlayState === "true";
  const savedMusic = localStorage.getItem("timigs-timeout-music");
  if (savedMusic) selectedMusic.value = savedMusic;

  if (breakActive && playMusicDuringBreak.value) {
    await loadMusicFiles();
    const selected = musicFiles.value.find(f => f.filename === selectedMusic.value);

    if (selected) {
      try {
        await invoke("play_music_cmd", { filename: selected.path });
        await invoke("set_music_volume_cmd", { volume: volume.value });
        isPlaying.value = true;
      } catch (e) {
        console.error("Global overlay: Failed to play selected audio:", e);
        isPlaying.value = false;
      }
    }
  } else {
    try {
      await invoke("stop_music_cmd");
    } catch (e) {}
    isPlaying.value = false;
  }
}

async function toggleMusic() {
  try {
    if (isPlaying.value) {
      await invoke("pause_music_cmd");
    } else {
      await invoke("resume_music_cmd");
    }
    isPlaying.value = !isPlaying.value;
  } catch (e) {
    console.error("Error toggling music playback:", e);
  }
}

async function updateVolume() {
  try {
    await invoke("set_music_volume_cmd", { volume: volume.value });
  } catch (e) {
    console.error("Error updating music volume:", e);
  }
}

async function stopTimeoutOverlay() {
  overlayCancelError.value = "";
  try {
    await invoke("stop_timeout_cmd", { password: overlayCancelPassword.value });
    overlayCancelPassword.value = "";
    status.value = null;
    await manageAudio(false);
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
    const s = await invoke<TimeoutStatus | null>("get_timeout_status_cmd");
    if (!s || !s.active) {
      status.value = null;
      await manageAudio(false);
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    } else {
      const wasBreakActive = status.value?.break_active || false;
      status.value = s;
      if (s.break_active !== wasBreakActive) {
        await manageAudio(s.break_active);
      }
    }
  }, 1000);
}

onMounted(async () => {
  await loadStatus();

  const savedMusic = localStorage.getItem("timigs-timeout-music");
  if (savedMusic) selectedMusic.value = savedMusic;
  const savedPlayState = localStorage.getItem("timigs-timeout-play");
  if (savedPlayState !== null) playMusicDuringBreak.value = savedPlayState === "true";

  await listen("timeout-break-start", () => {
    loadStatus();
  });
  await listen("timeout-break-end", async () => {
    await manageAudio(false);
    loadStatus();
  });
  await listen("timeout-schedule-triggered", () => {
    loadStatus();
  });
  await listen("timeout-bypass-attempt", () => {
    const title = t("timeout.bypassTitle", "PLEASE TAKE A BREAK! ☕");
    const body = t("timeout.bypassBody", "GO DRINK TEA, RELAX, YOU HAVE TIME, RELAX PLEASE !!!!!!!! ");
    bypassMessage.value = body;
    setTimeout(() => {
      bypassMessage.value = "";
    }, 6000);
    invoke("send_notification_cmd", { title, body }).catch(() => {});
  });
});

onUnmounted(async () => {
  await manageAudio(false);
  if (pollInterval) {
    clearInterval(pollInterval);
  }
});
</script>

<style scoped>

.fullscreen-break-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(12, 15, 29, 0.98);
  backdrop-filter: blur(40px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999999;
}
.overlay-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  animation: fadeIn 0.5s ease-out;
}
.overlay-emoji {
  font-size: 7rem;
  animation: bounce 2s ease-in-out infinite;
}
.overlay-content h2 {
  font-size: 3rem;
  color: #fbbf24;
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.5px;
}
.overlay-content p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.3rem;
  margin: 0;
}
.overlay-timer {
  font-size: 5rem;
  font-weight: 800;
  color: white;
  font-variant-numeric: tabular-nums;
  margin: 25px 0;
  text-shadow: 0 4px 20px rgba(255, 255, 255, 0.15);
}

.music-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  background: rgba(255, 255, 255, 0.08);
  padding: 12px 24px;
  border-radius: 30px;
  margin-bottom: 25px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.music-btn {
  background: none;
  border: none;
  font-size: 1.6rem;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  transition: transform 0.2s;
}

.music-btn:hover {
  transform: scale(1.15);
}

.volume-slider {
  width: 110px;
  accent-color: #fbbf24;
  cursor: pointer;
}
.overlay-cancel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 25px;
}
.overlay-input {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: white;
  padding: 14px 24px;
  border-radius: 14px;
  font-size: 1.1rem;
  width: 320px;
  text-align: center;
  transition: all 0.3s;
}
.overlay-input:focus {
  outline: none;
  border-color: #fbbf24;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 15px rgba(251, 191, 36, 0.2);
}
.overlay-btn {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.35);
  padding: 12px 36px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}
.overlay-btn:hover {
  background: rgba(239, 68, 68, 0.25);
  transform: translateY(-1px);
}
.error-text {
  color: #ef4444;
  font-size: 0.9rem;
  margin-top: 5px;
  font-weight: 500;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15px);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.bypass-warning-banner {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 800;
  font-size: 1.05rem;
  margin-top: 10px;
  margin-bottom: 5px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  animation: flash 1s infinite alternate;
  text-align: center;
  max-width: 90%;
}

@keyframes flash {
  from { box-shadow: 0 0 10px rgba(239, 68, 68, 0.2); }
  to { box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); }
}
</style>
