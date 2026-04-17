<template>
  <div class="page timeline-page">
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
          <button class="nav-btn calendar-btn" :class="{ 'active': showCalendar }" @click="showCalendar = !showCalendar">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </button>
          
          <!-- Custom Calendar Dropdown -->
          <div v-if="showCalendar" class="calendar-dropdown" @click.stop>
            <CustomCalendar 
              v-model="selectedDate" 
              :sessions-by-date="sessionsByDate"
              @update:modelValue="onDateSelected"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="timeline-container">
      <div v-if="groupedSessions.length > 0" class="timeline">
        <div v-for="group in groupedSessions" :key="group.appName" class="timeline-group">
          <div class="timeline-group-header" @click="toggleGroup(group.appName)">
            <div class="group-toggle">
              <svg :class="{ 'rotated': expandedGroups.has(group.appName) }" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <img v-if="appIcons[group.exePath]" :src="appIcons[group.exePath]" class="app-icon-img" :alt="group.appName" />
            <div v-else class="app-icon-small" :style="{ background: getAppColor(group.appName) }">
              {{ group.appName.charAt(0).toUpperCase() }}
            </div>
            <div class="group-info">
              <div class="group-app-name">
                {{ group.appName }}
                <span v-if="isExcluded(group.exePath)" class="excluded-badge">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                  </svg>
                  {{ $t('timeline.notTracked') || 'Not Tracked' }}
                  <span class="excluded-hint">— {{ $t('timeline.notTrackedHint') || 'was opened but not tracked' }}</span>
                </span>
              </div>
              <div class="group-meta">
                <span class="group-sessions-count">{{ group.sessions.length }} {{ group.sessions.length === 1 ? 'session' : 'sessions' }}</span>
                <span class="group-separator">•</span>
                <span class="group-total-time">{{ formatDuration(group.totalTime) }} total</span>
              </div>
            </div>
            <div class="group-duration">
              {{ formatDuration(group.totalTime) }}
            </div>
          </div>
          
          <div v-show="expandedGroups.has(group.appName)" class="timeline-group-sessions">
            <div v-for="session in group.sessions" :key="session.id" class="timeline-item" @click="handleSessionClick(session)">
              <div class="timeline-time">
                {{ formatTime(session.start_time) }} - {{ session.end_time ? formatTime(session.end_time) : 'Now' }}
              </div>
              <div class="timeline-content">
                <div class="timeline-app" :class="{ 'is-clickable': isBrowser(session.app_name) }">
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { invoke } from '@tauri-apps/api/core';
import { useActivityStore, type ActivitySession } from '../stores/activity';
import CustomCalendar from '../components/CustomCalendar.vue';

const { t } = useI18n();
const store = useActivityStore();

const selectedDate = ref(new Date());
const showCalendar = ref(false);
const sessions = ref<ActivitySession[]>([]);
const searchQuery = ref('');
const appIcons = ref<Record<string, string>>({});
const expandedGroups = ref<Set<string>>(new Set());

// Group sessions by app
interface SessionGroup {
  appName: string;
  exePath: string;
  sessions: ActivitySession[];
  totalTime: number;
}

const groupedSessions = computed(() => {
  const sessionList = searchQuery.value ? filteredSessions.value : sessions.value;
  
  // Group by app name and exe path
  const groups: Map<string, SessionGroup> = new Map();
  
  sessionList.forEach(session => {
    const key = `${session.app_name}|${session.exe_path}`;
    
    if (!groups.has(key)) {
      groups.set(key, {
        appName: session.app_name,
        exePath: session.exe_path,
        sessions: [],
        totalTime: 0
      });
    }
    
    const group = groups.get(key)!;
    group.sessions.push(session);
    group.totalTime += session.duration_seconds;
  });
  
  // Convert to array and sort by total time
  return Array.from(groups.values())
    .sort((a, b) => b.totalTime - a.totalTime);
});

function toggleGroup(appName: string) {
  const newSet = new Set(expandedGroups.value);
  if (newSet.has(appName)) {
    newSet.delete(appName);
  } else {
    newSet.add(appName);
  }
  expandedGroups.value = newSet;
}

function isExcluded(exePath: string): boolean {
  return store.isProcessExcluded(exePath);
}

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

// Sessions by date for calendar indicators
const sessionsByDate = computed(() => {
  const map: Record<string, boolean> = {};
  sessions.value.forEach(session => {
    const dateStr = session.start_time.split('T')[0];
    map[dateStr] = true;
  });
  return map;
});

function onDateSelected(date: Date) {
  selectedDate.value = date;
  showCalendar.value = false;
}

// Close calendar when clicking outside
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.date-picker-wrapper')) {
    showCalendar.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

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
}

