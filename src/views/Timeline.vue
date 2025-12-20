<template>
  <div class="page">
    <div class="page-container">
      <div class="page-header">
        <h2>{{ $t('timeline.title') }}</h2>
      </div>

    <div class="timeline-controls">
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
      <div v-if="sessions.length > 0" class="timeline">
        <div v-for="session in sessions" :key="session.id" class="timeline-item">
          <div class="timeline-time">
            {{ formatTime(session.start_time) }} - {{ session.end_time ? formatTime(session.end_time) : 'Now' }}
          </div>
          <div class="timeline-content">
            <div class="timeline-app">
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
        <p>{{ $t('timeline.noSessions') }}</p>
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
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (selectedDate.value.toDateString() === today.toDateString()) {
    return t('timeline.today');
  }
  if (selectedDate.value.toDateString() === yesterday.toDateString()) {
    return t('timeline.yesterday');
  }
  return '';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
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
}

.calendar-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: var(--bg-secondary);
  padding: 12px 24px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
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
</style>
