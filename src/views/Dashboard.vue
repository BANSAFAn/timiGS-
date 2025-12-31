<template>
  <div class="page">
    <div class="page-container">
      <div class="page-header">
        <h2>{{ $t('dashboard.title') }}</h2>
      </div>

      <!-- Active Now Card -->
      <div class="active-now-card">
        <div class="active-now-content">
          <div class="active-app-display">
            <div 
              class="active-app-icon" 
              :style="{ background: currentActivity && !appIcons[currentActivity.app_name] ? getAppGradient(currentActivity.app_name) : 'transparent' }"
            >
              <img 
                v-if="currentActivity && appIcons[currentActivity.app_name]" 
                :src="appIcons[currentActivity.app_name]" 
                class="app-icon-img"
              />
              <span v-else>
                {{ currentActivity ? currentActivity.app_name.charAt(0).toUpperCase() : '?' }}
              </span>
            </div>
            <div>
              <div class="active-label">{{ $t('dashboard.activeNow') }}</div>
              <div v-if="currentActivity" class="active-app-name">{{ currentActivity.app_name }}</div>
              <div v-else class="active-app-name idle">{{ $t('dashboard.idle') }}</div>
              <div v-if="currentActivity" class="active-window-title">{{ currentActivity.window_title }}</div>
            </div>
          </div>
          <div :class="['active-indicator', { idle: !currentActivity }]"></div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ formatDuration(store.totalTimeToday) }}</div>
          <div class="stat-label">{{ $t('dashboard.totalTime') }}</div>
        </div>
        <div class="stat-card accent-1">
          <div class="stat-value">{{ store.appCount }}</div>
          <div class="stat-label">{{ $t('dashboard.appsUsed') }}</div>
        </div>
        <div class="stat-card accent-2">
          <div class="stat-value">{{ store.sessionCount }}</div>
          <div class="stat-label">{{ $t('dashboard.sessions') }}</div>
        </div>
      </div>

      <!-- Today's Summary -->
      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">{{ $t('dashboard.topApps') }}</h3>
          </div>
          <div v-if="store.topApps.length > 0" class="app-list">
            <div v-for="app in store.topApps" :key="app.exe_path" class="app-item-enhanced">
              <div 
                class="app-icon" 
                :style="{ background: !appIcons[app.app_name] ? getAppGradient(app.app_name) : 'transparent' }"
              >
                 <img 
                  v-if="appIcons[app.app_name]" 
                  :src="appIcons[app.app_name]" 
                  class="app-icon-img"
                />
                <span v-else>{{ app.app_name.charAt(0).toUpperCase() }}</span>
              </div>
              <div class="app-info">
                <div class="app-name">{{ app.app_name }}</div>
                <div class="app-time">{{ formatDuration(app.total_seconds) }} · {{ app.session_count }} {{ $t('dashboard.sessions').toLowerCase() }}</div>
              </div>
              <div class="app-progress">
                <div 
                  class="app-progress-bar" 
                  :style="{ width: getProgressWidth(app.total_seconds) + '%', background: getAppGradient(app.app_name) }"
                ></div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>{{ $t('dashboard.noData') }}</p>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">{{ $t('dashboard.todaySummary') }}</h3>
            <div class="chart-type-switcher">
              <button 
                v-for="type in chartTypes" 
                :key="type.id"
                :class="['chart-type-btn', { active: selectedChartType === type.id }]"
                @click="selectedChartType = type.id"
              >
                <span v-html="type.icon"></span>
                {{ type.label }}
              </button>
            </div>
          </div>
          <div class="chart-container">
            <Doughnut v-if="chartData.labels.length > 0 && selectedChartType === 'doughnut'" :data="chartData" :options="doughnutOptions" />
            <Pie v-else-if="chartData.labels.length > 0 && selectedChartType === 'pie'" :data="chartData" :options="pieOptions" />
            <Bar v-else-if="chartData.labels.length > 0 && selectedChartType === 'bar'" :data="barChartData" :options="barOptions" />
            <div v-else class="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              <p>{{ $t('dashboard.noData') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { invoke } from '@tauri-apps/api/core';

