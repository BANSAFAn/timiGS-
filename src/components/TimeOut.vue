<template>
  <div class="timeout-widget">
    <!-- Setup State -->
    <div v-if="!status" class="timeout-setup">
      <div class="setup-section">
        <label class="section-label">
          <span class="icon" v-html="Icons.timeoutWork"></span> 
          Work Interval
        </label>
        <div class="time-inputs">
          <div class="input-group">
            <label>Hours</label>
            <input
              type="number"
              v-model.number="workHours"
              min="0"
              max="24"
              placeholder="0"
              class="time-input"
            />
          </div>
          <span class="separator">:</span>
          <div class="input-group">
            <label>Minutes</label>
            <input
              type="number"
              v-model.number="workMinutes"
              min="0"
              max="59"
              placeholder="45"
              class="time-input"
            />
          </div>
          <span class="separator">:</span>
          <div class="input-group">
            <label>Seconds</label>
            <input
              type="number"
              v-model.number="workSeconds"
              min="0"
              max="59"
              placeholder="0"
              class="time-input"
            />
          </div>
        </div>
        <p class="hint">How long to work before a break</p>
      </div>

      <div class="setup-section">
        <label class="section-label">
          <span class="icon" v-html="Icons.timeoutBreak"></span> 
          Break Duration
        </label>
        <div class="time-inputs">
          <div class="input-group">
            <label>Hours</label>
            <input
              type="number"
              v-model.number="breakHours"
              min="0"
              max="24"
              placeholder="0"
              class="time-input"
            />
          </div>
          <span class="separator">:</span>
          <div class="input-group">
            <label>Minutes</label>
            <input
              type="number"
              v-model.number="breakMinutes"
              min="0"
              max="59"
              placeholder="10"
              class="time-input"
            />
          </div>
          <span class="separator">:</span>
          <div class="input-group">
            <label>Seconds</label>
            <input
              type="number"
              v-model.number="breakSeconds"
              min="0"
              max="59"
              placeholder="0"
              class="time-input"
            />
          </div>
        </div>
        <p class="hint">How long each break lasts (all apps blocked)</p>
      </div>

      <div class="setup-section">
        <label class="section-label">
          <span class="icon" v-html="Icons.timeoutMusic"></span> 
          Background Music
        </label>
        
        <div class="music-manager">
          <div class="music-header">
            <button class="btn-icon" @click="openMusicFolder" title="Open Music Folder">
              <span v-html="Icons.timeoutFolder"></span>
            </button>
            <button class="btn-secondary" @click="addMusicFile">
              + Add Track
            </button>
          </div>
          
          <div class="music-list">
            <div v-if="musicFiles.length === 0" class="empty-music">
              No custom music files found.
            </div>
            <div 
              v-else 
              v-for="file in musicFiles" 
              :key="file.filename"
              class="music-item"
              :class="{ 'active-track': selectedMusic === file.filename }"
              @click="selectedMusic = file.filename"
            >
              <div class="radio-circle"></div>
              <span class="track-name">{{ file.filename }}</span>
              <button class="btn-icon-danger" @click.stop="deleteMusicFile(file.filename)" title="Delete Track">
                <span v-html="Icons.timeoutTrash"></span>
              </button>
            </div>
          </div>
          
          <div class="music-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="playMusicDuringBreak" />
              Play music during break
            </label>
          </div>
        </div>
      </div>

      <div class="setup-section">
        <label class="section-label">
          <span class="icon" v-html="Icons.timeoutLock"></span> 
          Lock Password
        </label>
        <input
          type="password"
          v-model="password"
          class="password-input"
          placeholder="Password to cancel..."
        />
      </div>

      <button @click="startTimeout" class="btn-start" :disabled="!canStart">
        <span class="btn-icon" v-html="Icons.timeoutBreak"></span> Activate Time OUT
      </button>
    </div>

    <!-- Active State -->
    <div v-else class="timeout-active">
      <!-- During Break -->
      <div v-if="status.break_active" class="break-overlay">
        <div class="break-emoji" v-html="Icons.timeoutBreak"></div>
        <h3 class="break-title">Time to relax!</h3>
        <p class="break-subtitle">Take a break, drink some tea, stretch!</p>

        <div class="circular-progress break-progress">
          <svg viewBox="0 0 100 100">
            <circle class="bg" cx="50" cy="50" r="45"></circle>
            <circle
              class="fg break-fg"
              cx="50"
              cy="50"
              r="45"
              :stroke-dasharray="283"
              :stroke-dashoffset="breakProgressOffset"
            ></circle>
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
            <span class="schedule-icon" v-html="Icons.timeoutWork"></span>
            <span>Work: {{ status.interval_secs / 60 }}min</span>
          </div>
          <div class="schedule-item">
            <span class="schedule-icon" v-html="Icons.timeoutBreak"></span>
            <span>Break: {{ status.break_duration_secs / 60 }}min</span>
          </div>
        </div>
      </div>

      <!-- Cancel -->
      <div class="cancel-section">
        <input
          type="password"
          v-model="cancelPassword"
          class="password-input small"
          placeholder="Password to cancel..."
        />
        <button @click="stopTimeout" class="btn-cancel">
          <span class="btn-icon" v-html="Icons.timeoutStop"></span> Cancel Time OUT
        </button>
        <p v-if="cancelError" class="error-text">{{ cancelError }}</p>
      </div>
    </div>
  </div>

  <!-- Full-screen break overlay -->
  <Teleport to="body">
    <div
      v-if="status?.break_active"
      class="fullscreen-break-overlay"
      @click.prevent
    >
      <div class="overlay-content">
        <div class="overlay-emoji" v-html="Icons.timeoutBreak"></div>
        <h2>Time to Rest!</h2>
        <p>Take a break, drink some tea, and relax.</p>
        <div class="overlay-timer">{{ breakFormattedTime }}</div>

        <!-- Music Controls -->
        <div class="music-controls" v-if="isPlaying || audio">
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
            placeholder="Enter password to cancel..."
            @keydown.enter="stopTimeoutOverlay"
          />
          <button @click="stopTimeoutOverlay" class="overlay-btn">
            Cancel
          </button>
          <p v-if="overlayCancelError" class="error-text">
            {{ overlayCancelError }}
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { convertFileSrc } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { Icons } from "./icons/IconMap";

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
const password = ref("");
const cancelPassword = ref("");
const overlayCancelPassword = ref("");
const cancelError = ref("");
const overlayCancelError = ref("");
const status = ref<TimeoutStatus | null>(null);
let pollInterval: number | null = null;

