<template>
  <div class="page page-shell dashboard-page">
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h2>{{ $t("dashboard.title") }}</h2>
          <p class="subtitle">{{ currentDate }}</p>
        </div>
        <div class="header-right">
          <div class="tracking-pill" :class="{ active: store.isTracking }">
            <span class="tracking-dot"></span>
            <span>{{ store.isTracking ? 'Tracking' : 'Paused' }}</span>
          </div>
        </div>
      </div>

      <!-- Active Now Hero Card -->
      <div class="hero-card animate-enter">
        <div class="hero-bg">
          <div class="hero-gradient"></div>
          <div class="hero-pattern"></div>
        </div>
        
        <div class="hero-content">
          <div class="active-section">
            <div class="active-icon-box">
              <img 
                v-if="currentActivity?.app_name && appIcons[currentActivity.app_name]" 
                :src="appIcons[currentActivity.app_name]" 
                class="app-icon-img"
              />
              <div v-else class="app-icon-fallback">
                {{ currentActivity?.app_name?.charAt(0) || '?' }}
              </div>
            </div>
            
            <div class="active-info">
              <div class="status-row">
                <span class="status-badge">
                  <span class="status-pulse"></span>
                  {{ $t("dashboard.activeNow") }}
                </span>
              </div>
              <h2 class="active-app">
                {{ currentActivity ? currentActivity.app_name : $t("dashboard.idle") }}
              </h2>
              <p class="active-window" v-if="currentActivity">
                {{ currentActivity.window_title }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats-row animate-enter" style="animation-delay: 0.1s">
        <!-- Total Time -->
        <div class="stat-card">
          <div class="stat-icon-box primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">{{ $t("dashboard.totalTime") }}</span>
            <div class="stat-value-row">
              <span class="stat-value">{{ formatDuration(store.totalTimeToday) }}</span>
            </div>
          </div>
        </div>

        <!-- Apps Used -->
        <div class="stat-card">
          <div class="stat-icon-box accent">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">{{ $t("dashboard.appsUsed") }}</span>
            <div class="stat-value-row">
              <span class="stat-value">{{ store.appCount }}</span>
            </div>
          </div>
        </div>

        <!-- Sessions -->
        <div class="stat-card">
          <div class="stat-icon-box success">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-label">{{ $t("dashboard.sessions") }}</span>
            <div class="stat-value-row">
              <span class="stat-value">{{ store.sessionCount }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Grid -->
      <div class="main-grid animate-enter" style="animation-delay: 0.2s">
        <!-- Top Apps -->
        <div class="grid-card apps-card">
          <div class="card-header">
            <h3>{{ $t("dashboard.topApps") }}</h3>
            <span class="header-badge">Today</span>
          </div>

          <div class="app-list" v-if="store.topApps.length > 0">
            <div v-for="(app, index) in store.topApps.slice(0, 5)" :key="app.app_name" class="app-row">
              <div class="app-rank" :class="getRankClass(index)">{{ index + 1 }}</div>
              <div class="app-icon-small">
                <img v-if="appIcons[app.app_name]" :src="appIcons[app.app_name]" />
                <span v-else :style="{ background: getAppColor(app.app_name) }">
                  {{ app.app_name.charAt(0) }}
                </span>
              </div>
              <div class="app-details">
                <span class="app-name">{{ app.app_name }}</span>
                <div class="app-progress-row">
                  <div class="progress-track">
                    <div 
                      class="progress-fill" 
                      :style="{ 
                        width: getProgressWidth(app.total_seconds) + '%',
                        background: getProgressGradient(index)
                      }"
                    ></div>
                  </div>
                  <span class="app-percent">{{ getProgressWidth(app.total_seconds) }}%</span>
                </div>
              </div>
              <div class="app-time">
                <span class="time-value">{{ formatDuration(app.total_seconds) }}</span>
                <span class="time-sessions">{{ app.session_count }} sessions</span>
              </div>
            </div>
          </div>
          
          <div v-else class="empty-state">
            <div class="empty-icon">📊</div>
            <p>No activity recorded today</p>
            <span>Start using apps to see your stats</span>
          </div>
        </div>

        <!-- Chart Section -->
        <div class="grid-card chart-card">
          <div class="card-header">
            <h3>{{ $t("dashboard.todaySummary") }}</h3>
            <div class="chart-tabs">
              <button 
                @click="selectedChartType = 'doughnut'" 
                :class="{ active: selectedChartType === 'doughnut' }"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>
                </svg>
              </button>
              <button 
                @click="selectedChartType = 'bar'" 
                :class="{ active: selectedChartType === 'bar' }"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="chart-container">
            <div class="chart-wrapper" v-if="chartData.labels.length">
              <Doughnut
                v-if="selectedChartType === 'doughnut'"
                :data="chartData"
                :options="doughnutOptions"
              />
              <Bar
                v-else
                :data="barChartData"
                :options="barOptions"
              />
              
              <!-- Center Stats for Doughnut -->
              <div class="chart-center" v-if="selectedChartType === 'doughnut'">
                <span class="center-value">{{ formatDuration(store.totalTimeToday) }}</span>
                <span class="center-label">Total</span>
              </div>
            </div>
            
            <div v-else class="empty-chart">
              <div class="empty-icon">📈</div>
              <p>Not enough data</p>
            </div>
          </div>
          
          <!-- Legend -->
          <div class="chart-legend" v-if="chartData.labels.length">
            <div 
              v-for="(label, i) in chartData.labels.slice(0, 5)" 
              :key="label" 
              class="legend-item"
            >
              <span class="legend-dot" :style="{ background: chartColors[i] }"></span>
              <span class="legend-label">{{ label }}</span>
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

const currentDate = new Date().toLocaleDateString(undefined, { 
  weekday: 'long', 
  month: 'long', 
  day: 'numeric' 
});

let intervalId: number | null = null;

const chartColors = [
  "#6366f1", "#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#f97316"
];

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) seconds = 0;
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function getProgressWidth(seconds: number): number {
  if (store.totalTimeToday === 0) return 0;
  return Math.min(100, Math.round((seconds / store.totalTimeToday) * 100));
}

