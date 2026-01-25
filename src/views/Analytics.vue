<template>
  <div class="page page-shell analytics-page">
    <div class="page-container">
      <div class="page-header">
        <div class="header-left">
          <h2>{{ $t('analytics.title') }}</h2>
          <p class="subtitle">Insights into your productivity patterns</p>
        </div>
        <div class="date-range-badge">
          <span class="range-icon">📅</span>
          <span>Last 7 Days</span>
        </div>
      </div>

      <div class="analytics-dashboard">
        <!-- Key Metrics Row -->
        <div class="stats-row animate-enter">
          <div class="stat-card premium-card purple">
            <div class="stat-bg-icon">⏱️</div>
            <div class="stat-content">
              <span class="stat-label">{{ $t('analytics.totalWeek') }}</span>
              <span class="stat-value">{{ formatDuration(totalWeekTime) }}</span>
            </div>
          </div>
          <div class="stat-card premium-card blue">
            <div class="stat-bg-icon">📊</div>
            <div class="stat-content">
              <span class="stat-label">{{ $t('analytics.dailyAverage') }}</span>
              <span class="stat-value">{{ formatDuration(dailyAverage) }}</span>
            </div>
            <div class="stat-trend">
               <span>Based on 7 days</span>
            </div>
          </div>
          <div class="stat-card premium-card orange">
            <div class="stat-bg-icon">🔥</div>
            <div class="stat-content">
              <span class="stat-label">{{ $t('analytics.mostUsed') }}</span>
              <span class="stat-value text-ellipsis" :title="store.topApps[0]?.app_name">{{ store.topApps[0]?.app_name || '-' }}</span>
            </div>
          </div>
        </div>

        <!-- Main Charts Grid -->
        <div class="charts-grid animate-enter" style="animation-delay: 0.1s">
          <!-- Activity Trend (Large) -->
          <div class="chart-card large-chart">
            <div class="card-header">
              <h3>{{ $t('analytics.trend') }}</h3>
            </div>
            <div class="chart-container">
              <Line v-if="weeklyStats.length > 0" :data="lineChartData" :options="lineChartOptions" />
            </div>
          </div>

          <!-- Weekly Distribution -->
          <div class="chart-card">
            <div class="card-header">
              <h3>Weekly Distribution</h3>
            </div>
            <div class="chart-container">
              <Bar v-if="weeklyStats.length > 0" :data="weeklyChartData" :options="barChartOptions" />
            </div>
          </div>

          <!-- App Breakdown -->
          <div class="chart-card">
            <div class="card-header flex-between">
              <h3>{{ $t('analytics.breakdownByApp') }}</h3>
              <button class="btn-icon" @click="showDetailModal = true" title="View Details">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
              </button>
            </div>
            <div class="chart-container pie-container">
               <div class="pie-wrapper">
                  <Pie v-if="store.topApps.length > 0" :data="appChartData" :options="pieChartOptions" />
               </div>
               
               <!-- Custom Legend -->
               <div class="custom-legend">
                 <div v-for="(app, i) in store.topApps.slice(0, 4)" :key="app.app_name" class="legend-item">
                    <span class="legend-dot" :style="{ background: appChartData.datasets[0].backgroundColor[i] }"></span>
                    <span class="legend-name">{{ app.app_name }}</span>
                    <span class="legend-percent">{{ calculatePercentage(app.total_seconds) }}%</span>
                 </div>
               </div>
            </div>
          </div>
        </div>

        <!-- Top Websites -->
        <div class="section-block animate-enter" style="animation-delay: 0.2s" v-if="store.websiteUsage.length > 0">
           <div class="section-header">
             <h3>{{ $t('analytics.topWebsites') }}</h3>
           </div>
           
           <div class="website-grid">
             <div v-for="(site, index) in store.websiteUsage.slice(0, 8)" :key="site.name" class="website-card">
               <div class="website-rank">{{ index + 1 }}</div>
               <div class="website-icon">{{ site.name.charAt(0).toUpperCase() }}</div>
               <div class="website-info">
                 <div class="website-name">{{ site.name }}</div>
                 <div class="website-bar-bg">
                   <div class="website-bar-fill" :style="{ width: calculatePercentage(site.seconds) + '%' }"></div>
                 </div>
               </div>
               <div class="website-time">{{ formatDuration(site.seconds) }}</div>
             </div>
           </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
        <div class="modal-content animate-enter">
          <div class="modal-header">
            <h3>{{ $t('analytics.detailedUsage') }}</h3>
            <button class="close-btn" @click="showDetailModal = false">×</button>
          </div>
          <div class="modal-body custom-scrollbar">
            <table class="data-table">
              <thead>
                <tr>
                  <th>{{ $t('analytics.application') }}</th>
                  <th>{{ $t('analytics.timeSpent') }}</th>
                  <th>{{ $t('analytics.percentage') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="app in store.topApps" :key="app.app_name" class="table-row">
                  <td>
                    <div class="app-row">
                      <span class="app-icon-mini" :style="{ background: getAppColor(app.app_name) }">
                        {{ app.app_name.charAt(0) }}
                      </span>
                      {{ app.app_name }}
                    </div>
                  </td>
                  <td class="mono-font">{{ formatDuration(app.total_seconds) }}</td>
                  <td>
                    <div class="percent-pill">
                      {{ calculatePercentage(app.total_seconds) }}%
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Teleport>
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
  if (!seconds) return '0s';
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

// Charts
const weeklyChartData = computed(() => ({
  labels: weeklyStats.value.map(d => new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })).reverse(),
  datasets: [{ 
    label: 'Hours',
    data: weeklyStats.value.map(d => Number((d.total_seconds / 3600).toFixed(1))).reverse(), 
    backgroundColor: '#6366f1', 
    borderRadius: 6,
    hoverBackgroundColor: '#818cf8',
    barPercentage: 0.6
  }]
}));

