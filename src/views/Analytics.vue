<template>
  <div class="page">
    <div class="page-container">
      <div class="page-header">
        <h2>{{ $t('analytics.title') }}</h2>
        <div class="date-range">
          <span class="range-badge">{{ $t('analytics.weeklyOverview') }}</span>
        </div>
      </div>

      <div class="analytics-dashboard">
        <!-- Overview Stats Row -->
        <div class="stats-row">
          <div class="stat-card premium-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-content">
              <span class="stat-label">{{ $t('analytics.totalWeek') }}</span>
              <span class="stat-value">{{ formatDuration(totalWeekTime) }}</span>
            </div>
          </div>
          <div class="stat-card premium-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <span class="stat-label">{{ $t('analytics.dailyAverage') }}</span>
              <span class="stat-value">{{ formatDuration(dailyAverage) }}</span>
            </div>
          </div>
          <div class="stat-card premium-card">
            <div class="stat-icon">🔥</div>
            <div class="stat-content">
              <span class="stat-label">{{ $t('analytics.mostUsed') }}</span>
              <span class="stat-value text-ellipsis">{{ store.topApps[0]?.app_name || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- Main Charts Area -->
        <div class="charts-section">
          <!-- Activity Trend (Line Chart) -->
          <div class="chart-card large-chart">
            <div class="card-header">
              <h3>{{ $t('analytics.trend') }}</h3>
            </div>
            <div class="chart-wrapper">
              <Line v-if="weeklyStats.length > 0" :data="lineChartData" :options="lineChartOptions" />
            </div>
          </div>

          <!-- Weekly Distribution (Bar Chart) -->
          <div class="chart-card">
            <div class="card-header">
              <h3>{{ $t('analytics.weeklyOverview') }}</h3>
            </div>
            <div class="chart-wrapper">
              <Bar v-if="weeklyStats.length > 0" :data="weeklyChartData" :options="barChartOptions" />
            </div>
          </div>

          <!-- App Usage (Pie Chart + Detailed Button) -->
          <div class="chart-card">
            <div class="card-header">
              <h3>{{ $t('analytics.breakdownByApp') }}</h3>
              <button class="btn-icon" @click="showDetailModal = true" title="View Details">
                ↗
              </button>
            </div>
            <div class="chart-wrapper pie-wrapper">
              <Pie v-if="store.topApps.length > 0" :data="appChartData" :options="pieChartOptions" />
            </div>
          </div>
        </div>

        <!-- Top Websites List -->
        <div class="section-card full-width" v-if="store.websiteUsage.length > 0">
           <div class="card-header">
             <h3>{{ $t('analytics.topWebsites') }}</h3>
           </div>
           <div class="website-grid">
             <div v-for="site in store.websiteUsage.slice(0, 8)" :key="site.name" class="website-item">
               <div class="site-icon">{{ site.name.charAt(0).toUpperCase() }}</div>
               <div class="site-details">
                 <span class="site-name">{{ site.name }}</span>
                 <span class="site-time">{{ formatDuration(site.seconds) }}</span>
               </div>
               <div class="site-bar" :style="{ width: calculatePercentage(site.seconds) + '%' }"></div>
             </div>
           </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ $t('analytics.detailedUsage') }}</h3>
          <button class="close-btn" @click="showDetailModal = false">×</button>
        </div>
        <div class="modal-body">
           <table class="data-table">
             <thead>
               <tr>
                 <th>{{ $t('analytics.application') }}</th>
                 <th>{{ $t('analytics.timeSpent') }}</th>
                 <th>{{ $t('analytics.percentage') }}</th>
               </tr>
             </thead>
             <tbody>
               <tr v-for="app in store.topApps" :key="app.app_name">
                 <td>
                   <div class="app-row">
                     <span class="app-icon-mini" :style="{ background: getAppColor(app.app_name) }">
                       {{ app.app_name.charAt(0) }}
                     </span>
                     {{ app.app_name }}
                   </div>
                 </td>
                 <td>{{ formatDuration(app.total_seconds) }}</td>
                 <td>{{ calculatePercentage(app.total_seconds) }}%</td>
               </tr>
             </tbody>
           </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { useActivityStore } from '../stores/activity';
import { Bar, Pie, Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler);