function getRankClass(index: number): string {
  if (index === 0) return 'gold';
  if (index === 1) return 'silver';
  if (index === 2) return 'bronze';
  return '';
}

function getAppColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 50%)`;
}

function getProgressGradient(index: number): string {
  const colors = [
    'linear-gradient(90deg, #6366f1, #a855f7)',
    'linear-gradient(90deg, #06b6d4, #22d3ee)',
    'linear-gradient(90deg, #8b5cf6, #c084fc)',
    'linear-gradient(90deg, #ec4899, #f472b6)',
    'linear-gradient(90deg, #f59e0b, #fbbf24)',
  ];
  return colors[index % colors.length];
}

// Chart Data
const chartData = computed(() => ({
  labels: store.topApps.slice(0, 5).map(app => app.app_name),
  datasets: [{
    data: store.topApps.slice(0, 5).map(app => app.total_seconds),
    backgroundColor: chartColors,
    borderWidth: 0,
    hoverOffset: 8,
    borderRadius: 4
  }]
}));

const barChartData = computed(() => ({
  labels: store.topApps.slice(0, 5).map(app => app.app_name),
  datasets: [{
    data: store.topApps.slice(0, 5).map(app => Math.round(app.total_seconds / 60)),
    backgroundColor: chartColors,
    borderRadius: 8,
    borderSkipped: false
  }]
}));

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(20,20,40,0.95)',
      titleColor: '#fff',
      bodyColor: '#94a3b8',
      padding: 12,
      cornerRadius: 8,
      displayColors: true,
      callbacks: {
        label: (ctx: any) => {
          const seconds = ctx.raw;
          return ` ${formatDuration(seconds)}`;
        }
      }
    }
  }
};

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { 
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(20,20,40,0.95)',
      titleColor: '#fff',
      bodyColor: '#94a3b8',
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (ctx: any) => ` ${ctx.raw} minutes`
      }
    }
  },
  scales: {
    x: { 
      grid: { display: false, drawBorder: false }, 
      ticks: { color: '#64748b', font: { size: 11 } }
    },
    y: { 
      display: false,
      grid: { display: false }
    }
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
  await store.fetchTrackingStatus();
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
.dashboard-page {
  padding-bottom: 40px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 20px;
}

.header-left h2 {
  margin-bottom: 6px;
  font-size: 1.75rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--text-main), var(--text-muted));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: var(--text-muted);
  font-size: 1rem;
  font-weight: 400;
}

.tracking-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  background: rgba(255,255,255,0.03);
  border-radius: 24px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-muted);
  border: 1px solid rgba(255,255,255,0.08);
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
}

.tracking-pill.active {
  background: rgba(16,185,129,0.12);
  color: #10b981;
  border-color: rgba(16,185,129,0.3);
  box-shadow: 0 0 20px rgba(16,185,129,0.15);
}

.tracking-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--text-muted);
  transition: all 0.3s ease;
}

.tracking-pill.active .tracking-dot {
  background: #10b981;
  box-shadow: 0 0 12px #10b981, 0 0 24px rgba(16,185,129,0.4);
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.9); }
}

/* Hero Card */
.hero-card {
  position: relative;
  border-radius: 28px;
  padding: 40px;
  margin-bottom: 28px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12), rgba(6,182,212,0.08));
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow: 0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1);
  backdrop-filter: blur(20px);
}

.hero-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.hero-gradient {
  position: absolute;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(99,102,241,0.5), transparent 70%);
  top: -150px;
  right: -100px;
  filter: blur(60px);
  animation: float 8s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-20px, 20px) scale(1.05); }
}

.hero-pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.5;
}

.hero-content {
  position: relative;
  z-index: 1;
}

.active-section {
  display: flex;
  align-items: center;
  gap: 28px;
}

.active-icon-box {
  width: 96px;
  height: 96px;
  background: linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06));
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 12px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease;
}

.active-icon-box:hover {
  transform: scale(1.05);
}

.app-icon-img {
  width: 64px;
  height: 64px;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3));
}

.app-icon-fallback {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.active-info {
  flex: 1;
  min-width: 0;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 10px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-success);
  text-transform: uppercase;
  letter-spacing: 1px;
  background: rgba(16,185,129,0.1);
  padding: 6px 14px;
  border-radius: 16px;
  border: 1px solid rgba(16,185,129,0.2);
}

.status-pulse {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 12px #10b981, 0 0 24px rgba(16,185,129,0.4);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.15); }
}

.session-timer {
  font-family: 'Consolas', monospace;
  font-size: 0.95rem;
  color: var(--text-muted);
  background: rgba(255,255,255,0.06);
  padding: 6px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.08);
}

.active-app {
  font-size: 2.2rem;
  font-weight: 800;
  margin-bottom: 6px;
  line-height: 1.2;
  letter-spacing: -0.5px;
}

.active-window {
  color: var(--text-muted);
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 600px;
  font-weight: 400;
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 28px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 18px;
  background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 22px;
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.06), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-card:hover {
  background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
  border-color: rgba(255,255,255,0.15);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.25), 0 0 20px rgba(99,102,241,0.1);
}

.stat-icon-box {
  width: 58px;
  height: 58px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.stat-card:hover .stat-icon-box {
  transform: scale(1.1) rotate(5deg);
}

.stat-icon-box.primary {
  background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.1));
  color: #6366f1;
  box-shadow: 0 4px 16px rgba(99,102,241,0.2);
}

.stat-icon-box.accent {
  background: linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.1));
  color: #06b6d4;
  box-shadow: 0 4px 16px rgba(6,182,212,0.2);
}

.stat-icon-box.success {
  background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1));
  color: #10b981;
  box-shadow: 0 4px 16px rgba(16,185,129,0.2);
}

.stat-content {
  flex: 1;
  position: relative;
  z-index: 1;
}

.stat-label {
  display: block;
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 6px;
  font-weight: 500;
}

.stat-value-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, var(--text-main), var(--text-muted));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Main Grid */
.main-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 24px;
}

.grid-card {
  background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24px;
  padding: 28px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.grid-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.03), transparent 70%);
  opacity: 0;
  transition: opacity 0.5s ease;
}

.grid-card:hover::before {
  opacity: 1;
}

.grid-card:hover {
  border-color: rgba(255,255,255,0.18);
  box-shadow: 0 8px 32px rgba(0,0,0,0.2), 0 0 20px rgba(99,102,241,0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}

.card-header h3 {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.header-badge {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  background: rgba(255,255,255,0.06);
  padding: 6px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.08);
}

/* App List */
.app-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  z-index: 1;
}

.app-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255,255,255,0.05);
  position: relative;
  overflow: hidden;
}

.app-row::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, var(--color-primary), var(--color-accent));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.app-row:hover::before {
  opacity: 1;
}

.app-row:hover {
  background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
  border-color: rgba(255,255,255,0.12);
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.app-rank {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.9rem;
  background: rgba(255,255,255,0.06);
  color: var(--text-muted);
  transition: all 0.3s ease;
}

.app-row:hover .app-rank {
  background: rgba(255,255,255,0.1);
  color: var(--text-main);
}

.app-rank.gold { 
  background: linear-gradient(135deg, rgba(251,191,36,0.25), rgba(245,158,11,0.15)); 
  color: #fbbf24;
  box-shadow: 0 2px 8px rgba(251,191,36,0.3);
}
.app-rank.silver { 
  background: linear-gradient(135deg, rgba(148,163,184,0.25), rgba(100,116,139,0.15)); 
  color: #94a3b8;
  box-shadow: 0 2px 8px rgba(148,163,184,0.3);
}
.app-rank.bronze { 
  background: linear-gradient(135deg, rgba(180,83,9,0.25), rgba(245,158,11,0.15)); 
  color: #f59e0b;
  box-shadow: 0 2px 8px rgba(245,158,11,0.3);
}

.app-icon-small {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.1);
  transition: all 0.3s ease;
}

.app-row:hover .app-icon-small {
  transform: scale(1.08);
  border-color: rgba(255,255,255,0.18);
}

.app-icon-small img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
}

.app-icon-small span {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #fff;
  font-size: 1.1rem;
}

.app-details {
  flex: 1;
  min-width: 0;
}

.app-name {
  display: block;
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.3px;
}

.app-progress-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-track {
  flex: 1;
  height: 8px;
  background: rgba(255,255,255,0.06);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.04);
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 10px currentColor;
}

.app-percent {
  font-size: 0.85rem;
  color: var(--text-muted);
  min-width: 42px;
  text-align: right;
  font-weight: 600;
}

.app-time {
  text-align: right;
  min-width: 90px;
}

.time-value {
  display: block;
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: -0.3px;
}

.time-sessions {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.4;
  filter: grayscale(0.5);
}

.empty-state p {
  font-size: 1.1rem;
  margin-bottom: 6px;
  font-weight: 600;
}

.empty-state span {
  font-size: 0.9rem;
  opacity: 0.7;
}

/* Chart */
.chart-tabs {
  display: flex;
  gap: 6px;
  background: rgba(255,255,255,0.04);
  padding: 5px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.06);
}

.chart-tabs button {
  padding: 10px 14px;
  background: transparent;
  border: none;
  border-radius: 10px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

.chart-tabs button:hover {
  color: var(--text-main);
  background: rgba(255,255,255,0.06);
}

.chart-tabs button.active {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: #fff;
  box-shadow: 0 4px 12px rgba(99,102,241,0.3);
}

.chart-container {
  position: relative;
  height: 240px;
  margin-bottom: 24px;
}

.chart-wrapper {
  position: relative;
  height: 100%;
}

.chart-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.center-value {
  display: block;
  font-size: 1.6rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.center-label {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.empty-chart {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.empty-chart .empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
}

/* Chart Legend */
.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 10px;
  background: rgba(255,255,255,0.03);
  transition: all 0.2s ease;
}

.legend-item:hover {
  background: rgba(255,255,255,0.06);
  color: var(--text-main);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 0 8px currentColor;
}

.legend-label {
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Animations */
.animate-enter {
  animation: fadeSlideIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  opacity: 0;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile Responsive */
@media (max-width: 900px) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .main-grid {
    grid-template-columns: 1fr;
  }

  .active-section {
    flex-direction: column;
    text-align: center;
  }

  .active-window {
    max-width: 100%;
  }

  .status-row {
    justify-content: center;
  }

  .hero-card {
    padding: 32px 24px;
  }

  .active-icon-box {
    width: 80px;
    height: 80px;
  }

  .app-icon-img {
    width: 52px;
    height: 52px;
  }

  .active-app {
    font-size: 1.75rem;
  }
}

@media (max-width: 600px) {
  .hero-card {
    padding: 24px 20px;
  }

  .active-app {
    font-size: 1.5rem;
  }

  .app-row {
    flex-wrap: wrap;
  }

  .app-time {
    width: 100%;
    text-align: left;
    margin-top: 8px;
    padding-left: 48px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-left h2 {
    font-size: 1.5rem;
  }

  .tracking-pill {
    width: 100%;
    justify-content: center;
  }
}
</style>
