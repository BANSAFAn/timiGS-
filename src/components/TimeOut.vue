<template>
  <div class="timeout-widget">
    <!-- Setup State -->
    <div v-if="!status" class="timeout-setup">
      <!-- Work Interval Card -->
      <div class="settings-card work-card">
        <div class="card-header">
          <div class="card-icon work-icon" v-html="Icons.timeoutWork"></div>
          <div class="card-title-group">
            <h3 class="card-title">{{ t('timeout.workInterval', 'Work Interval') }}</h3>
            <p class="card-desc">{{ t('timeout.workIntervalDesc', 'How long to work before a break') }}</p>
          </div>
        </div>
        <div class="time-inputs-modern">
          <div class="time-field">
            <input
              type="number"
              v-model.number="workHours"
              min="0"
              max="24"
              placeholder="0"
              class="time-input-modern"
              id="work-hours"
            />
            <label for="work-hours" class="time-label">{{ t('common.hours', 'Hours') }}</label>
          </div>
          <div class="time-field">
            <input
              type="number"
              v-model.number="workMinutes"
              min="0"
              max="59"
              placeholder="45"
              class="time-input-modern"
              id="work-minutes"
            />
            <label for="work-minutes" class="time-label">{{ t('common.minutes', 'Minutes') }}</label>
          </div>
          <div class="time-field">
            <input
              type="number"
              v-model.number="workSeconds"
              min="0"
              max="59"
              placeholder="0"
              class="time-input-modern"
              id="work-seconds"
            />
            <label for="work-seconds" class="time-label">{{ t('common.seconds', 'Seconds') }}</label>
          </div>
        </div>
      </div>

      <!-- Break Duration Card -->
      <div class="settings-card break-card">
        <div class="card-header">
          <div class="card-icon break-icon" v-html="Icons.timeoutBreak"></div>
          <div class="card-title-group">
            <h3 class="card-title">{{ t('timeout.breakDuration', 'Break Duration') }}</h3>
            <p class="card-desc">{{ t('timeout.breakDurationDesc', 'How long each break lasts') }}</p>
          </div>
        </div>
        <div class="time-inputs-modern">
          <div class="time-field">
            <input
              type="number"
              v-model.number="breakHours"
              min="0"
              max="24"
              placeholder="0"
              class="time-input-modern"
              id="break-hours"
            />
            <label for="break-hours" class="time-label">{{ t('common.hours', 'Hours') }}</label>
          </div>
          <div class="time-field">
            <input
              type="number"
              v-model.number="breakMinutes"
              min="0"
              max="59"
              placeholder="10"
              class="time-input-modern"
              id="break-minutes"
            />
            <label for="break-minutes" class="time-label">{{ t('common.minutes', 'Minutes') }}</label>
          </div>
          <div class="time-field">
            <input
              type="number"
              v-model.number="breakSeconds"
              min="0"
              max="59"
              placeholder="0"
              class="time-input-modern"
              id="break-seconds"
            />
            <label for="break-seconds" class="time-label">{{ t('common.seconds', 'Seconds') }}</label>
          </div>
        </div>
      </div>

      <!-- Music Card -->
      <div class="settings-card music-card">
        <div class="card-header">
          <div class="card-icon music-icon" v-html="Icons.timeoutMusic"></div>
          <div class="card-title-group">
            <h3 class="card-title">{{ t('timeout.backgroundMusic', 'Background Music') }}</h3>
            <p class="card-desc">{{ t('timeout.musicDesc', 'Optional music during breaks') }}</p>
          </div>
        </div>
        
        <div class="music-manager-modern">
          <div class="music-actions">
            <button class="btn-action" @click="openMusicFolder" title="Open Music Folder">
              <span v-html="Icons.timeoutFolder"></span>
              <span>{{ t('timeout.openFolder', 'Open Folder') }}</span>
            </button>
            <button class="btn-action primary" @click="addMusicFile">
              <span v-html="Icons.tasksAdd"></span>
              <span>{{ t('timeout.addTrack', 'Add Track') }}</span>
            </button>
          </div>

          <div class="music-list-modern">
            <div v-if="musicFiles.length === 0" class="empty-music-modern">
              <span class="empty-icon">🎵</span>
              <p>{{ t('timeout.noMusic', 'No music files found') }}</p>
            </div>
            <div
              v-else
              v-for="file in musicFiles"
              :key="file.filename"
              class="music-item-modern"
              :class="{ 'active-track': selectedMusic === file.filename }"
              @click="selectedMusic = file.filename"
            >
              <div class="music-item-left">
                <div class="radio-indicator">
                  <div class="radio-dot" :class="{ selected: selectedMusic === file.filename }"></div>
                </div>
                <span class="track-name">{{ file.filename }}</span>
              </div>
              <button class="btn-delete-track" @click.stop="deleteMusicFile(file.filename)" title="Delete Track">
                <span v-html="Icons.timeoutTrash"></span>
              </button>
            </div>
          </div>

          <div class="music-option">
            <label class="checkbox-label-modern">
              <input type="checkbox" v-model="playMusicDuringBreak" />
              <span class="checkbox-custom"></span>
              <span class="checkbox-text">{{ t('timeout.playMusicBreak', 'Play music during break') }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Password Card -->
      <div class="settings-card password-card">
        <div class="card-header">
          <div class="card-icon password-icon" v-html="Icons.timeoutLock"></div>
          <div class="card-title-group">
            <h3 class="card-title">{{ t('timeout.password', 'Lock Password') }}</h3>
            <p class="card-desc">{{ t('timeout.passwordDesc', 'Required to cancel early') }}</p>
          </div>
        </div>
        <div class="password-input-wrapper">
          <input
            type="password"
            v-model="password"
            class="password-input-modern"
            :placeholder="t('timeout.passwordPlaceholder', 'Enter password...')"
          />
        </div>
      </div>



      <!-- Start Button -->
      <button @click="startTimeout" class="btn-start-modern" :disabled="!canStart">
        <span class="btn-icon" v-html="Icons.timeoutBreak"></span>
        <span>{{ enableSchedule ? t('timeout.schedule', 'Schedule Time OUT') : t('timeout.start', 'Activate Time OUT') }}</span>
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
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
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

// Schedule
const enableSchedule = ref(false);
// Time range
const scheduleStartHour = ref<number>(9);
const scheduleStartMinute = ref<number>(0);
const scheduleStartPeriod = ref<"AM" | "PM">("AM");
const scheduleEndHour = ref<number>(5);
const scheduleEndMinute = ref<number>(0);
const scheduleEndPeriod = ref<"AM" | "PM">("PM");
// Custom breaks
interface CustomBreak {
  id: number;
  hour: number;
  minute: number;
  period: "AM" | "PM";
  duration: number;
}
const customBreaks = ref<CustomBreak[]>([]);
// Days
const selectedDays = ref<number[]>([]); // 0 = Sunday, 1 = Monday, etc.

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

// function toggleDay...
// function addBreak...
// function removeBreak...

function convertTo24Hour(hour: number, period: string): number {
  if (period === "PM" && hour !== 12) {
    return hour + 12;
  } else if (period === "AM" && hour === 12) {
    return 0;
  }
  return hour;
}

function getScheduleConfig(): { 
  startHour: number; 
  startMinute: number; 
  endHour: number; 
  endMinute: number; 
  breaks: Array<{ hour: number; minute: number; duration: number }>;
} | null {
  if (!enableSchedule.value) return null;
  
  return {
    startHour: convertTo24Hour(scheduleStartHour.value, scheduleStartPeriod.value),
    startMinute: scheduleStartMinute.value,
    endHour: convertTo24Hour(scheduleEndHour.value, scheduleEndPeriod.value),
    endMinute: scheduleEndMinute.value,
    breaks: customBreaks.value.map(b => ({
      hour: convertTo24Hour(b.hour, b.period),
      minute: b.minute,
      duration: b.duration,
    })),
  };
}

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

async function manageAudio(breakActive: boolean) {
  if (breakActive && !audio.value && playMusicDuringBreak.value) {
    // If a custom track is selected, play it, else play builtin
    let src = "/music/123.mp3";
    const selected = musicFiles.value.find(f => f.filename === selectedMusic.value);

    if (selected) {
      try {
        // Read file using Tauri FS API and create blob URL
        const fileData = await readFile(selected.path);
        const blob = new Blob([fileData], { type: 'audio/mpeg' });
        const blobUrl = URL.createObjectURL(blob);
        
        audio.value = new Audio(blobUrl);
        audio.value.loop = true;
        audio.value.volume = volume.value;
        await audio.value.play();
        isPlaying.value = true;
        return;
      } catch (e) {
        console.error("Failed to play audio via blob:", e);
        // Fallback: try direct path
        try {
          audio.value = new Audio(selected.path);
          audio.value.loop = true;
          audio.value.volume = volume.value;
          await audio.value.play();
          isPlaying.value = true;
          return;
        } catch (e2) {
          console.error("Fallback also failed:", e2);
          isPlaying.value = false;
          return;
        }
      }
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
    const scheduleConfig = getScheduleConfig();

    // If schedule is enabled, just save settings and don't start immediately
    if (enableSchedule.value) {
      await invoke("save_timeout_schedule_cmd", {
        intervalSecs: workTotalSecs.value,
        breakDurationSecs: breakTotalSecs.value,
        password: password.value,
        scheduleStartHour: scheduleConfig?.startHour ?? null,
        scheduleStartMinute: scheduleConfig?.startMinute ?? null,
        scheduleEndHour: scheduleConfig?.endHour ?? null,
        scheduleEndMinute: scheduleConfig?.endMinute ?? null,
        customBreaks: scheduleConfig?.breaks ?? [],
        selectedDays: selectedDays.value,
      });

      // Save schedule preferences
      localStorage.setItem("timigs-timeout-schedule", JSON.stringify({
        enabled: true,
        startHour: scheduleStartHour.value,
        startMinute: scheduleStartMinute.value,
        startPeriod: scheduleStartPeriod.value,
        endHour: scheduleEndHour.value,
        endMinute: scheduleEndMinute.value,
        endPeriod: scheduleEndPeriod.value,
        customBreaks: customBreaks.value,
        days: selectedDays.value,
      }));

      password.value = "";
      alert("Schedule saved! Time OUT will start automatically at the specified times on selected days.");
    } else {
      // No schedule - start immediately
      await invoke("start_timeout_cmd", {
        intervalSecs: workTotalSecs.value,
        breakDurationSecs: breakTotalSecs.value,
        password: password.value,
        enableSchedule: false,
        scheduleStartHour: null,
        scheduleStartMinute: null,
        scheduleEndHour: null,
        scheduleEndMinute: null,
        customBreaks: [],
        selectedDays: [],
      });
      
      localStorage.removeItem("timigs-timeout-schedule");
      password.value = "";
      await loadStatus();
    }
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
  
  // Load saved schedule
  const savedSchedule = localStorage.getItem("timigs-timeout-schedule");
  if (savedSchedule) {
    try {
      const parsed = JSON.parse(savedSchedule);
      if (parsed.enabled) {
        enableSchedule.value = true;
        scheduleStartHour.value = parsed.startHour || 9;
        scheduleStartMinute.value = parsed.startMinute || 0;
        scheduleStartPeriod.value = parsed.startPeriod || "AM";
        scheduleEndHour.value = parsed.endHour || 5;
        scheduleEndMinute.value = parsed.endMinute || 0;
        scheduleEndPeriod.value = parsed.endPeriod || "PM";
        customBreaks.value = parsed.customBreaks || [];
        selectedDays.value = parsed.days || [];
      }
    } catch (e) {
      console.error("Failed to parse saved schedule:", e);
    }
  }

  await listen("timeout-break-start", () => {
    loadStatus();
  });
  await listen("timeout-break-end", async () => {
    // Stop music immediately when break ends
    if (audio.value) {
      audio.value.pause();
      audio.value = null;
      isPlaying.value = false;
    }
    loadStatus();
  });
  await listen("timeout-schedule-triggered", () => {
    loadStatus();
  });
});

onUnmounted(() => {
  // Save preferences
  localStorage.setItem("timigs-timeout-music", selectedMusic.value);
  localStorage.setItem("timigs-timeout-play", String(playMusicDuringBreak.value));

  // Stop music if component is unmounted
  if (audio.value) {
    audio.value.pause();
    audio.value = null;
    isPlaying.value = false;
  }

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

/* Strict Mode Styles */
.strict-mode-label {
  color: #ef4444 !important;
}

.strict-icon {
  color: #ef4444 !important;
  animation: strict-shake 0.5s ease-in-out infinite;
}

@keyframes strict-shake {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg); }
  75% { transform: rotate(5deg); }
}

.strict-mode-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}



/* Modern Card-Based Design */
.settings-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.2s ease;
}

