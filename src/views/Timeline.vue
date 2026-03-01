<template>
  <div class="page">
    <div class="page-container">
      <div class="page-header">
        <h2>{{ $t('timeline.title') }}</h2>
      </div>

    <div class="timeline-controls">
      <div class="search-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input 
          type="text" 
          v-model="searchQuery" 
          :placeholder="$t('timeline.searchPlaceholder') || 'Search apps...'" 
          class="search-input"
        />
      </div>

      <div class="calendar-nav">
        <button class="nav-btn" @click="goToPreviousDay">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        
        <div class="date-display">
          <div class="date-main">{{ formatDate(selectedDate) }}</div>
          <div class="date-sub" v-if="getDateLabel()">{{ getDateLabel() }}</div>
        </div>

        <button class="nav-btn" @click="goToNextDay" :disabled="isToday">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>

        <div class="date-picker-wrapper">
          <input type="date" class="date-input-hidden" v-model="dateInput" @change="onDateChange" ref="dateInputRef" />
          <button class="nav-btn calendar-btn" @click="openDatePicker">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </button>
        </div>
      </div>
    </div>

    <div class="timeline-container">
      <div v-if="filteredSessions.length > 0" class="timeline">
        <div v-for="session in filteredSessions" :key="session.id" class="timeline-item" @click="handleSessionClick(session)">
          <div class="timeline-time">
            {{ formatTime(session.start_time) }} - {{ session.end_time ? formatTime(session.end_time) : 'Now' }}
          </div>
          <div class="timeline-content">
            <div class="timeline-app" :class="{ 'is-clickable': isBrowser(session.app_name) }">
              <img v-if="appIcons[session.exe_path]" :src="appIcons[session.exe_path]" class="app-icon-img" :alt="session.app_name" />
              <div v-else class="app-icon-small" :style="{ background: getAppColor(session.app_name) }">
                {{ session.app_name.charAt(0).toUpperCase() }}
              </div>
              <div class="timeline-app-info">
                <div class="app-name">{{ session.app_name }}</div>
                <div class="window-title">{{ session.window_title }}</div>
              </div>
              <div class="session-duration">
                {{ formatDuration(session.duration_seconds) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>{{ sessions.length > 0 ? ($t('timeline.noSearchResults') || 'No apps found') : $t('timeline.noSessions') }}</p>
      </div>
    </div>

    <!-- Browser Stats Modal -->
    <div v-if="showBrowserModal" class="modal-overlay" @click.self="showBrowserModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ selectedBrowser }} - {{ $t('timeline.websites') || 'Websites' }}</h3>
          <button class="close-btn" @click="showBrowserModal = false">×</button>
        </div>
        <div class="modal-body">
          <div v-if="browserSites.length > 0" class="sites-list">
            <div v-for="site in browserSites" :key="site.name" class="site-item">
              <div class="site-name">{{ site.name }}</div>
              <div class="site-time">{{ formatDuration(site.seconds) }}</div>
               <div class="site-bar" :style="{ width: (site.seconds / maxSiteTime * 100) + '%' }"></div>
            </div>
          </div>
          <p v-else class="no-data">{{ $t('timeline.noWebsites') || 'No website data available' }}</p>
        </div>
      </div>
    </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { invoke } from '@tauri-apps/api/core';
import { useActivityStore, type ActivitySession } from '../stores/activity';

const { t } = useI18n();
const store = useActivityStore();

const selectedDate = ref(new Date());
const dateInput = ref(formatDateForInput(new Date()));
const dateInputRef = ref<HTMLInputElement | null>(null);
const sessions = ref<ActivitySession[]>([]);
const searchQuery = ref('');
const appIcons = ref<Record<string, string>>({});

// Browser Modal Logic
const showBrowserModal = ref(false);
const selectedBrowser = ref('');
const browserSites = ref<{name: string, seconds: number}[]>([]);
const maxSiteTime = computed(() => Math.max(...browserSites.value.map(s => s.seconds), 1));

const BROWSERS = ['chrome', 'msedge', 'firefox', 'opera', 'brave', 'vivaldi'];

function isBrowser(appName: string): boolean {
  return BROWSERS.some(b => appName.toLowerCase().includes(b));
}

function handleSessionClick(session: ActivitySession) {
  if (isBrowser(session.app_name)) {
    selectedBrowser.value = session.app_name;
    calculateBrowserStats(session.app_name);
    showBrowserModal.value = true;
  }
}

function calculateBrowserStats(appName: string) {
  const appSessions = sessions.value.filter(s => s.app_name === appName);
  const siteUsage: Record<string, number> = {};

  appSessions.forEach(session => {
    let site = 'Unknown';
    const title = session.window_title;
    
    // Clean title logic (copied from store/activity.ts)
    let cleanTitle = title
      .replace(/ - Google Chrome$/i, '')
      .replace(/ - Microsoft Edge$/i, '')
      .replace(/ - Mozilla Firefox$/i, '')
      .replace(/ - Opera$/i, '')
      .replace(/ - Brave$/i, '')
      .replace(/ - Vivaldi$/i, '');

    const parts = cleanTitle.split(/ - | \| /);
    if (parts.length > 1) {
      site = parts[parts.length - 1].trim();
    } else {
      site = cleanTitle.trim();
    }
    
    if (site === 'New Tab') return;
    if (site.endsWith('.com') || site.endsWith('.org')) site = site; 

    if (!siteUsage[site]) siteUsage[site] = 0;
    siteUsage[site] += session.duration_seconds;
  });

  browserSites.value = Object.entries(siteUsage)
    .map(([name, seconds]) => ({ name, seconds }))
    .sort((a, b) => b.seconds - a.seconds);
}


const filteredSessions = computed(() => {
  if (!searchQuery.value) return sessions.value;
  const query = searchQuery.value.toLowerCase();
  return sessions.value.filter(s => 
    s.app_name.toLowerCase().includes(query) || 
    s.window_title.toLowerCase().includes(query)
  );
});

function openDatePicker() {
  dateInputRef.value?.showPicker();
}

const appColors: Record<string, string> = {};
const colorPalette = ['#6366f1', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
let colorIndex = 0;

function getAppColor(appName: string): string {
  if (!appColors[appName]) {
    appColors[appName] = colorPalette[colorIndex % colorPalette.length];
    colorIndex++;
  }
  return appColors[appName];
}

const isToday = computed(() => {
  const today = new Date();
  return selectedDate.value.toDateString() === today.toDateString();
});

function getDateLabel(): string {
  const today = new Date();
  const date = selectedDate.value;
  
  if (date.toDateString() === today.toDateString()) {
    return t('timeline.today') || 'Today';
  }
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return t('timeline.yesterday') || 'Yesterday';
  }
  
  return '';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatTime(timeStr: string): string {
  return new Date(timeStr).toLocaleTimeString(undefined, { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function goToPreviousDay() {
  const newDate = new Date(selectedDate.value);
  newDate.setDate(newDate.getDate() - 1);
  selectedDate.value = newDate;
  dateInput.value = formatDateForInput(newDate);
}

function goToNextDay() {
  if (!isToday.value) {
    const newDate = new Date(selectedDate.value);
    newDate.setDate(newDate.getDate() + 1);
    selectedDate.value = newDate;
    dateInput.value = formatDateForInput(newDate);
  }
}

function onDateChange() {
  selectedDate.value = new Date(dateInput.value);
}

async function fetchSessions() {
  const dateStr = formatDateForInput(selectedDate.value);
  sessions.value = await store.getActivityRange(dateStr, dateStr);
}

async function loadIcons(sessionList: ActivitySession[]) {
  const paths = [...new Set(sessionList.map(s => s.exe_path).filter(Boolean))];
  for (const exePath of paths) {
    if (appIcons.value[exePath]) continue;
    try {
      const base64: string | null = await invoke('get_app_icon', { path: exePath });
      if (base64) {
        appIcons.value[exePath] = `data:image/png;base64,${base64}`;
      }
    } catch { /* icon not available, fallback to letter */ }
  }
}

watch(sessions, (newSessions) => {
  if (newSessions.length > 0) loadIcons(newSessions);
});

watch(selectedDate, fetchSessions);

onMounted(async () => {
  if (isToday.value) {
    await store.fetchTodayData();
    sessions.value = store.todaySessions;
  } else {
    await fetchSessions();
  }
});
</script>

<style scoped>
/* ... existing styles ... */
.timeline-controls {
  margin-bottom: 24px;
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

/* ... keep search-box, input, nav-btn styles similar but ensure premium look ... */
.search-input {
  width: 100%;
  padding: 12px 16px 12px 42px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-size: 0.95rem;
  transition: all 0.2s;
}
.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  background: var(--bg-tertiary);
}
.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.calendar-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--bg-secondary);
  padding: 6px 12px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.nav-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.nav-btn:hover:not(:disabled) {
  background: var(--bg-tertiary);
  color: var(--color-primary);
}
.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.date-display {
  text-align: center;
  min-width: 160px;
}
.date-main {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}
.date-sub {
  font-size: 0.75rem;
  color: var(--color-primary);
  font-weight: 500;
}

.date-picker-wrapper { position: relative; }
.date-input-hidden {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

/* Timeline */
.timeline-container { padding-left: 12px; }
.timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.timeline::before {
  content: '';
  position: absolute;
  left: 19px;
  top: 20px;
  bottom: 20px;
  width: 2px;
  background: var(--border-color);
  z-index: 0;
}

.timeline-item {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 24px;
  position: relative;
  z-index: 1;
}

.timeline-time {
  text-align: right;
  font-size: 0.85rem;
  color: var(--text-muted);
  padding-top: 10px;
  font-feature-settings: "tnum";
}

.timeline-content {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 16px;
  transition: all 0.2s;
  cursor: default;
}
.timeline-item:hover .timeline-content {
  border-color: var(--border-color-hover);
  transform: translateX(4px);
  box-shadow: var(--shadow-md);
}

.timeline-app {
  display: flex;
  align-items: center;
  gap: 16px;
}
.app-icon-img {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
  object-fit: cover;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
.app-icon-small {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.timeline-app-info { flex: 1; min-width: 0; }
.timeline-app-info .app-name {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 2px;
}
.window-title {
  font-size: 0.85rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.session-duration {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-primary);
  background: var(--bg-tertiary);
  padding: 4px 10px;
  border-radius: 20px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: #1e1e2e; /* Darker bg for premium feel */
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  width: 90%;
  max-width: 550px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
  animation: slideUp 0.3s ease;
  overflow: hidden;
}

.modal-header {
  padding: 20px 24px;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 24px;
  color: #6c7086;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}
.close-btn:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.sites-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.site-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255,255,255,0.03);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  transition: all 0.2s;
}
.site-item:hover {
  background: rgba(255,255,255,0.06);
}

.site-name {
  position: relative;
  z-index: 2;
  font-weight: 500;
  color: #cdd6f4;
  font-size: 0.95rem;
  max-width: 70%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.site-time {
  position: relative;
  z-index: 2;
  font-weight: 600;
  color: #89b4fa;
  font-size: 0.9rem;
  font-feature-settings: "tnum";
}

.site-bar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  background: #89b4fa;
  opacity: 0.5;
  border-radius: 0;
  z-index: 1;
  transition: width 0.5s ease;
}

/* Animations */
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.no-data {
  text-align: center;
  padding: 40px;
  color: #6c7086;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: var(--text-muted);
}
.empty-state svg {
  width: 64px;
  height: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}
</style>
