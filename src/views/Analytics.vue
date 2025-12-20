<template>
  <div class="page">
    <div class="page-container">
      <div class="page-header">
        <h2>{{ $t('analytics.title') }}</h2>
      </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ formatDuration(totalWeekTime) }}</div>
        <div class="stat-label">{{ $t('analytics.totalWeek') }}</div>
      </div>
      <div class="stat-card accent-1">
        <div class="stat-value">{{ formatDuration(dailyAverage) }}</div>
        <div class="stat-label">{{ $t('analytics.dailyAverage') }}</div>
      </div>
    </div>

    <!-- Trend Chart -->
    <div class="card full-width mb-4">
      <div class="card-header">
         <h3 class="card-title">{{ $t('analytics.trend') || 'Activity Trend' }}</h3>
      </div>
       <div class="chart-container" style="height: 250px;">
          <Line v-if="weeklyStats.length > 0" :data="lineChartData" :options="lineChartOptions" />
       </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">{{ $t('analytics.weeklyOverview') }}</h3>
        </div>
        <div class="chart-container">
          <Bar v-if="weeklyStats.length > 0" :data="weeklyChartData" :options="barChartOptions" />
        </div>
      </div>

      <div class="card">
        <div class="card-header flex-between">
          <h3 class="card-title">{{ $t('analytics.breakdownByApp') }}</h3>
          <button class="btn-text small" @click="showDetailModal = true">View Details</button>
        </div>
        <div class="chart-container">
          <Pie v-if="store.topApps.length > 0" :data="appChartData" :options="pieChartOptions" />
        </div>
      </div>
    </div>
    </div>

    <!-- Detail Modal -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Detailed App Usage</h3>
          <button class="close-btn" @click="showDetailModal = false">×</button>
        </div>
        <div class="modal-body">
           <table class="data-table">
             <thead>
               <tr>
                 <th>Application</th>
                 <th>Time Spent</th>
                 <th>%</th>
               </tr>
             </thead>
             <tbody>
               <tr v-for="app in store.topApps" :key="app.app_name">
                 <td>{{ app.app_name }}</td>
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
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend);

const store = useActivityStore();
const weeklyStats = computed(() => store.weeklyStats);
const showDetailModal = ref(false);

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
  datasets: [{ data: weeklyStats.value.map(d => Math.round(d.total_seconds / 60)).reverse(), backgroundColor: '#6366f1', borderRadius: 8 }]
}));

const lineChartData = computed(() => ({
  labels: weeklyStats.value.map(d => new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })).reverse(),
  datasets: [{
    label: 'Activity (minutes)',
    data: weeklyStats.value.map(d => Math.round(d.total_seconds / 60)).reverse(),
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    tension: 0.4,
    fill: true
  }]
}));

const barChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };
const lineChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } };

const appChartData = computed(() => ({
  labels: store.topApps.map(a => a.app_name),
  datasets: [{ data: store.topApps.map(a => a.total_seconds), backgroundColor: ['#6366f1', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'] }]
}));

const pieChartOptions = { responsive: true, maintainAspectRatio: false };

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
</style>