const store = useActivityStore();
const weeklyStats = computed(() => store.weeklyStats);
const showDetailModal = ref(false);

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

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  return `${hours}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function calculatePercentage(seconds: number): string {
    const total = totalWeekTime.value || 1; 
    return ((seconds / total) * 100).toFixed(1);
}

const totalWeekTime = computed(() => weeklyStats.value.reduce((acc, d) => acc + d.total_seconds, 0));
const dailyAverage = computed(() => weeklyStats.value.length ? Math.round(totalWeekTime.value / weeklyStats.value.length) : 0);

const weeklyChartData = computed(() => ({
  labels: weeklyStats.value.map(d => new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })).reverse(),
  datasets: [{ 
    label: 'Hours',
    data: weeklyStats.value.map(d => Number((d.total_seconds / 3600).toFixed(1))).reverse(), 
    backgroundColor: '#6366f1', 
    borderRadius: 6,
    hoverBackgroundColor: '#818cf8'
  }]
}));

const lineChartData = computed(() => ({
  labels: weeklyStats.value.map(d => new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })).reverse(),
  datasets: [{
    label: 'Activity (hours)',
    data: weeklyStats.value.map(d => Number((d.total_seconds / 3600).toFixed(1))).reverse(),
    borderColor: '#10b981',
    backgroundColor: (ctx: any) => {
      const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
      return gradient;
    },
    tension: 0.4,
    fill: true,
    pointBackgroundColor: '#10b981',
    pointBorderColor: '#fff',
    pointHoverBackgroundColor: '#fff',
    pointHoverBorderColor: '#10b981'
  }]
}));

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false, color: '#333' }, ticks: { color: '#9ca3af' } },
    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af' }, beginAtZero: true }
  }
};

const barChartOptions = { ...commonOptions };
const lineChartOptions = { ...commonOptions };

const appChartData = computed(() => ({
  labels: store.topApps.map(a => a.app_name),
  datasets: [{ 
    data: store.topApps.map(a => a.total_seconds), 
    backgroundColor: ['#6366f1', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'],
    borderWidth: 0
  }]
}));

const pieChartOptions = { 
  responsive: true, 
  maintainAspectRatio: false,
  plugins: { 
    legend: { position: 'right' as const, labels: { color: '#9ca3af', boxWidth: 12 } } 
  }
};

onMounted(async () => { await store.fetchTodayData(); await store.fetchWeeklyStats(); });
</script>

<style scoped>
.full-width {
    grid-column: 1 / -1;
}
.mb-4 {
    margin-bottom: 24px;
}
.flex-between {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.btn-text {
    background: none;
    border: none;
    color: var(--primary);
    cursor: pointer;
    font-size: 0.875rem;
}
.btn-text:hover {
    text-decoration: underline;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}
.modal-content {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border);
}
.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-body {
  padding: 24px;
  overflow-y: auto;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
}
.close-btn:hover {
  color: var(--text-primary);
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th, .data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}
.data-table th {
  color: var(--text-muted);
  font-weight: 500;
  font-size: 0.875rem;
}

.charts-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.app-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.app-list li {
  margin-bottom: 2px;
  padding: 8px 0;
}
.app-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 0.875rem;
}
.app-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 70%;
}
.app-time {
  color: var(--text-muted);
}
.progress-bar {
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  background: var(--primary);
  height: 100%;
  border-radius: 3px;
}
.analytics-dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.range-badge {
  background: var(--bg-tertiary);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--text-muted);
  border: 1px solid var(--border);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.stat-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-color: var(--primary);
}

.stat-icon {
  font-size: 2rem;
  background: var(--bg-tertiary);
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.text-ellipsis {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    max-width: 150px;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.chart-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.large-chart {
  grid-column: span 2;
}

.chart-wrapper {
  position: relative;
  height: 250px;
  width: 100%;
}

.pie-wrapper {
  height: 220px;
}

.full-width {
  width: 100%;
}

.section-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 24px;
}

.website-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.website-item {
  background: var(--bg-tertiary);
  padding: 12px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  overflow: hidden;
}

.site-icon {
  width: 32px;
  height: 32px;
  background: var(--primary);
  color: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
  z-index: 2;
}

.site-details {
  display: flex;
  flex-direction: column;
  z-index: 2;
  min-width: 0;
}

.site-name {
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.site-time {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.site-bar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  background: var(--primary);
  opacity: 0.5;
  transition: width 0.3s;
}

.btn-icon {
  background: var(--bg-tertiary);
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.btn-icon:hover {
  background: var(--border);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
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
  box-shadow: 0 20px 50px rgba(0,0,0,0.3);
}

.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 0;
  overflow-y: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th, .data-table td {
  padding: 16px 24px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.data-table th {
  background: var(--bg-tertiary);
  color: var(--text-muted);
  font-weight: 500;
  font-size: 0.85rem;
  position: sticky;
  top: 0;
}

.app-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-icon-mini {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
}

@media (max-width: 900px) {
  .charts-section {
    grid-template-columns: 1fr;
  }
  .large-chart {
    grid-column: span 1;
  }
}
</style>
