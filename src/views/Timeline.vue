<template>
  <div class="page">
    <div class="page-container">
      <div class="page-header">
        <h2>{{ $t('timeline.title') }}</h2>
      </div>

    <div class="timeline-controls">
      <div class="date-nav">
        <button class="btn btn-secondary" @click="goToPreviousDay">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div class="current-date">
          <span class="date-label">{{ getDateLabel() }}</span>
          <span class="date-value">{{ formatDate(selectedDate) }}</span>
        </div>
        <button class="btn btn-secondary" @click="goToNextDay" :disabled="isToday">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
      <input type="date" class="form-control date-picker" v-model="dateInput" @change="onDateChange" />
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
const sessions = ref<ActivitySession[]>([]);

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
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  gap: 16px;
}

.date-nav {
  display: flex;
  align-items: center;
  gap: 16px;
}

.current-date {
  text-align: center;
}

.date-label {
  display: block;
  font-size: 0.875rem;
  color: var(--color-primary);
  font-weight: 600;
}

.date-value {
  font-size: 1.125rem;
  font-weight: 500;
}

.date-picker {
  width: auto;
  max-width: 180px;
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
