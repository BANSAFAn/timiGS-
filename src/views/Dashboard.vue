<template>
  <div class="page page-shell">
    <div class="page-container">
      <div class="page-header">
        <h2>{{ $t("dashboard.title") }}</h2>
        <p class="text-muted">{{ currentDate }}</p>
      </div>

      <!-- Active Now Card -->
      <div class="glass-card active-now-card animate-enter">
        <div class="active-now-bg"></div>
        <div class="active-now-content">
          <div class="active-icon-wrapper">
             <img 
               v-if="currentActivity?.app_name && appIcons[currentActivity.app_name]" 
               :src="appIcons[currentActivity.app_name]" 
               class="app-icon-img"
             />
             <div v-else class="app-icon-placeholder">
               {{ currentActivity?.app_name?.charAt(0) || '?' }}
             </div>
          </div>
          <div class="active-details">
            <span class="status-badge">
              <span class="status-dot"></span>
              {{ $t("dashboard.activeNow") }}
            </span>
            <h2 class="active-app-title">
              {{ currentActivity ? currentActivity.app_name : $t("dashboard.idle") }}
            </h2>
            <p class="active-window-title" v-if="currentActivity">
              {{ currentActivity.window_title }}
            </p>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid animate-enter" style="animation-delay: 0.1s">
        <!-- Total Time -->
        <div class="glass-card stat-card">
          <div class="stat-icon primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">{{ $t("dashboard.totalTime") }}</span>
            <div class="stat-value">{{ formatDuration(store.totalTimeToday) }}</div>
          </div>
        </div>

        <!-- Apps Used -->
        <div class="glass-card stat-card">
          <div class="stat-icon accent">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">{{ $t("dashboard.appsUsed") }}</span>
            <div class="stat-value">{{ store.appCount }}</div>
          </div>
        </div>

        <!-- Sessions -->
        <div class="glass-card stat-card">
          <div class="stat-icon success">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div class="stat-info">
            <span class="stat-label">{{ $t("dashboard.sessions") }}</span>
            <div class="stat-value">{{ store.sessionCount }}</div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="dashboard-grid animate-enter" style="animation-delay: 0.2s">
        
        <!-- Top Apps List -->
        <div class="glass-card">
          <div class="card-header">
            <h3 class="card-title">{{ $t("dashboard.topApps") }}</h3>
          </div>

          <div class="app-list" v-if="store.topApps.length > 0">
            <div v-for="(app, index) in store.topApps.slice(0, 5)" :key="app.app_name" class="app-row">
              <div class="app-rank">{{ index + 1 }}</div>
              <div class="app-icon-small">
                 <img v-if="appIcons[app.app_name]" :src="appIcons[app.app_name]" />
                 <span v-else>{{ app.app_name.charAt(0) }}</span>
              </div>
              <div class="app-details">
                <span class="app-name">{{ app.app_name }}</span>
                <span class="app-sessions">{{ app.session_count }} sessions</span>
              </div>
              <div class="app-meta">
                <span class="app-duration">{{ formatDuration(app.total_seconds) }}</span>
                <div class="progress-bg">
                  <div class="progress-fill" :style="{ width: getProgressWidth(app.total_seconds) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>No activity recorded today.</p>
          </div>
        </div>

        <!-- Charts -->
        <div class="glass-card">
          <div class="card-header">
             <h3 class="card-title">{{ $t("dashboard.todaySummary") }}</h3>
             <div class="chart-toggles">
               <button 
                 @click="selectedChartType = 'doughnut'" 
                 :class="{ active: selectedChartType === 'doughnut' }"
                 class="icon-btn"
               >
                 ◕
               </button>
               <button 
                  @click="selectedChartType = 'bar'" 
                  :class="{ active: selectedChartType === 'bar' }"
                  class="icon-btn"
               >
                 llı
               </button>
             </div>
          </div>
          <div class="chart-wrapper">
             <Doughnut
              v-if="selectedChartType === 'doughnut' && chartData.labels.length"
              :data="chartData"
              :options="doughnutOptions"
            />
            <Bar
              v-else-if="selectedChartType === 'bar' && chartData.labels.length"
              :data="barChartData"
              :options="barOptions"
            />
             <div v-else class="empty-chart">
               <p>Not enough data to graph.</p>
             </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { useActivityStore } from "../stores/activity";
