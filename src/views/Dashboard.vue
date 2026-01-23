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
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left h2 {
  margin-bottom: 4px;
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.tracking-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255,255,255,0.05);
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.tracking-pill.active {
  background: rgba(16,185,129,0.15);
  color: #10b981;
}

.tracking-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-muted);
}

.tracking-pill.active .tracking-dot {
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Hero Card */
.hero-card {
  position: relative;
  border-radius: 24px;
  padding: 32px;
  margin-bottom: 24px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1));
  border: 1px solid rgba(255,255,255,0.08);
}

.hero-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.hero-gradient {
  position: absolute;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(99,102,241,0.4), transparent 70%);
  top: -100px;
  right: -50px;
  filter: blur(40px);
}

.hero-pattern {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 24px 24px;
}

.hero-content {
  position: relative;
  z-index: 1;
}

.active-section {
  display: flex;
  align-items: center;
  gap: 24px;
}

.active-icon-box {
  width: 80px;
  height: 80px;
  background: rgba(255,255,255,0.08);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}

.app-icon-img {
  width: 56px;
  height: 56px;
  object-fit: contain;
}

.app-icon-fallback {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
}

.active-info {
  flex: 1;
  min-width: 0;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-success);
  box-shadow: 0 0 8px var(--color-success);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

.session-timer {
  font-family: 'Consolas', monospace;
  font-size: 0.9rem;
  color: var(--text-muted);
  background: rgba(255,255,255,0.08);
  padding: 4px 12px;
  border-radius: 8px;
}

.active-app {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 4px;
  line-height: 1.2;
}

.active-window {
  color: var(--text-muted);
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 500px;
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
  padding: 20px;
  transition: all 0.2s;
}

.stat-card:hover {
  background: rgba(255,255,255,0.05);
  border-color: rgba(255,255,255,0.1);
  transform: translateY(-2px);
}

.stat-icon-box {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon-box.primary {
  background: rgba(99,102,241,0.15);
  color: #6366f1;
}

.stat-icon-box.accent {
  background: rgba(6,182,212,0.15);
  color: #06b6d4;
}

.stat-icon-box.success {
  background: rgba(16,185,129,0.15);
  color: #10b981;
}

.stat-content {
  flex: 1;
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.stat-value-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.stat-value {
  font-size: 1.6rem;
  font-weight: 700;
}

/* Main Grid */
.main-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 20px;
}

.grid-card {
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 20px;
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 {
  font-size: 1rem;
  font-weight: 600;
}

.header-badge {
  font-size: 0.75rem;
  color: var(--text-muted);
  background: rgba(255,255,255,0.05);
  padding: 4px 10px;
  border-radius: 8px;
}

/* App List */
.app-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.app-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  background: rgba(255,255,255,0.02);
  border-radius: 14px;
  transition: all 0.2s;
}

.app-row:hover {
  background: rgba(255,255,255,0.05);
}

.app-rank {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
  background: rgba(255,255,255,0.05);
  color: var(--text-muted);
}

.app-rank.gold { background: rgba(251,191,36,0.2); color: #fbbf24; }
.app-rank.silver { background: rgba(148,163,184,0.2); color: #94a3b8; }
.app-rank.bronze { background: rgba(180,83,9,0.2); color: #f59e0b; }

.app-icon-small {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255,255,255,0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.app-icon-small img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.app-icon-small span {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #fff;
  font-size: 1rem;
}

.app-details {
  flex: 1;
  min-width: 0;
}

.app-name {
  display: block;
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-progress-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-track {
  flex: 1;
  height: 6px;
  background: rgba(255,255,255,0.08);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.app-percent {
  font-size: 0.8rem;
  color: var(--text-muted);
  min-width: 35px;
  text-align: right;
}

.app-time {
  text-align: right;
  min-width: 80px;
}

.time-value {
  display: block;
  font-weight: 600;
  font-size: 0.95rem;
}

.time-sessions {
  font-size: 0.75rem;
  color: var(--text-muted);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 1rem;
  margin-bottom: 4px;
}

.empty-state span {
  font-size: 0.85rem;
  opacity: 0.7;
}

/* Chart */
.chart-tabs {
  display: flex;
  gap: 4px;
  background: rgba(255,255,255,0.05);
  padding: 4px;
  border-radius: 10px;
}

.chart-tabs button {
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-tabs button:hover {
  color: var(--text-color);
}

.chart-tabs button.active {
  background: var(--color-primary);
  color: #fff;
}

.chart-container {
  position: relative;
  height: 220px;
  margin-bottom: 20px;
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
  font-size: 1.4rem;
  font-weight: 700;
}

.center-label {
  font-size: 0.8rem;
  color: var(--text-muted);
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
  font-size: 2.5rem;
  margin-bottom: 12px;
}

/* Chart Legend */
.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.legend-label {
  max-width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Animations */
.animate-enter {
  animation: fadeSlideIn 0.5s ease forwards;
  opacity: 0;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
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
}

@media (max-width: 600px) {
  .hero-card {
    padding: 24px;
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
    padding-left: 42px;
  }
}
</style>
