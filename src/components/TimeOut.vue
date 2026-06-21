<template>
  <div class="timeout-widget">
    
    <div v-if="hasActiveSchedule && !status" class="active-schedule-banner">
      <div class="banner-content">
        <div class="banner-left" @click="editSchedule" style="cursor: pointer;">
          <span class="banner-icon" v-html="Icons.timeoutWork"></span>
          <div class="banner-text">
            <h4>{{ t('timeout.scheduleActive', 'Schedule Active') }} <span class="edit-hint">{{ t('timeout.clickToEdit', '(click to edit)') }}</span></h4>
            <p>{{ getScheduleSummary() }}</p>
          </div>
        </div>
        <button @click="cancelSchedule" class="btn-cancel-schedule">
          <span v-html="Icons.timeoutTrash"></span>
          {{ t('timeout.cancelSchedule', 'Cancel Schedule') }}
        </button>
      </div>
    </div>

    
    <div v-if="!status" class="timeout-setup">
      
      <div class="mode-tabs">
        <button 
          class="mode-tab" 
          :class="{ active: activeTab === 'simple' }"
          @click="activeTab = 'simple'"
        >
          <span v-html="Icons.timeoutBreak"></span>
          <span>{{ t('timeout.simpleBreaks', 'Simple Breaks') }}</span>
        </button>
        <button 
          class="mode-tab" 
          :class="{ active: activeTab === 'schedule' }"
          @click="activeTab = 'schedule'"
        >
          <span v-html="Icons.timeoutWork"></span>
          <span>{{ t('timeout.scheduleMode', 'Schedule Mode') }}</span>
        </button>
      </div>

      
      <div v-show="activeTab === 'simple'" class="tab-content">
      
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

      
      <div class="settings-card music-card">
        <div class="card-header">
          <div class="card-icon music-icon" v-html="Icons.timeoutMusic"></div>
          <div class="card-title-group">
            <h3 class="card-title">{{ t('timeout.backgroundMusic', 'Background Music') }}</h3>
            <p class="card-desc">{{ t('timeout.musicDesc', 'Optional music during breaks') }}</p>
          </div>
        </div>

        <!-- Music Folder & Playback Mode Selection -->
        <div class="music-config-modern">
          <!-- Folder Selection Row -->
          <div class="config-row">
            <div class="config-text-group">
              <span class="config-label">{{ t('timeout.musicFolder', 'Music Folder') }}</span>
              <span class="folder-path-display" :title="customDir || t('timeout.defaultFolder', 'Default App Folder')">
                {{ customDir ? customDir : t('timeout.defaultFolder', 'Default App Folder') }}
              </span>
            </div>
            <div class="folder-btn-row">
              <button @click="selectMusicFolder" class="btn-folder-action">
                <span v-html="Icons.timeoutFolder" style="display: flex; align-items: center;"></span>
                {{ t('settings.selectFolder', 'Select Folder') }}
              </button>
              <button @click="resetMusicFolder" class="btn-folder-reset" v-if="customDir">
                {{ t('common.reset', 'Reset') }}
              </button>
            </div>
          </div>

          <div class="config-divider"></div>

          <!-- Playback Mode Row -->
          <div class="config-row">
            <span class="config-label">{{ t('timeout.playbackMode', 'Playback Mode') }}</span>
            <div class="mode-options">
              <label class="radio-label-modern">
                <input type="radio" v-model="playlistMode" value="single" @change="saveMusicSettings" />
                <span class="radio-custom"></span>
                <span class="radio-text">{{ t('timeout.playSingle', 'Play Selected Track') }}</span>
              </label>
              <label class="radio-label-modern">
                <input type="radio" v-model="playlistMode" value="all" @change="saveMusicSettings" />
                <span class="radio-custom"></span>
                <span class="radio-text">{{ t('timeout.playAll', 'Play Folder') }}</span>
              </label>
            </div>
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
              <span class="empty-icon"></span>
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
      </div>

      
      <div v-show="activeTab === 'schedule'" class="tab-content">
      
      <div class="settings-card schedule-card">
        <div class="card-header">
          <div class="card-icon schedule-icon" v-html="Icons.timeoutWork"></div>
          <div class="card-title-group">
            <h3 class="card-title">{{ t('timeout.scheduleTitle', 'Schedule Mode') }}</h3>
            <p class="card-desc">{{ t('timeout.scheduleDesc', 'Set specific times and days for Time OUT') }}</p>
          </div>
        </div>

        <div class="schedule-container">
          
          <div class="schedule-toggle">
            <label class="checkbox-label-modern">
              <input type="checkbox" v-model="enableSchedule" />
              <span class="checkbox-custom"></span>
              <span class="checkbox-text">{{ t('timeout.enableSchedule', 'Enable schedule mode') }}</span>
            </label>
          </div>

          
          <div v-if="enableSchedule" class="schedule-options">
            
            <div class="time-picker">
              <label class="sub-label">{{ t('timeout.workingHours', 'Working Hours') }}</label>
              <div class="time-range-row">
                <div class="time-picker-row">
                  <select v-model.number="scheduleStartHour" class="time-select">
                    <option v-for="h in 12" :key="h" :value="h">{{ h }}</option>
                  </select>
                  <span class="time-separator">:</span>
                  <input 
                    type="number" 
                    v-model.number="scheduleStartMinute" 
                    min="0" 
                    max="59" 
                    class="time-input-manual"
                    placeholder="00"
                  />
                  <select v-model="scheduleStartPeriod" class="period-select">
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
                <span style="margin: 0 8px; color: var(--text-secondary);">—</span>
                <div class="time-picker-row">
                  <select v-model.number="scheduleEndHour" class="time-select">
                    <option v-for="h in 12" :key="h" :value="h">{{ h }}</option>
                  </select>
                  <span class="time-separator">:</span>
                  <input 
                    type="number" 
                    v-model.number="scheduleEndMinute" 
                    min="0" 
                    max="59" 
                    class="time-input-manual"
                    placeholder="00"
                  />
                  <select v-model="scheduleEndPeriod" class="period-select">
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>

            
            <div class="days-picker">
              <label class="sub-label">{{ t('timeout.activeDays', 'Active Days') }}</label>
              <div class="days-row">
                <button
                  v-for="(day, index) in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']"
                  :key="index"
                  @click="toggleDay(index)"
                  class="day-btn"
                  :class="{ active: selectedDays.includes(index) }"
                  type="button"
                >
                  {{ t(`timeout.day${day}`, day) }}
                </button>
              </div>
            </div>

            
            <div class="custom-breaks-section">
              <div class="breaks-header">
                <label class="sub-label">{{ t('timeout.customBreaks', 'Custom Breaks') }}</label>
                <button @click="addBreak" class="btn-add-break" type="button">
                  <span v-html="Icons.tasksAdd"></span>
                  {{ t('timeout.addBreak', 'Add Break') }}
                </button>
              </div>

              <div v-if="customBreaks.length === 0" class="no-breaks">
                <p>{{ t('timeout.noCustomBreaks', 'No custom breaks. Add breaks at specific times.') }}</p>
              </div>

              <div v-else class="break-item" v-for="brk in customBreaks" :key="brk.id">
                <div class="break-time-range">
                  <div class="break-label">{{ t('timeout.breakFrom', 'From') }}</div>
                  <div class="break-time-inputs">
                    <select v-model.number="brk.startHour" class="time-select-small">
                      <option v-for="h in 12" :key="h" :value="h">{{ h }}</option>
                    </select>
                    <span class="time-separator">:</span>
                    <input 
                      type="number" 
                      v-model.number="brk.startMinute" 
                      min="0" 
                      max="59" 
                      class="time-input-small"
                      placeholder="00"
                    />
                    <select v-model="brk.startPeriod" class="period-select-small">
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                  
                  <div class="break-label">{{ t('timeout.breakTo', 'To') }}</div>
                  <div class="break-time-inputs">
                    <select v-model.number="brk.endHour" class="time-select-small">
                      <option v-for="h in 12" :key="h" :value="h">{{ h }}</option>
                    </select>
                    <span class="time-separator">:</span>
                    <input 
                      type="number" 
                      v-model.number="brk.endMinute" 
                      min="0" 
                      max="59" 
                      class="time-input-small"
                      placeholder="00"
                    />
                    <select v-model="brk.endPeriod" class="period-select-small">
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
                <button @click="removeBreak(brk.id)" class="btn-remove-break" type="button">
                  <span v-html="Icons.timeoutTrash"></span>
                </button>
              </div>
            </div>

            
            <div class="schedule-info-box">
              <span class="info-icon">ℹ️</span>
              <p class="schedule-hint">
                {{ t('timeout.scheduleHint', 'Time OUT will automatically start during working hours on selected days. Custom breaks will trigger at specified times.') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      
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
      </div>

      
      <button @click="startTimeout" class="btn-start-modern" :disabled="!canStart || isSaving">
        <span v-if="isSaving" class="btn-spinner"></span>
        <span v-else class="btn-icon" v-html="Icons.timeoutBreak"></span>
        <span>{{ getSaveButtonText() }}</span>
      </button>

      
      <div v-if="statusMessage" class="status-message" :class="statusMessageType">
        <span class="status-icon" v-html="getStatusIcon()"></span>
        <span>{{ statusMessage }}</span>
      </div>
    </div>

    
    <div v-else class="timeout-active">
      
      <div v-if="status.break_active" class="break-overlay">
        <div class="break-emoji" v-html="Icons.timeoutBreak"></div>
        <h3 class="break-title">{{ t('timeout.breakTitle', 'Time to relax!') }}</h3>
        <p class="break-subtitle">{{ t('timeout.breakMessage', 'Take a break, drink some tea, stretch!') }}</p>

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

        <p class="break-note">{{ t('timeout.allAppsBlocked', 'All applications are blocked during break') }}</p>
      </div>

      
      <div v-else class="working-state">
        <div class="status-badge working">
          <span class="status-dot"></span>
          {{ t('timeout.working', 'Working') }}
        </div>

        <div class="next-break-info">
          <span class="next-label">{{ t('timeout.nextBreak', 'Next break in') }}</span>
          <span class="next-time">{{ workFormattedTime }}</span>
        </div>

        <div class="schedule-info">
          <div class="schedule-item">
            <span class="schedule-icon" v-html="Icons.timeoutWork"></span>
            <span>{{ t('timeout.workInterval', 'Work Interval') }}: {{ status.interval_secs / 60 }}{{ t('common.m_symbol', 'm') }}</span>
          </div>
          <div class="schedule-item">
            <span class="schedule-icon" v-html="Icons.timeoutBreak"></span>
            <span>{{ t('timeout.breakDuration', 'Break Duration') }}: {{ status.break_duration_secs / 60 }}{{ t('common.m_symbol', 'm') }}</span>
          </div>
        </div>
      </div>

      
      <div class="cancel-section">
        <input
          type="password"
          v-model="cancelPassword"
          class="password-input small"
          :placeholder="t('timeout.passwordPlaceholder', 'Enter password...')"
        />
        <button @click="stopTimeout" class="btn-cancel">
          <span class="btn-icon" v-html="Icons.timeoutStop"></span> {{ t('timeout.cancel', 'Cancel Time OUT') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
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
const cancelError = ref("");
const status = ref<TimeoutStatus | null>(null);
let pollInterval: number | null = null;


const enableSchedule = ref(false);

const scheduleStartHour = ref<number>(9);
const scheduleStartMinute = ref<number>(0);
const scheduleStartPeriod = ref<"AM" | "PM">("AM");
const scheduleEndHour = ref<number>(5);
const scheduleEndMinute = ref<number>(0);
const scheduleEndPeriod = ref<"AM" | "PM">("PM");

interface CustomBreak {
  id: number;
  startHour: number;
  startMinute: number;
  startPeriod: "AM" | "PM";
  endHour: number;
  endMinute: number;
  endPeriod: "AM" | "PM";
}
const customBreaks = ref<CustomBreak[]>([]);

const selectedDays = ref<number[]>([]); // 0 = Sunday, 1 = Monday, etc.


const isSaving = ref(false);
const statusMessage = ref("");
const statusMessageType = ref<"success" | "error" | "info">("info");
let statusTimeout: number | null = null;


const activeTab = ref<"simple" | "schedule">("simple");


const hasActiveSchedule = computed(() => {
  const savedSchedule = localStorage.getItem("timigs-timeout-schedule");
  if (!savedSchedule) return false;
  try {
    const parsed = JSON.parse(savedSchedule);
    return parsed.enabled === true;
  } catch {
    return false;
  }
});


const isPlaying = ref(false);
const audio = ref<HTMLAudioElement | null>(null);
const musicFiles = ref<any[]>([]);
const selectedMusic = ref<string>("");
const playMusicDuringBreak = ref<boolean>(true);

const customDir = ref<string | null>(null);
const playlistMode = ref<string>("single");
const isLooping = ref<boolean>(false);

async function loadMusicSettings() {
  try {
    const settings = await invoke<{ custom_dir: string | null; playlist_mode: string; loop_enabled: boolean }>("get_music_settings_cmd");
    customDir.value = settings.custom_dir;
    playlistMode.value = settings.playlist_mode;
    isLooping.value = settings.loop_enabled;
  } catch (e) {
    console.error("Failed to load music settings:", e);
  }
}

async function saveMusicSettings() {
  try {
    await invoke("set_music_settings_cmd", {
      customDir: customDir.value,
      playlistMode: playlistMode.value,
      loopEnabled: isLooping.value,
    });
  } catch (e) {
    console.error("Failed to save music settings:", e);
  }
}

async function selectMusicFolder() {
  try {
    const selected = await openDialog({
      directory: true,
      multiple: false,
    });
    if (selected) {
      customDir.value = selected as string;
      await saveMusicSettings();
      await loadMusicFiles();
      if (musicFiles.value.length > 0) {
        selectedMusic.value = musicFiles.value[0].filename;
      } else {
        selectedMusic.value = "";
      }
    }
  } catch (e) {
    console.error("Failed to select music directory:", e);
  }
}

async function resetMusicFolder() {
  customDir.value = null;
  await saveMusicSettings();
  await loadMusicFiles();
  if (musicFiles.value.length > 0) {
    selectedMusic.value = musicFiles.value[0].filename;
  } else {
    selectedMusic.value = "";
  }
}

async function loadMusicFiles() {
  try {
    musicFiles.value = await invoke("get_music_files_cmd");

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
    const track = musicFiles.value.find(f => f.filename === filename);
    if (track) {
      await invoke("delete_music_file_cmd", { path: track.path });
      if (selectedMusic.value === filename) {
        selectedMusic.value = "";
      }
      await loadMusicFiles();
    }
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


function showStatusMessage(message: string, type: "success" | "error" | "info", duration = 5000) {
  if (statusTimeout) {
    clearTimeout(statusTimeout);
  }
  statusMessage.value = message;
  statusMessageType.value = type;
  statusTimeout = window.setTimeout(() => {
    statusMessage.value = "";
  }, duration);
}

function getSaveButtonText() {
  if (isSaving.value) {
    return enableSchedule.value ? t('timeout.scheduling', 'Scheduling...') : t('timeout.starting', 'Starting...');
  }
  return enableSchedule.value ? t('timeout.schedule', 'Schedule Time OUT') : t('timeout.start', 'Activate Time OUT');
}

function getStatusIcon() {
  if (statusMessageType.value === "success") {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
  } else if (statusMessageType.value === "error") {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
}

function getScheduleSummary() {
  const savedSchedule = localStorage.getItem("timigs-timeout-schedule");
  if (!savedSchedule) return "";
  
  try {
    const parsed = JSON.parse(savedSchedule);
    const days = parsed.days || [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const selectedDayNames = days.map((d: number) => dayNames[d]).join(', ');
    
    const startTime = `${parsed.startHour}:${String(parsed.startMinute).padStart(2, '0')} ${parsed.startPeriod}`;
    const endTime = `${parsed.endHour}:${String(parsed.endMinute).padStart(2, '0')} ${parsed.endPeriod}`;
    
    const breaksCount = parsed.customBreaks?.length || 0;
    let breaksText = '';
    if (breaksCount > 0) {
      const breaksList = parsed.customBreaks.map((b: any) => {
        const bStart = `${b.startHour}:${String(b.startMinute).padStart(2, '0')} ${b.startPeriod}`;
        const bEnd = `${b.endHour}:${String(b.endMinute).padStart(2, '0')} ${b.endPeriod}`;
        return `${bStart}-${bEnd}`;
      }).join(', ');
      breaksText = ` • Breaks: ${breaksList}`;
    }
    
    return `${selectedDayNames || 'No days selected'} • ${startTime} - ${endTime}${breaksText}`;
  } catch {
    return "Schedule configured";
  }
}

async function cancelSchedule() {
  try {

    localStorage.removeItem("timigs-timeout-schedule");
    

    enableSchedule.value = false;
    selectedDays.value = [];
    customBreaks.value = [];
    
    showStatusMessage(
      " Schedule cancelled successfully. Changes will take effect on next app restart.",
      "success",
      5000
    );
  } catch (e: any) {
    showStatusMessage(
      ` Failed to cancel schedule: ${e.toString()}`,
      "error",
      5000
    );
  }
}

function editSchedule() {

  const savedSchedule = localStorage.getItem("timigs-timeout-schedule");
  if (!savedSchedule) return;
  
  try {
    const parsed = JSON.parse(savedSchedule);
    enableSchedule.value = true;
    scheduleStartHour.value = parsed.startHour || 9;
    scheduleStartMinute.value = parsed.startMinute || 0;
    scheduleStartPeriod.value = parsed.startPeriod || "AM";
    scheduleEndHour.value = parsed.endHour || 5;
    scheduleEndMinute.value = parsed.endMinute || 0;
    scheduleEndPeriod.value = parsed.endPeriod || "PM";
    customBreaks.value = parsed.customBreaks || [];
    selectedDays.value = parsed.days || [];
    

    setTimeout(() => {
      const scheduleCard = document.querySelector('.schedule-card');
      if (scheduleCard) {
        scheduleCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
    
    showStatusMessage(
      " Schedule loaded for editing. Make your changes and click 'Schedule Time OUT' to save.",
      "info",
      5000
    );
  } catch (e) {
    console.error("Failed to load schedule for editing:", e);
  }
}


function toggleDay(day: number) {
  const index = selectedDays.value.indexOf(day);
  if (index > -1) {
    selectedDays.value.splice(index, 1);
  } else {
    selectedDays.value.push(day);
  }
}

function addBreak() {
  const newBreak: CustomBreak = {
    id: Date.now(),
    startHour: 2,
    startMinute: 0,
    startPeriod: "PM",
    endHour: 2,
    endMinute: 30,
    endPeriod: "PM",
  };
  customBreaks.value.push(newBreak);
}

function removeBreak(id: number) {
  const index = customBreaks.value.findIndex(b => b.id === id);
  if (index > -1) {
    customBreaks.value.splice(index, 1);
  }
}

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
  breaks: Array<{ startHour: number; startMinute: number; endHour: number; endMinute: number }>;
} | null {
  if (!enableSchedule.value) return null;
  
  return {
    startHour: convertTo24Hour(scheduleStartHour.value, scheduleStartPeriod.value),
    startMinute: scheduleStartMinute.value,
    endHour: convertTo24Hour(scheduleEndHour.value, scheduleEndPeriod.value),
    endMinute: scheduleEndMinute.value,
    breaks: customBreaks.value.map(b => ({
      startHour: convertTo24Hour(b.startHour, b.startPeriod),
      startMinute: b.startMinute,
      endHour: convertTo24Hour(b.endHour, b.endPeriod),
      endMinute: b.endMinute,
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
  if (!breakActive) {
    try {
      await invoke("stop_music_cmd");
    } catch (e) {}
  }
}

async function startTimeout() {
  if (!canStart.value || isSaving.value) return;
  
  isSaving.value = true;
  statusMessage.value = "";
  
  try {
    const scheduleConfig = getScheduleConfig();


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
      

      const daysText = selectedDays.value.length > 0 
        ? ` on ${selectedDays.value.length} selected day(s)` 
        : "";
      showStatusMessage(
        ` Schedule saved! Time OUT will start automatically${daysText} during working hours.`,
        "success",
        8000
      );
    } else {

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
      

      showStatusMessage(
        " Time OUT activated! Work session started.",
        "success",
        5000
      );
    }
  } catch (e: any) {
    showStatusMessage(
      ` Error: ${e.toString()}`,
      "error",
      8000
    );
  } finally {
    isSaving.value = false;
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
    showStatusMessage(
      " Time OUT cancelled successfully.",
      "success",
      3000
    );
  } catch (e: any) {
    cancelError.value = e;
    showStatusMessage(
      ` Failed to cancel: ${e.toString()}`,
      "error",
      5000
    );
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
  await loadMusicSettings();
  loadMusicFiles();


  const savedMusic = localStorage.getItem("timigs-timeout-music");
  if (savedMusic) selectedMusic.value = savedMusic;
  const savedPlayState = localStorage.getItem("timigs-timeout-play");
  if (savedPlayState !== null) playMusicDuringBreak.value = savedPlayState === "true";
  

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

  localStorage.setItem("timigs-timeout-music", selectedMusic.value);
  localStorage.setItem("timigs-timeout-play", String(playMusicDuringBreak.value));


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


.mode-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  background: var(--bg-secondary);
  padding: 6px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.mode-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-tab:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.mode-tab.active {
  background: var(--bg-primary);
  color: var(--accent-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.mode-tab svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 18px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


.active-schedule-banner {
  background: var(--bg-tertiary) 0%, rgba(59, 130, 246, 0.15) 100%);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 12px;
  animation: slideIn 0.3s ease;
}

.banner-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
}

.banner-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  color: #8b5cf6;
  flex-shrink: 0;
}

.banner-icon svg {
  width: 24px;
  height: 24px;
}

.banner-text h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.banner-text h4 .edit-hint {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--text-muted);
  opacity: 0.7;
  margin-left: 8px;
}

.banner-left:hover .edit-hint {
  opacity: 1;
  color: #8b5cf6;
}

.banner-text p {
  margin: 4px 0 0 0;
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.btn-cancel-schedule {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-cancel-schedule:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.5);
  transform: translateY(-1px);
}

.btn-cancel-schedule svg {
  width: 18px;
  height: 18px;
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

.schedule-card {
  border-left: 3px solid #a855f7;
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

.schedule-icon {
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;
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

.music-config-modern {
  margin: 16px 0;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.config-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.config-text-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #fff;
}

.folder-path-display {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 320px;
}

.folder-btn-row {
  display: flex;
  gap: 8px;
}

.btn-folder-action {
  padding: 6px 12px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-folder-action:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.btn-folder-action svg {
  display: flex;
  align-items: center;
  width: 16px;
  height: 16px;
}

.btn-folder-reset {
  padding: 6px 12px;
  font-size: 13px;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-folder-reset:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.4);
}

.config-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.05);
  width: 100%;
}

.mode-options {
  display: flex;
  gap: 20px;
}

/* Custom Radio Buttons */
.radio-label-modern {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.radio-label-modern input[type="radio"] {
  display: none;
}

.radio-custom {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.radio-label-modern input[type="radio"]:checked + .radio-custom {
  border-color: #14b8a6;
}

.radio-custom::after {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: transparent;
  transition: all 0.2s ease;
}

.radio-label-modern input[type="radio"]:checked + .radio-custom::after {
  background: #14b8a6;
}

.radio-text {
  font-size: 0.9rem;
  color: var(--text-muted);
  transition: color 0.2s ease;
}

.radio-label-modern input[type="radio"]:checked + .radio-custom + .radio-text {
  color: #fff;
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
  content: '';
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

.btn-start-modern .btn-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}


.status-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.status-message.success {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

.status-message.error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.status-message.info {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #3b82f6;
}

.status-message .status-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-message .status-icon svg {
  width: 100%;
  height: 100%;
}


.schedule-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.schedule-toggle {
  padding-bottom: 8px;
}

.schedule-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.time-picker {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sub-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.time-picker-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.time-range-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.time-range-row .time-picker {
  flex: 1;
  min-width: 200px;
}

.time-select, .period-select {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.time-select:focus, .period-select:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.15);
}

.time-select {
  width: 70px;
  text-align: center;
}

.time-input-manual {
  width: 70px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 10px;
  border-radius: 10px;
  font-size: 0.95rem;
  text-align: center;
  transition: all 0.2s ease;
}

.time-input-manual:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.15);
}

.time-input-manual::-webkit-inner-spin-button,
.time-input-manual::-webkit-outer-spin-button {
  opacity: 1;
}

.period-select {
  width: 80px;
  text-align: center;
}

.time-separator {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.days-picker {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.days-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.day-btn {
  flex: 1;
  min-width: 50px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
  padding: 10px 8px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.day-btn:hover {
  background: rgba(168, 85, 247, 0.1);
  border-color: rgba(168, 85, 247, 0.3);
}

.day-btn.active {
  background: rgba(168, 85, 247, 0.2);
  border-color: #a855f7;
  color: #a855f7;
}

.schedule-info-box {
  background: rgba(168, 85, 247, 0.08);
  border: 1px solid rgba(168, 85, 247, 0.2);
  border-radius: 12px;
  padding: 12px;
}

.schedule-hint {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.info-icon {
  font-size: 1rem;
  flex-shrink: 0;
  opacity: 0.7;
  display: inline-block;
  margin-top: 2px;
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
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.breaks-input:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.15);
}


.custom-breaks-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.3);
  color: #a855f7;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-add-break:hover {
  background: rgba(168, 85, 247, 0.25);
}

.btn-add-break :deep(svg) {
  width: 16px;
  height: 16px;
}

.no-breaks {
  background: rgba(0, 0, 0, 0.2);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 20px;
  text-align: center;
}

.no-breaks p {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.break-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 12px;
  transition: all 0.2s ease;
}

.break-item:hover {
  border-color: rgba(168, 85, 247, 0.3);
}

.break-time-range {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  flex-wrap: wrap;
}

.break-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 500;
  min-width: 40px;
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
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.time-select-small:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.15);
}

.time-input-small {
  width: 50px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 0.9rem;
  text-align: center;
  transition: all 0.2s ease;
}

.time-input-small:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.15);
}

.time-input-small::-webkit-inner-spin-button,
.time-input-small::-webkit-outer-spin-button {
  opacity: 1;
}

.period-select-small {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.period-select-small:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.15);
}

.break-duration-input {
  display: flex;
  align-items: center;
  gap: 6px;
}

.duration-input {
  width: 70px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 0.9rem;
  text-align: center;
  transition: all 0.2s ease;
}

.duration-input:focus {
  outline: none;
  border-color: #a855f7;
  box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.15);
}

.duration-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 500;
}

.btn-remove-break {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.btn-remove-break:hover {
  background: rgba(239, 68, 68, 0.2);
}

.btn-remove-break :deep(svg) {
  width: 18px;
  height: 18px;
}




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
