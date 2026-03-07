<template>
  <div class="focus-mode">
    <!-- Setup State -->
    <div v-if="!status" class="focus-setup">
      <div class="setup-section">
        <label class="section-label">
          <span class="icon" v-html="Icons.focusTarget"></span>
          Select Application
        </label>
        <select v-model="selectedApp" class="app-select">
          <option value="" disabled>Choose an app to focus on...</option>
          <option v-for="app in recentApps" :key="app.app_name" :value="app">
            {{ app.app_name }} ({{ formatDuration(app.total_seconds) }})
          </option>
        </select>
      </div>

      <div class="setup-section">
        <label class="section-label">
          <span class="icon" v-html="Icons.timeoutPause"></span>
          Duration
        </label>
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
        <label class="section-label">
          <span class="icon" v-html="Icons.focusMusic"></span>
          Background Music (Optional)
        </label>
        <div class="music-selection">
          <select v-model="selectedMusic" class="music-select">
            <option value="">No music</option>
            <option v-for="track in musicFiles" :key="track.filename" :value="track.filename">
              {{ track.filename }}
            </option>
          </select>
          <div class="music-buttons">
            <button @click="addMusicFile" class="btn-music-folder" title="Add music file">
              <span v-html="Icons.musicFolder"></span>
            </button>
            <button @click="removeMusicFile" class="btn-music-folder btn-delete" :disabled="!selectedMusic" title="Remove selected file">
              <span v-html="Icons.tasksDelete"></span>
            </button>
          </div>
        </div>
        <div v-if="selectedMusic" class="music-preview">
          <button @click="previewMusic" class="btn-preview" :disabled="isPreviewing">
            {{ isPreviewing ? 'Stop Preview' : 'Preview' }}
          </button>
        </div>
      </div>

      <div class="setup-section">
        <label class="section-label">
          <span class="icon" v-html="Icons.focusLock"></span>
          Lock Password
        </label>
        <input type="password" v-model="password" class="password-input" placeholder="Enter a password to lock..." />
        <p class="hint">You'll need this password to cancel focus mode early</p>
      </div>

      <button @click="startFocus" class="btn-start" :disabled="!canStart">
        Start Focus Mode
      </button>
    </div>

    <!-- Active State -->
    <div v-else class="focus-active">
      <div class="focus-target">
        <div class="target-badge" v-html="Icons.focusTarget"></div>
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

      <!-- Music Player -->
      <div v-if="musicFiles.length > 0" class="music-player">
        <div class="now-playing">
          <span class="music-icon" v-html="Icons.focusMusic"></span>
          <span class="track-name">{{ musicStatus.current_track || 'No track selected' }}</span>
        </div>
        <div class="player-controls">
          <button @click="prevTrack" class="control-btn" title="Previous track">
            <span v-html="Icons.musicPrev"></span>
          </button>
          <button @click="togglePlayPause" class="control-btn play-btn" :title="musicStatus.is_playing ? 'Pause' : 'Play'">
            <span v-html="musicStatus.is_playing ? Icons.musicPause : Icons.musicPlay"></span>
          </button>
          <button @click="nextTrack" class="control-btn" title="Next track">
            <span v-html="Icons.musicNext"></span>
          </button>
          <button @click="toggleLoop" class="control-btn" :class="{ active: isLooping }" title="Toggle loop">
            <span v-html="Icons.musicLoop"></span>
          </button>
        </div>
        <div class="volume-control">
          <span class="volume-icon" v-html="Icons.musicVolume"></span>
          <input type="range" v-model.number="volume" min="0" max="100" @input="changeVolume" class="volume-slider" />
          <span class="volume-value">{{ volume }}%</span>
        </div>
        <select v-model="selectedTrack" @change="changeTrack" class="track-select">
          <option value="" disabled>Select a track...</option>
          <option v-for="track in musicFiles" :key="track.filename" :value="track.filename">
            {{ track.filename }}
          </option>
        </select>
      </div>

      <p class="focus-message">Other apps will be blocked</p>

      <div class="cancel-section">
        <input type="password" v-model="cancelPassword" class="password-input small" placeholder="Enter password to cancel..." />
        <button @click="stopFocus" class="btn-cancel">
          <span v-html="Icons.cancelFocus"></span>
          Cancel Focus
        </button>
        <p v-if="cancelError" class="error-text">{{ cancelError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { invoke } from '@tauri-apps/api/core';
import { Icons } from './icons/IconMap';
import { open } from '@tauri-apps/plugin-dialog';

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

interface MusicFile {
  filename: string;
  path: string;
}

interface MusicPlaybackStatus {
  is_playing: boolean;
  current_track: string | null;
  volume: number;
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

// Music state
const musicFiles = ref<MusicFile[]>([]);
const selectedMusic = ref<string>('');
const selectedTrack = ref<string>('');
const musicStatus = ref<MusicPlaybackStatus>({
  is_playing: false,
  current_track: null,
  volume: 0.5,
});
const volume = ref<number>(50);
const isLooping = ref<boolean>(false);
const isPreviewing = ref<boolean>(false);

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
    // Stop music when focus mode is stopped
    await stopMusic();
    stopMusicStatusPolling();
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

// Music functions
async function loadMusicFiles() {
  try {
    musicFiles.value = await invoke<MusicFile[]>('get_music_files_cmd');
  } catch (e) {
    console.error('Failed to load music files:', e);
  }
}

async function addMusicFile() {
  try {
    const selected = await open({
      multiple: false,
      filters: [{
        name: 'Audio',
        extensions: ['mp3', 'wav', 'ogg', 'flac']
      }]
    });
    
    if (selected) {
      await invoke('add_music_file_cmd', { sourcePath: selected });
      await loadMusicFiles();
    }
  } catch (e) {
    console.error('Failed to add music file:', e);
  }
}

async function removeMusicFile() {
  if (!selectedMusic.value) return;
  
  try {
    const track = musicFiles.value.find(f => f.filename === selectedMusic.value);
    if (track) {
      await invoke('delete_music_file_cmd', { path: track.path });
      selectedMusic.value = '';
      await loadMusicFiles();
    }
  } catch (e) {
    console.error('Failed to remove music file:', e);
  }
}

async function previewMusic() {
  if (!selectedMusic.value) return;

  if (isPreviewing.value) {
    await stopMusic();
    isPreviewing.value = false;
  } else {
    // Stop any existing music first to avoid conflicts
    await invoke('stop_music_cmd').catch(() => {});
    
    try {
      const track = musicFiles.value.find(f => f.filename === selectedMusic.value);
      if (track) {
        await invoke('play_music_cmd', { filename: track.path });
        isPreviewing.value = true;
        await updateMusicStatus();
      }
    } catch (e) {
      console.error('Failed to preview music:', e);
    }
  }
}

async function startMusicPlayback() {
  if (!selectedMusic.value) return;
  
  // Check if music is already playing to avoid restart
  try {
    const currentStatus = await invoke<MusicPlaybackStatus>('get_music_status_cmd');
    if (currentStatus.is_playing && currentStatus.current_track === selectedMusic.value) {
      return; // Music is already playing, don't restart
    }
  } catch (e) {
    console.error('Failed to check music status:', e);
  }
  
  try {
    const track = musicFiles.value.find(f => f.filename === selectedMusic.value);
    if (track) {
      await invoke('play_music_cmd', { filename: track.path });
      await updateMusicStatus();
    }
  } catch (e) {
    console.error('Failed to play music:', e);
  }
}

async function stopMusic() {
  try {
    await invoke('stop_music_cmd');
    isPreviewing.value = false;
    await updateMusicStatus();
  } catch (e) {
    console.error('Failed to stop music:', e);
  }
}

async function togglePlayPause() {
  try {
    if (musicStatus.value.is_playing) {
      await invoke('pause_music_cmd');
    } else {
      await invoke('resume_music_cmd');
    }
    await updateMusicStatus();
  } catch (e) {
    console.error('Failed to toggle play/pause:', e);
  }
}

async function changeTrack() {
  if (!selectedTrack.value) return;
  try {
    const track = musicFiles.value.find(f => f.filename === selectedTrack.value);
    if (track) {
      await invoke('play_music_cmd', { filename: track.path });
      await updateMusicStatus();
    }
  } catch (e) {
    console.error('Failed to change track:', e);
  }
}

async function changeVolume() {
  try {
    await invoke('set_music_volume_cmd', { volume: volume.value / 100 });
  } catch (e) {
    console.error('Failed to change volume:', e);
  }
}

async function toggleLoop() {
  try {
    isLooping.value = await invoke('toggle_music_loop_cmd');
  } catch (e) {
    console.error('Failed to toggle loop:', e);
  }
}

async function prevTrack() {
  if (musicFiles.value.length === 0) return;
  const currentIndex = musicFiles.value.findIndex(f => f.filename === musicStatus.value.current_track);
  const prevIndex = currentIndex <= 0 ? musicFiles.value.length - 1 : currentIndex - 1;
  const track = musicFiles.value[prevIndex];
  selectedTrack.value = track.filename;
  try {
    await invoke('play_music_cmd', { filename: track.path });
    await updateMusicStatus();
  } catch (e) {
    console.error('Failed to change track:', e);
  }
}

async function nextTrack() {
  if (musicFiles.value.length === 0) return;
  const currentIndex = musicFiles.value.findIndex(f => f.filename === musicStatus.value.current_track);
  const nextIndex = currentIndex >= musicFiles.value.length - 1 ? 0 : currentIndex + 1;
  const track = musicFiles.value[nextIndex];
  selectedTrack.value = track.filename;
  try {
    await invoke('play_music_cmd', { filename: track.path });
    await updateMusicStatus();
  } catch (e) {
    console.error('Failed to change track:', e);
  }
}

async function updateMusicStatus() {
  try {
    musicStatus.value = await invoke<MusicPlaybackStatus>('get_music_status_cmd');
    volume.value = Math.round(musicStatus.value.volume * 100);
  } catch (e) {
    console.error('Failed to get music status:', e);
  }
}

let musicStatusInterval: number | null = null;

function startMusicStatusPolling() {
  if (musicStatusInterval) clearInterval(musicStatusInterval);
  musicStatusInterval = window.setInterval(() => {
    updateMusicStatus();
  }, 500);
}

function stopMusicStatusPolling() {
  if (musicStatusInterval) {
    clearInterval(musicStatusInterval);
    musicStatusInterval = null;
  }
}

// Watch for focus mode state changes
watch(status, async (newStatus) => {
  if (newStatus && newStatus.active) {
    // Focus mode started
    if (selectedMusic.value) {
      await startMusicPlayback();
    }
    startMusicStatusPolling();
  } else {
    // Focus mode ended - stop music and polling
    stopMusicStatusPolling();
    await stopMusic();
  }
}, { immediate: true });

onMounted(() => {
  loadApps();
  loadStatus();
  loadMusicFiles();
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
  stopMusicStatusPolling();
  // Ensure music is stopped when component unmounts
  invoke('stop_music_cmd').catch(() => {});
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
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.section-label .icon {
  display: inline-flex;
  width: 20px;
  height: 20px;
  color: #a78bfa;
}

.section-label .icon svg {
  width: 100%;
  height: 100%;
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: #a78bfa;
}

.target-badge svg {
  width: 32px;
  height: 32px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel svg {
  width: 20px;
  height: 20px;
}

.btn-cancel:hover {
  background: rgba(239, 68, 68, 0.25);
}

.error-text {
  color: #ef4444;
  font-size: 0.85rem;
  margin: 0;
}

/* Music Selection */
.music-selection {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.music-select {
  flex: 1;
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

.music-select:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}

.music-select option {
  background: #1a1a2e;
  color: white;
}

.music-buttons {
  display: flex;
  gap: 8px;
}

.btn-music-folder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: white;
  padding: 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-music-folder svg {
  width: 24px;
  height: 24px;
}

.btn-music-folder:hover:not(:disabled) {
  background: rgba(139, 92, 246, 0.3);
}

.btn-music-folder:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-music-folder.btn-delete {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.3);
}

.btn-music-folder.btn-delete:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.3);
}

.music-preview {
  margin-top: 8px;
}

.btn-preview {
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: #a78bfa;
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-preview:hover:not(:disabled) {
  background: rgba(139, 92, 246, 0.3);
}
.btn-preview:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Music Player */
.music-player {
  width: 100%;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.now-playing {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
}

.music-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #a78bfa;
  animation: pulse 1.5s ease-in-out infinite;
}

.music-icon svg {
  width: 24px;
  height: 24px;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.track-name {
  font-size: 0.95rem;
  color: #a78bfa;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

.control-btn {
  background: rgba(139, 92, 246, 0.2);
  border: 1px solid rgba(139, 92, 246, 0.3);
  color: white;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn svg {
  width: 20px;
  height: 20px;
}

.control-btn:hover {
  background: rgba(139, 92, 246, 0.3);
  transform: scale(1.05);
}

.control-btn.play-btn {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  border: none;
}

.control-btn.play-btn svg {
  width: 24px;
  height: 24px;
}

.control-btn.play-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
}

.control-btn.active {
  background: rgba(139, 92, 246, 0.5);
  border-color: #a78bfa;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.volume-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--text-muted);
}

.volume-icon svg {
  width: 100%;
  height: 100%;
}

.volume-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  appearance: none;
  cursor: pointer;
}
.volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #8b5cf6;
  cursor: pointer;
  transition: all 0.2s;
}
.volume-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}
.volume-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #8b5cf6;
  cursor: pointer;
  border: none;
}

.volume-value {
  font-size: 0.85rem;
  color: var(--text-muted);
  min-width: 40px;
  text-align: right;
}

.track-select {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.9rem;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s;
}
.track-select:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
}
.track-select option {
  background: #1a1a2e;
  color: white;
}
</style>