// Music Controls
const isPlaying = ref(false);
const audio = ref<HTMLAudioElement | null>(null);
const volume = ref(0.5);
const musicFiles = ref<any[]>([]);
const selectedMusic = ref<string>("");
const playMusicDuringBreak = ref<boolean>(true);

async function loadMusicFiles() {
  try {
    musicFiles.value = await invoke("get_music_files_cmd");
    // Auto-select first if none selected
    if (!selectedMusic.value && musicFiles.value.length > 0) {
      selectedMusic.value = musicFiles.value[0].filename;
    }
  } catch (e) {
    console.error("Failed to load music files", e);
  }
}

async function addMusicFile() {
  try {
    const selected = await openDialog({
      multiple: false,
      filters: [{
        name: 'Audio',
        extensions: ['mp3', 'wav', 'ogg', 'flac']
      }]
    });
    if (selected) {
      await invoke("add_music_file_cmd", { sourcePath: selected });
      await loadMusicFiles();
    }
  } catch (e) {
    alert("Error adding music file: " + e);
  }
}

async function deleteMusicFile(filename: string) {
  try {
    await invoke("delete_music_file_cmd", { filename });
    if (selectedMusic.value === filename) {
      selectedMusic.value = "";
    }
    await loadMusicFiles();
  } catch (e) {
    console.error("Error deleting music:", e);
  }
}

async function openMusicFolder() {
  try {
    await invoke("open_music_folder_cmd");
  } catch (e) {
    console.error("Failed to open music folder:", e);
  }
}

function toggleMusic() {
  if (!audio.value) return;
  if (isPlaying.value) {
    audio.value.pause();
  } else {
    audio.value.play();
  }
  isPlaying.value = !isPlaying.value;
}

function updateVolume() {
  if (audio.value) {
    audio.value.volume = volume.value;
  }
}

const workTotalSecs = computed(
  () =>
    (workHours.value || 0) * 3600 +
    (workMinutes.value || 0) * 60 +
    (workSeconds.value || 0),
);
const breakTotalSecs = computed(
  () =>
    (breakHours.value || 0) * 3600 +
    (breakMinutes.value || 0) * 60 +
    (breakSeconds.value || 0),
);

const canStart = computed(
  () =>
    workTotalSecs.value > 0 &&
    breakTotalSecs.value > 0 &&
    password.value.length >= 1,
);

const workFormattedTime = computed(() => {
  if (!status.value) return "";
  const r = status.value.next_break_in;
  const m = Math.floor(r / 60);
  const s = r % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
});

const breakFormattedTime = computed(() => {
  if (!status.value) return "";
  const r = status.value.break_remaining;
  const m = Math.floor(r / 60);
  const s = r % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
});

const breakProgressOffset = computed(() => {
  if (!status.value || status.value.break_duration_secs === 0) return 283;
  return (
    283 -
    (283 * status.value.break_remaining) / status.value.break_duration_secs
  );
});

async function loadStatus() {
  try {
    const s = await invoke<TimeoutStatus | null>("get_timeout_status_cmd");
    if (s && s.active) {
      status.value = s;
      manageAudio(s.break_active);
      startPolling();
    } else {
      status.value = null;
      manageAudio(false);
    }
  } catch (e) {
    console.error("Failed to get timeout status:", e);
  }
}