function goToNextDay() {
  if (!isToday.value) {
    const newDate = new Date(selectedDate.value);
    newDate.setDate(newDate.getDate() + 1);
    selectedDate.value = newDate;
  }
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
  await store.fetchExcludedProcesses();
  if (isToday.value) {
    await store.fetchTodayData();
    sessions.value = store.todaySessions;
  } else {
    await fetchSessions();
  }
});
</script>

<style scoped>
/* Page Layout */
.page {
  padding-bottom: 40px;
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 8px;
}

/* Timeline Controls */
.timeline-controls {
  margin-bottom: 24px;
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

/* Search Box */
.search-box {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 44px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-main);
  font-size: 0.95rem;
  transition: var(--transition-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(91, 110, 225, 0.1);
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

/* Calendar Nav */
.calendar-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-secondary);
  padding: 6px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
}

.nav-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-fast);
}

.nav-btn:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--color-primary);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.date-display {
  text-align: center;
  min-width: 180px;
  padding: 0 8px;
}

.date-main {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-main);
}

.date-sub {
  font-size: 0.75rem;
  color: var(--color-primary);
  font-weight: 500;
}

.date-picker-wrapper {
  position: relative;
}

.calendar-btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-muted);
}

.calendar-btn:hover,
.calendar-btn.active {
  background: var(--bg-hover);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

/* Calendar Dropdown */
.calendar-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 100;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.date-picker-wrapper {
  position: relative;
}

/* Timeline Container */
.timeline-container {
  padding-left: 8px;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

/* Timeline Group */
.timeline-group {
  position: relative;
  z-index: 1;
}

.timeline-group-header {
  display: grid;
  grid-template-columns: 40px 40px 1fr auto;
  gap: 12px;
  align-items: center;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 14px 16px;
  cursor: pointer;
  transition: var(--transition-fast);
}

.timeline-group-header:hover {
  border-color: var(--color-primary);
  background: var(--bg-secondary);
  box-shadow: var(--shadow-sm);
}

.group-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.group-toggle svg {
  transition: transform 0.3s ease;
}

.group-toggle svg.rotated {
  transform: rotate(180deg);
}

.group-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.group-app-name {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.excluded-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-danger);
  background: rgba(239, 68, 68, 0.1);
  padding: 3px 8px;
  border-radius: 12px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.excluded-hint {
  text-transform: none;
  letter-spacing: 0;
  font-weight: 400;
  font-size: 0.7rem;
  color: var(--color-danger);
  opacity: 0.7;
}

.group-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.group-sessions-count {
  font-weight: 500;
}

.group-separator {
  opacity: 0.5;
}

.group-total-time {
  color: var(--color-primary);
  font-weight: 500;
}

.group-duration {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-primary);
  background: var(--bg-tertiary);
  padding: 4px 12px;
  border-radius: 20px;
}

/* Timeline Group Sessions */
.timeline-group-sessions {
  margin-top: 8px;
  padding-left: 52px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Timeline Item */
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
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 12px 16px;
  transition: var(--transition-fast);
  cursor: default;
}

.timeline-item:hover .timeline-content {
  border-color: var(--color-primary);
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
  border-radius: var(--radius-md);
  flex-shrink: 0;
  object-fit: cover;
  box-shadow: var(--shadow-sm);
}

.app-icon-small {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  color: white;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.timeline-app-info {
  flex: 1;
  min-width: 0;
}

.timeline-app-info .app-name {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 2px;
  color: var(--text-main);
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
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  width: 90%;
  max-width: 550px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.3s ease;
  overflow: hidden;
}

.modal-header {
  padding: 20px 24px;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-main);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 24px;
  color: var(--text-muted);
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: var(--transition-fast);
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-main);
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
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  position: relative;
  overflow: hidden;
  transition: var(--transition-fast);
}

.site-item:hover {
  background: var(--bg-hover);
}

.site-name {
  position: relative;
  z-index: 2;
  font-weight: 500;
  color: var(--text-main);
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
  color: var(--color-primary);
  font-size: 0.9rem;
  font-feature-settings: "tnum";
}