.settings-card:hover {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
}

.work-card {
  border-left: 3px solid #14b8a6;
}

.break-card {
  border-left: 3px solid #06b6d4;
}

.music-card {
  border-left: 3px solid #8b5cf6;
}

.password-card {
  border-left: 3px solid #f59e0b;
}



.card-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 16px;
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.2rem;
}

.card-icon svg {
  width: 24px;
  height: 24px;
}

.work-icon {
  background: rgba(20, 184, 166, 0.15);
  color: #14b8a6;
}

.break-icon {
  background: rgba(6, 182, 212, 0.15);
  color: #06b6d4;
}

.music-icon {
  background: rgba(139, 92, 246, 0.15);
  color: #8b5cf6;
}

.password-icon {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}



.card-title-group {
  flex: 1;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 4px 0;
}

.card-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0;
}



/* Modern Time Inputs */
.time-inputs-modern {
  display: flex;
  gap: 12px;
}

.time-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.time-input-modern {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  font-size: 1.3rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.time-input-modern:focus {
  outline: none;
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15);
}

.time-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-align: center;
  font-weight: 500;
}

/* Modern Music Manager */
.music-manager-modern {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.music-actions {
  display: flex;
  gap: 10px;
}

.btn-action {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-muted);
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-action svg {
  width: 18px;
  height: 18px;
}

.btn-action:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.btn-action.primary {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
  color: #8b5cf6;
}

.btn-action.primary:hover {
  background: rgba(139, 92, 246, 0.25);
  border-color: rgba(139, 92, 246, 0.5);
}

.music-list-modern {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 180px;
  overflow-y: auto;
  padding: 4px;
}

.music-item-modern {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.music-item-modern:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.music-item-modern.active-track {
  background: rgba(139, 92, 246, 0.1);
  border-color: rgba(139, 92, 246, 0.3);
}

.music-item-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.radio-indicator {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
}

.radio-dot.selected {
  background: #8b5cf6;
  border-color: #8b5cf6;
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.5);
}

.track-name {
  font-size: 0.9rem;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-delete-track {
  background: transparent;
  border: none;
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.btn-delete-track:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.btn-delete-track svg {
  width: 18px;
  height: 18px;
}

.empty-music-modern {
  text-align: center;
  padding: 24px 16px;
  color: var(--text-muted);
}

.empty-music-modern .empty-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 8px;
  opacity: 0.5;
}

.empty-music-modern p {
  margin: 0;
  font-size: 0.9rem;
}

.music-option {
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.checkbox-label-modern {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.checkbox-label-modern input[type="checkbox"] {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.checkbox-label-modern input[type="checkbox"]:checked + .checkbox-custom {
  background: #14b8a6;
  border-color: #14b8a6;
}

.checkbox-label-modern input[type="checkbox"]:checked + .checkbox-custom::after {
  content: '✓';
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.checkbox-text {
  font-size: 0.9rem;
  color: var(--text-muted);
}

.checkbox-label-modern input[type="checkbox"]:checked + .checkbox-custom + .checkbox-text {
  color: #fff;
}

/* Password Input Modern */
.password-input-wrapper {
  width: 100%;
}

.password-input-modern {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 14px 16px;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.password-input-modern:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
}

.password-input-modern::placeholder {
  color: var(--text-muted);
}

/* Start Button Modern */
.btn-start-modern {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #14b8a6;
  border: none;
  color: white;
  padding: 16px 24px;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 14px rgba(20, 184, 166, 0.3);
}

.btn-start-modern:hover:not(:disabled) {
  background: #0d9488;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
}

.btn-start-modern:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-start-modern .btn-icon {
  width: 22px;
  height: 22px;
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

/* Schedule Styles */
.schedule-container {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 12px;
  margin-top: 8px;
}

.schedule-toggle {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.schedule-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.time-picker {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sub-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 500;
}

.time-picker-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-range-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.time-range-row .time-picker {
  flex: 1;
  min-width: 200px;
}

.time-select,
.period-select {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.time-select:focus,
.period-select:focus {
  outline: none;
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.2);
}

.time-select {
  flex: 1;
  text-align: center;
}

.period-select {
  flex: 0 0 70px;
  font-weight: 600;
}

.time-separator {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--text-muted);
  padding-bottom: 8px;
}

.days-picker {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.days-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.day-btn {
  flex: 1;
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.day-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.day-btn.active {
  background: rgba(20, 184, 166, 0.2);
  border-color: rgba(20, 184, 166, 0.4);
  color: #14b8a6;
}

.schedule-info-box {
  background: rgba(20, 184, 166, 0.1);
  border: 1px solid rgba(20, 184, 166, 0.2);
  border-radius: 8px;
  padding: 10px 12px;
}

.schedule-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0;
}

.info-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: rgba(20, 184, 166, 0.2);
  border-radius: 50%;
  color: #14b8a6;
  font-size: 0.7rem;
  font-weight: bold;
  flex-shrink: 0;
}

.breaks-count-row {
  display: flex;
  gap: 12px;
}

.input-with-label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.breaks-input {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 0.95rem;
  width: 100%;
  box-sizing: border-box;
}

.breaks-input:focus {
  outline: none;
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.2);
}

/* Custom Breaks Section */
.custom-breaks-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.breaks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-add-break {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(20, 184, 166, 0.15);
  color: #14b8a6;
  border: 1px solid rgba(20, 184, 166, 0.3);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-break:hover {
  background: rgba(20, 184, 166, 0.25);
}

.btn-add-break :deep(svg) {
  width: 16px;
  height: 16px;
}

.no-breaks {
  padding: 20px;
  text-align: center;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.no-breaks p {
  margin: 0;
}

.break-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 12px;
  transition: all 0.2s;
}

.break-item:hover {
  border-color: rgba(20, 184, 166, 0.2);
}

.break-time-inputs {
  display: flex;
  align-items: center;
  gap: 6px;
}

.time-select-small {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.time-select-small:focus {
  outline: none;
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.2);
}

.period-select-small {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.period-select-small:focus {
  outline: none;
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.2);
}

.break-duration-input {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.duration-input {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  min-width: 80px;
}

.duration-input:focus {
  outline: none;
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.2);
}

.duration-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.btn-remove-break {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #ef4444;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-remove-break:hover {
  background: rgba(239, 68, 68, 0.15);
}

.btn-remove-break :deep(svg) {
  width: 20px;
  height: 20px;
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
  background: #14b8a6;
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