import { Doughnut, Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const store = useActivityStore();
const currentActivity = computed(() => store.currentActivity);
const selectedChartType = ref("doughnut");
const appIcons = ref<Record<string, string>>({});
const currentDate = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

let intervalId: number | null = null;

const chartColors = [
  "#6366f1", "#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#f97316"
];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function getProgressWidth(seconds: number): number {
  if (store.totalTimeToday === 0) return 0;
  return Math.min(100, Math.round((seconds / store.totalTimeToday) * 100));
}

// Chart Data
const chartData = computed(() => ({
  labels: store.topApps.slice(0, 5).map(app => app.app_name),
  datasets: [{
    data: store.topApps.slice(0, 5).map(app => app.total_seconds),
    backgroundColor: chartColors,
    borderWidth: 0,
    hoverOffset: 10
  }]
}));

const barChartData = computed(() => ({
  labels: store.topApps.slice(0, 5).map(app => app.app_name),
  datasets: [{
    data: store.topApps.slice(0, 5).map(app => Math.round(app.total_seconds / 60)),
    backgroundColor: chartColors,
    borderRadius: 6
  }]
}));

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '75%',
  plugins: {
    legend: { position: 'bottom' as const, labels: { color: '#94a3b8', usePointStyle: true, boxWidth: 8 } }
  }
};

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
    y: { display: false }
  }
};

// Icons
async function loadIcon(appName: string, path: string) {
  if (appIcons.value[appName] || !path) return;
  try {
     const base64 = await invoke<string | null>("get_app_icon", { path });
     if (base64) appIcons.value[appName] = `data:image/png;base64,${base64}`;
  } catch {}
}

async function refreshData() {
  await store.fetchCurrentActivity();
  if (store.currentActivity?.exe_path) {
    loadIcon(store.currentActivity.app_name, store.currentActivity.exe_path);
  }
  await store.fetchTodayData();
  store.topApps.forEach(app => loadIcon(app.app_name, app.exe_path));
}

onMounted(() => {
  refreshData();
  intervalId = window.setInterval(refreshData, 5000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

.text-muted { color: var(--text-muted); }

/* Active Now Card */
.active-now-card {
  position: relative;
  overflow: hidden;
  padding: 32px;
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.active-now-bg {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent 60%);
  z-index: 0;
}

.active-now-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 24px;
  width: 100%;
}

.active-icon-wrapper {
  width: 64px;
  height: 64px;
  background: var(--bg-hover);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-glass);
}

.app-icon-img { width: 48px; height: 48px; object-fit: contain; }
.app-icon-placeholder { font-size: 24px; font-weight: bold; color: var(--color-primary); }

.active-details { flex: 1; }

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.status-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--color-success);
  box-shadow: 0 0 8px var(--color-success);
  animation: pulse 2s infinite;
}

.active-app-title { font-size: 2rem; font-weight: 700; margin-bottom: 4px; line-height: 1.1; }
.active-window-title { color: var(--text-muted); font-size: 0.9rem; max-width: 600px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}

.stat-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-hover);
}

.stat-icon.primary { color: var(--color-primary); background: rgba(99,102,241,0.1); }
.stat-icon.accent { color: var(--color-accent); background: rgba(6,182,212,0.1); }
.stat-icon.success { color: var(--color-success); background: rgba(16,185,129,0.1); }

.stat-label { font-size: 0.85rem; color: var(--text-muted); display: block; margin-bottom: 4px; }
.stat-value { font-size: 1.5rem; font-weight: 700; }

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
}

/* App List */
.app-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}
.app-row:last-child { border-bottom: none; }

.app-rank { width: 24px; font-weight: bold; color: var(--text-muted); font-size: 0.9rem; text-align: center; margin-right: 8px; }
.app-icon-small { width: 32px; height: 32px; border-radius: 8px; background: var(--bg-hover); display: flex; align-items: center; justify-content: center; margin-right: 12px; }
.app-icon-small img { width: 24px; height: 24px; object-fit: contain; }
.app-details { flex: 1; }
.app-name { display: block; font-weight: 600; font-size: 0.95rem; }
.app-sessions { font-size: 0.8rem; color: var(--text-muted); }
.app-meta { text-align: right; }
.app-duration { font-weight: 600; font-size: 0.9rem; display: block; margin-bottom: 4px; }
.progress-bg { width: 80px; height: 4px; background: var(--bg-hover); border-radius: 2px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--color-primary); border-radius: 2px; }

/* Chart Toggles */
.chart-toggles { display: flex; gap: 8px; }
.icon-btn { padding: 4px 8px; border: none; background: transparent; color: var(--text-muted); cursor: pointer; border-radius: 4px; font-size: 1.2rem; }
.icon-btn.active { background: var(--bg-hover); color: var(--color-primary); }
.chart-wrapper { height: 250px; position: relative; }

/* Mobile */
@media (max-width: 900px) {
  .stats-grid { grid-template-columns: 1fr; }
  .dashboard-grid { grid-template-columns: 1fr; }
  .active-now-card { flex-direction: column; text-align: center; }
  .active-now-content { flex-direction: column; }
}
</style>