function manageAudio(breakActive: boolean) {
  if (breakActive && !audio.value && playMusicDuringBreak.value) {
    // If a custom track is selected, play it, else play builtin
    let src = "/music/123.mp3";
    const selected = musicFiles.value.find(f => f.filename === selectedMusic.value);

    if (selected) {
      // Use the full path for custom tracks
      src = convertFileSrc(selected.path);
    }

    audio.value = new Audio(src);
    audio.value.loop = true;
    audio.value.volume = volume.value;
    audio.value.play().then(() => {
      isPlaying.value = true;
    }).catch(e => {
      console.error("Failed to auto-play audio", e);
      isPlaying.value = false;
    });
  } else if (!breakActive && audio.value) {
    audio.value.pause();
    audio.value = null;
    isPlaying.value = false;
  }
}

async function startTimeout() {
  if (!canStart.value) return;
  try {
    await invoke("start_timeout_cmd", {
      intervalSecs: workTotalSecs.value,
      breakDurationSecs: breakTotalSecs.value,
      password: password.value,
    });
    password.value = "";
    await loadStatus();
  } catch (e: any) {
    alert(e);
  }
}

async function stopTimeout() {
  cancelError.value = "";
  try {
    await invoke("stop_timeout_cmd", { password: cancelPassword.value });
    cancelPassword.value = "";
    status.value = null;
    manageAudio(false);
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  } catch (e: any) {
    cancelError.value = e;
  }
}

async function stopTimeoutOverlay() {
  overlayCancelError.value = "";
  try {
    await invoke("stop_timeout_cmd", { password: overlayCancelPassword.value });
    overlayCancelPassword.value = "";
    status.value = null;
    manageAudio(false);
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
      manageAudio(false);
      if (pollInterval) clearInterval(pollInterval);
    } else {
      status.value = s;
      manageAudio(s.break_active);
    }
  }, 1000);
}

onMounted(async () => {
  loadStatus();
  loadMusicFiles();
  
  // Try to load persisted user preferences
  const savedMusic = localStorage.getItem("timigs-timeout-music");
  if (savedMusic) selectedMusic.value = savedMusic;
  const savedPlayState = localStorage.getItem("timigs-timeout-play");
  if (savedPlayState !== null) playMusicDuringBreak.value = savedPlayState === "true";

  await listen("timeout-break-start", () => {
    loadStatus();
  });
  await listen("timeout-break-end", () => {
    loadStatus();
  });
});

onUnmounted(() => {
  // Save preferences
  localStorage.setItem("timigs-timeout-music", selectedMusic.value);
  localStorage.setItem("timigs-timeout-play", String(playMusicDuringBreak.value));
  
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<style scoped>
.timeout-setup,
.timeout-active {
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

/* Music Manager UI */
.music-manager {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 12px;
}

.music-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}
.btn-icon:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-icon-danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #ef4444;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-icon-danger:hover {
  background: rgba(239, 68, 68, 0.15);
}

.btn-secondary {
  background: rgba(20, 184, 166, 0.15);
  color: #14b8a6;
  border: 1px solid rgba(20, 184, 166, 0.3);
  padding: 6px 14px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-secondary:hover {
  background: rgba(20, 184, 166, 0.25);
}

.music-list {
  max-height: 150px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.music-list::-webkit-scrollbar {
  width: 6px;
}
.music-list::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.1);
  border-radius: 3px;
}
.music-list::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.2);
  border-radius: 3px;
}

.empty-music {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.85rem;
  padding: 16px 0;
  font-style: italic;
}

.music-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}
.music-item:hover {
  background: rgba(255, 255, 255, 0.08);
}
.music-item.active-track {
  background: rgba(20, 184, 166, 0.1);
  border-color: rgba(20, 184, 166, 0.3);
}

.radio-circle {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  position: relative;
  flex-shrink: 0;
}
.active-track .radio-circle {
  border-color: #14b8a6;
}
.active-track .radio-circle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 6px;
  height: 6px;
  background: #14b8a6;
  border-radius: 50%;
}

.track-name {
  flex: 1;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: white;
}
.active-track .track-name {
  color: #14b8a6;
  font-weight: 500;
}

.music-options {
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-muted);
  cursor: pointer;
}
.checkbox-label input {
  accent-color: #14b8a6;
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
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
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
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
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
  display: flex;
  justify-content: center;
  align-items: center;
  width: 64px;
  height: 64px;
  color: #fbbf24;
  animation: bounce 1.5s ease-in-out infinite;
}
.break-emoji :deep(svg) {
  width: 100%;
  height: 100%;
}
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
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
.bg {
  stroke: rgba(255, 255, 255, 0.05);
}
.fg {
  stroke: #14b8a6;
  transition: stroke-dashoffset 1s linear;
}
.break-fg {
  stroke: #fbbf24;
}
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
  width: 100vw;
  height: 100vh;
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

.music-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  background: rgba(255, 255, 255, 0.1);
  padding: 10px 20px;
  border-radius: 30px;
  margin-bottom: 20px;
}

.music-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
}

.music-btn:hover {
  transform: scale(1.1);
}

.volume-slider {
  width: 100px;
  accent-color: #fbbf24;
  cursor: pointer;
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