const lineChartData = computed(() => ({
  labels: weeklyStats.value.map(d => new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })).reverse(),
  datasets: [{
    label: 'Activity (hours)',
    data: weeklyStats.value.map(d => Number((d.total_seconds / 3600).toFixed(1))).reverse(),
    borderColor: '#10b981',
    borderWidth: 3,
    backgroundColor: (ctx: any) => {
      const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
      return gradient;
    },
    tension: 0.4,
    fill: true,
    pointBackgroundColor: '#10b981',
    pointBorderColor: '#fff',
    pointBorderWidth: 2,
    pointRadius: 4,
    pointHoverRadius: 6
  }]
}));

const appChartData = computed(() => ({
  labels: store.topApps.map(a => a.app_name),
  datasets: [{ 
    data: store.topApps.map(a => a.total_seconds), 
    backgroundColor: ['#6366f1', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'],
    borderWidth: 0,
    hoverOffset: 10
  }]
}));

const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { 
    backgroundColor: 'rgba(20, 20, 30, 0.9)',
    titleColor: '#fff',
    bodyColor: '#ccc',
    padding: 10,
    cornerRadius: 8,
    displayColors: false
  }},
  scales: {
    x: { grid: { display: false }, ticks: { color: '#6b7280' } },
    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#6b7280' }, beginAtZero: true }
  }
};

const barChartOptions = { ...commonOptions };
const lineChartOptions = { ...commonOptions };

const pieChartOptions = { 
  responsive: true, 
  maintainAspectRatio: false,
  plugins: { 
    legend: { display: false },
    tooltip: { 
      callbacks: {
        label: (ctx: any) => ` ${formatDuration(ctx.raw)}`
      }
    }
  }
};

onMounted(async () => { await store.fetchTodayData(); await store.fetchWeeklyStats(); });
</script>

