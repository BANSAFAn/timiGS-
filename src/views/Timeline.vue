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
              <div class="app-icon-small" :style="{ background: getAppColor(session.app_name) }">
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
import { useActivityStore, type ActivitySession } from '../stores/activity';

const { t } = useI18n();
const store = useActivityStore();

const selectedDate = ref(new Date());
const dateInput = ref(formatDateForInput(new Date()));
const dateInputRef = ref<HTMLInputElement | null>(null);
const sessions = ref<ActivitySession[]>([]);
const searchQuery = ref('');

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

watch(selectedDate, fetchSessions);

onMounted(async () => {
  // For today, use the store's data
  if (isToday.value) {
    await store.fetchTodayData();
    sessions.value = store.todaySessions;
  } else {
    await fetchSessions();
  }
});
</script>

<style scoped>
.timeline-controls {
  margin-bottom: 24px;
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 250px;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 42px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  font-size: 0.95rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
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
  gap: 16px;
  background: var(--bg-secondary);
  padding: 8px 16px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.nav-btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  color: var(--text-muted);
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--primary);
  border-color: var(--primary-dark);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.date-display {
  text-align: center;
  min-width: 200px;
}

.date-main {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.date-sub {
  font-size: 0.875rem;
  color: var(--primary);
  font-weight: 500;
}

.date-picker-wrapper {
  position: relative;
}

.date-input-hidden {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: -1;
}

.timeline-container {
  padding-left: 12px;
}

.app-icon-small {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  color: white;
  flex-shrink: 0;
}

.timeline-app {
  display: flex;
  align-items: center;
  gap: 12px;
}

.timeline-app-info {
  flex: 1;
  min-width: 0;
}

.timeline-app-info .app-name {
  font-weight: 600;
}

.window-title {
  font-size: 0.875rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-duration {
  font-weight: 600;
  color: var(--color-primary);
  white-space: nowrap;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--text-muted);
  cursor: pointer;
}

.close-btn:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.sites-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.site-item {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  padding: 8px 0;
}

.site-name {
  flex: 1;
  z-index: 1;
  font-weight: 500;
  color: var(--text-primary);
}

.site-time {
  z-index: 1;
  font-weight: 600;
  color: var(--color-primary);
}

.site-bar {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: var(--bg-tertiary);
  opacity: 0.5;
  border-radius: var(--radius-sm);
  z-index: 0;
}

.is-clickable {
  cursor: pointer;
  position: relative;
}

.is-clickable::after {
  content: '🔎';
  position: absolute;
  right: -25px;
  opacity: 0;
  transition: opacity 0.2s;
}

.timeline-item:hover .is-clickable::after {
  opacity: 1;
}

.no-data {
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
}
</style>