.site-bar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  background: var(--color-primary);
  opacity: 0.5;
  z-index: 1;
  transition: width 0.5s ease;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.no-data {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
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

/* Responsive */

/* 4K Ultra Wide (2560px+) */
@media (min-width: 2560px) {
  .page-container {
    max-width: 1800px;
  }

  .page-header h2 {
    font-size: 2.5rem;
  }

  .search-input {
    padding: 16px 20px 16px 52px;
    font-size: 1.1rem;
  }

  .search-icon {
    width: 24px;
    height: 24px;
    left: 18px;
  }

  .calendar-nav {
    padding: 10px;
    gap: 12px;
  }

  .nav-btn {
    width: 48px;
    height: 48px;
  }

  .nav-btn svg {
    width: 28px;
    height: 28px;
  }

  .date-display {
    min-width: 280px;
    padding: 0 16px;
  }

  .date-main {
    font-size: 1.2rem;
  }

  .date-sub {
    font-size: 0.95rem;
  }

  .timeline-group-header {
    padding: 20px 24px;
    gap: 16px;
  }

  .group-app-name {
    font-size: 1.2rem;
  }

  .group-meta {
    font-size: 0.95rem;
  }

  .group-duration {
    font-size: 1.1rem;
    padding: 6px 16px;
  }

  .timeline-item {
    grid-template-columns: 140px 1fr;
    gap: 32px;
  }

  .timeline-time {
    font-size: 1rem;
    padding-top: 14px;
  }

  .timeline-content {
    padding: 16px 20px;
  }

  .timeline-app-info .app-name {
    font-size: 1.1rem;
  }

  .window-title {
    font-size: 0.95rem;
  }

  .session-duration {
    font-size: 1rem;
    padding: 6px 14px;
  }

  .app-icon-img {
    width: 48px;
    height: 48px;
  }

  .app-icon-small {
    width: 48px;
    height: 48px;
    font-size: 1.3rem;
  }
}

/* Large Desktop (1920px - 2560px) */
@media (min-width: 1920px) and (max-width: 2559px) {
  .page-container {
    max-width: 1600px;
  }

  .timeline-group-header {
    padding: 18px 20px;
  }

  .timeline-item {
    grid-template-columns: 130px 1fr;
  }
}

/* Medium Desktop (1440px - 1920px) */
@media (min-width: 1440px) and (max-width: 1919px) {
  .page-container {
    max-width: 1400px;
  }
}

/* Tablet Landscape (1024px - 1440px) */
@media (min-width: 1024px) and (max-width: 1439px) {
  .page-container {
    max-width: 1000px;
  }

  .search-box {
    min-width: 200px;
  }

  .timeline-group-header {
    padding: 14px 16px;
  }
}

/* Tablet Portrait (768px - 1024px) */
@media (max-width: 1024px) {
  .page-container {
    max-width: 90%;
  }

  .search-box {
    min-width: 180px;
  }

  .timeline-controls {
    gap: 12px;
  }
}

/* Small Tablet (600px - 768px) */
@media (max-width: 768px) {
  .timeline-controls {
    flex-direction: column;
  }

  .search-box {
    width: 100%;
    min-width: auto;
  }

  .calendar-nav {
    width: 100%;
    justify-content: space-between;
  }

  .date-display {
    min-width: auto;
    flex: 1;
  }

  .timeline-group-header {
    grid-template-columns: 32px 32px 1fr;
  }

  .group-duration {
    display: none;
  }

  .timeline-item {
    grid-template-columns: 80px 1fr;
  }

  .calendar-dropdown {
    position: fixed;
    top: 50%;
    left: 50%;
    right: auto;
    transform: translate(-50%, -50%);
    z-index: 1000;
  }
}

/* Mobile Large (480px - 600px) */
@media (max-width: 600px) {
  .page-container {
    max-width: 100%;
    padding: 0 12px;
  }

  .page-header {
    margin-bottom: 16px;
  }

  .page-header h2 {
    font-size: 1.3rem;
  }

  .search-input {
    padding: 10px 14px 10px 40px;
    font-size: 0.9rem;
  }

  .search-icon {
    width: 16px;
    height: 16px;
    left: 12px;
  }

  .calendar-nav {
    padding: 4px;
    gap: 4px;
  }

  .nav-btn {
    width: 32px;
    height: 32px;
  }

  .nav-btn svg {
    width: 16px;
    height: 16px;
  }

  .date-display {
    min-width: 120px;
    padding: 0 6px;
  }

  .date-main {
    font-size: 0.85rem;
  }

  .date-sub {
    font-size: 0.7rem;
  }

  .timeline::before {
    left: 15px;
  }

  .timeline-group-header {
    grid-template-columns: 28px 28px 1fr;
    padding: 10px 12px;
    gap: 8px;
  }

  .group-toggle svg {
    width: 16px;
    height: 16px;
  }

  .app-icon-img {
    width: 32px;
    height: 32px;
  }

  .app-icon-small {
    width: 32px;
    height: 32px;
    font-size: 0.95rem;
  }

  .group-app-name {
    font-size: 0.9rem;
  }

  .group-meta {
    font-size: 0.75rem;
  }

  .timeline-group-sessions {
    padding-left: 40px;
  }

  .timeline-item {
    grid-template-columns: 70px 1fr;
    gap: 16px;
  }

  .timeline-time {
    font-size: 0.75rem;
    padding-top: 8px;
  }

  .timeline-content {
    padding: 10px 12px;
  }

  .timeline-app-info .app-name {
    font-size: 0.9rem;
  }

  .window-title {
    font-size: 0.8rem;
  }

  .session-duration {
    font-size: 0.8rem;
    padding: 4px 8px;
  }

  .modal-content {
    width: 95%;
    max-width: 95%;
  }

  .modal-header {
    padding: 14px 16px;
  }

  .modal-header h3 {
    font-size: 1rem;
  }

  .modal-body {
    padding: 14px;
  }

  .site-item {
    padding: 10px 12px;
  }

  .site-name {
    font-size: 0.85rem;
  }

  .site-time {
    font-size: 0.8rem;
  }
}

/* Mobile Small (320px - 480px) */
@media (max-width: 480px) {
  .page-container {
    padding: 0 10px;
  }

  .page-header h2 {
    font-size: 1.2rem;
  }

  .search-input {
    padding: 9px 12px 9px 36px;
    font-size: 0.85rem;
  }

  .search-icon {
    width: 14px;
    height: 14px;
    left: 10px;
  }

  .calendar-nav {
    padding: 3px;
    gap: 3px;
  }

  .nav-btn {
    width: 28px;
    height: 28px;
  }

  .nav-btn svg {
    width: 14px;
    height: 14px;
  }

  .date-display {
    min-width: 100px;
    padding: 0 4px;
  }

  .date-main {
    font-size: 0.8rem;
  }

  .date-sub {
    font-size: 0.65rem;
  }

  .timeline::before {
    left: 13px;
  }

  .timeline-group-header {
    grid-template-columns: 24px 24px 1fr;
    padding: 8px 10px;
    gap: 6px;
  }

  .group-toggle svg {
    width: 14px;
    height: 14px;
  }

  .app-icon-img {
    width: 28px;
    height: 28px;
  }

  .app-icon-small {
    width: 28px;
    height: 28px;
    font-size: 0.85rem;
  }

  .group-app-name {
    font-size: 0.85rem;
  }

  .excluded-badge {
    font-size: 0.6rem;
    padding: 2px 6px;
  }

  .group-meta {
    font-size: 0.7rem;
  }

  .timeline-group-sessions {
    padding-left: 36px;
    gap: 8px;
  }

  .timeline-item {
    grid-template-columns: 60px 1fr;
    gap: 12px;
  }

  .timeline-time {
    font-size: 0.7rem;
    padding-top: 6px;
  }

  .timeline-content {
    padding: 8px 10px;
  }

  .timeline-app-info .app-name {
    font-size: 0.85rem;
  }

  .window-title {
    font-size: 0.75rem;
  }

  .session-duration {
    font-size: 0.75rem;
    padding: 3px 7px;
  }

  .modal-content {
    width: 98%;
    max-width: 98%;
    border-radius: 12px;
  }

  .modal-header {
    padding: 12px 14px;
  }

  .modal-header h3 {
    font-size: 0.95rem;
  }

  .modal-body {
    padding: 12px;
  }

  .site-item {
    padding: 8px 10px;
  }

  .site-name {
    font-size: 0.8rem;
  }

  .site-time {
    font-size: 0.75rem;
  }

  .empty-state {
    padding: 40px 0;
  }

  .empty-state svg {
    width: 48px;
    height: 48px;
  }

  .empty-state p {
    font-size: 0.85rem;
  }
}

/* Extra Small Mobile (below 360px) */
@media (max-width: 360px) {
  .page-container {
    padding: 0 8px;
  }

  .page-header h2 {
    font-size: 1.1rem;
  }

  .search-input {
    padding: 8px 10px 8px 32px;
    font-size: 0.8rem;
  }

  .search-icon {
    width: 12px;
    height: 12px;
    left: 8px;
  }

  .calendar-nav {
    padding: 2px;
    gap: 2px;
  }

  .nav-btn {
    width: 26px;
    height: 26px;
  }

  .nav-btn svg {
    width: 12px;
    height: 12px;
  }

  .date-display {
    min-width: 90px;
  }

  .date-main {
    font-size: 0.75rem;
  }

  .timeline-group-header {
    grid-template-columns: 22px 22px 1fr;
    padding: 6px 8px;
  }

  .app-icon-img {
    width: 24px;
    height: 24px;
  }

  .app-icon-small {
    width: 24px;
    height: 24px;
    font-size: 0.75rem;
  }

  .group-app-name {
    font-size: 0.8rem;
  }

  .timeline-item {
    grid-template-columns: 55px 1fr;
  }

  .timeline-time {
    font-size: 0.65rem;
  }

  .timeline-content {
    padding: 6px 8px;
  }

  .timeline-app-info .app-name {
    font-size: 0.8rem;
  }

  .window-title {
    font-size: 0.7rem;
  }
}
</style>