import { useActivityStore } from '../stores/activity';
import { Doughnut, Pie, Bar } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const store = useActivityStore();
const currentActivity = ref(store.currentActivity);
const selectedChartType = ref('doughnut');
const appIcons = ref<Record<string, string>>({});

let intervalId: number | null = null;

const chartTypes = [
  { id: 'doughnut', label: 'Donut', icon: '○' },
  { id: 'pie', label: 'Pie', icon: '◐' },
  { id: 'bar', label: 'Bar', icon: '▮' }
];

const appGradients: Record<string, string> = {};
const gradientPalette = [
  'linear-gradient(135deg, #6366f1, #4f46e5)',
  'linear-gradient(135deg, #06b6d4, #0891b2)',
  'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  'linear-gradient(135deg, #ec4899, #db2777)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #f97316, #ea580c)',
];
let gradientIndex = 0;

function getAppGradient(appName: string): string {
  if (!appGradients[appName]) {
    appGradients[appName] = gradientPalette[gradientIndex % gradientPalette.length];
    gradientIndex++;
  }
  return appGradients[appName];
}

const chartColors = ['#6366f1', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#f97316'];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

function getProgressWidth(seconds: number): number {
  if (store.totalTimeToday === 0) return 0;
  return Math.round((seconds / store.totalTimeToday) * 100);
}

const chartData = computed(() => ({
  labels: store.topApps.map(app => app.app_name),
  datasets: [{
    data: store.topApps.map(app => app.total_seconds),
    backgroundColor: chartColors.slice(0, store.topApps.length),
    borderWidth: 0,
    hoverOffset: 10
  }]
}));

const barChartData = computed(() => ({
  labels: store.topApps.map(app => app.app_name),
  datasets: [{
    data: store.topApps.map(app => Math.round(app.total_seconds / 60)),
    backgroundColor: chartColors.slice(0, store.topApps.length),
    borderRadius: 8,
    borderSkipped: false,
  }]
}));

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { color: '#94a3b8', padding: 16, usePointStyle: true, font: { size: 12 } }
    },
    tooltip: {
      callbacks: {
        label: (context: any) => ` ${formatDuration(context.raw)}`
      }
    }
  }
};

// ... reuse pieOptions and barOptions if needed, referencing same style ... 
// (Simplifying for brevity in implementation block, assuming existing options work)
const pieOptions = { ...doughnutOptions, cutout: '0%' };
const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94a3b8' } },
    y: { grid: { display: false }, ticks: { color: '#94a3b8' } }
  }
};

async function loadIcon(appName: string, path: string) {
  if (appIcons.value[appName] || !path) return;
  try {
    // Only try loading if we haven't tried (or succeeded) yet. 
    // Using appName as key because we show icon by app name, but fetch by path.
    // If multiple apps share same name but different path, likely same icon.
    // Actually, store uses exe_path.
    
    // Check if path is valid (simple check)
    if (path.length < 3) return;

    const base64 = await invoke<string | null>('get_app_icon', { path });
    if (base64) {
      appIcons.value[appName] = `data:image/png;base64,${base64}`;
    }
  } catch (e) {
    // Fail silently
  }
}

async function refreshData() {
  await store.fetchCurrentActivity();
  currentActivity.value = store.currentActivity;
  if (currentActivity.value?.exe_path) {
    loadIcon(currentActivity.value.app_name, currentActivity.value.exe_path);
  }
  
  await store.fetchTodayData();
  // Load icons for top apps
  store.topApps.forEach(app => {
    loadIcon(app.app_name, app.exe_path);
  });
}

onMounted(async () => {
  await refreshData();
  intervalId = window.setInterval(refreshData, 2000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>

<style scoped>
.active-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.active-app-name.idle {
  color: var(--text-muted);
}


.active-now-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-icon-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 4px; /* Slight padding inside the box */
}

</style>