<style scoped>
.analytics-page { padding-bottom: 40px; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.subtitle { color: var(--text-muted); font-size: 0.95rem; margin-top: 4px; }

.date-range-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  color: var(--text-muted);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card.premium-card {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: transform 0.3s;
}

.stat-card:hover { transform: translateY(-3px); }

.stat-card.purple { border-color: rgba(99, 102, 241, 0.1); }
.stat-card.blue { border-color: rgba(6, 182, 212, 0.1); }
.stat-card.orange { border-color: rgba(249, 115, 22, 0.1); }

.stat-bg-icon {
  position: absolute;
  right: -10px;
  bottom: -10px;
  font-size: 5rem;
  opacity: 0.05;
  transform: rotate(-15deg);
}

.stat-label { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px; display: block; }
.stat-value { font-size: 1.5rem; font-weight: 700; color: #fff; }
.text-ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; display: block; }
.stat-trend { font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; }

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 32px;
}

.chart-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.large-chart { grid-column: span 2; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.card-header h3 { font-size: 1rem; font-weight: 600; color: #fff; }

.chart-container {
  height: 250px;
  width: 100%;
  position: relative;
}

/* Pie Chart Layout */
.pie-container {
  display: flex;
  align-items: center;
  gap: 20px;
}

.pie-wrapper {
  flex: 1;
  height: 200px;
  position: relative;
}

.custom-legend {
  width: 140px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  gap: 8px;
}

.legend-dot { width: 8px; height: 8px; border-radius: 50%; }
.legend-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-muted); }
.legend-percent { font-weight: 600; color: #fff; }

.btn-icon {
  background: rgba(255, 255, 255, 0.05);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-icon:hover { background: rgba(255, 255, 255, 0.1); color: #fff; transform: scale(1.05); }

/* Websites Grid */
.section-block { margin-top: 20px; }
.section-header { margin-bottom: 16px; }

.website-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.website-card {
  background: rgba(255, 255, 255, 0.03);
  padding: 16px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
}

.website-card:hover {
  background: rgba(255, 255, 255, 0.05);
}

.website-rank {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
  width: 16px;
}

.website-icon {
  width: 36px;
  height: 36px;
  background: var(--color-primary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
}

.website-info {
  flex: 1;
  min-width: 0;
}

.website-name {
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 6px;
}

.website-bar-bg {
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.website-bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 2px;
}

.website-time {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: #1a1b26;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  width: 600px;
  max-width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
}

.close-btn:hover { color: #fff; }

.modal-body {
  padding: 0;
  overflow-y: auto;
}

.data-table { width: 100%; border-collapse: collapse; }
.data-table th { 
  text-align: left; 
  padding: 16px 24px; 
  color: var(--text-muted); 
  font-weight: 500; 
  font-size: 0.85rem; 
  background: rgba(255, 255, 255, 0.02);
}
.data-table td { 
  padding: 16px 24px; 
  border-bottom: 1px solid rgba(255, 255, 255, 0.05); 
}

.app-row { display: flex; align-items: center; gap: 12px; }
.app-icon-mini { 
  width: 28px; height: 28px; border-radius: 6px; 
  display: flex; align-items: center; justify-content: center; 
  color: #fff; font-size: 0.8rem; font-weight: 700; 
}
.mono-font { font-family: monospace; color: var(--text-muted); }
.percent-pill { 
  display: inline-block; 
  padding: 4px 8px; 
  background: rgba(255, 255, 255, 0.05); 
  border-radius: 12px; 
  font-size: 0.8rem; 
}

/* Scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 3px; }

@media (max-width: 900px) {
  .stats-row { grid-template-columns: 1fr; }
  .charts-grid { grid-template-columns: 1fr; }
  .large-chart { grid-column: span 1; }
  .pie-container { flex-direction: column; height: auto; }
  .pie-wrapper { height: 200px; width: 100%; }
}

.animate-enter { animation: fadeSlideIn 0.5s ease forwards; opacity: 0; }
@keyframes fadeSlideIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>
