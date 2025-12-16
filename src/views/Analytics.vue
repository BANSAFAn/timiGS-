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
        <div class="card-header">
          <h3 class="card-title">{{ $t('analytics.breakdownByApp') }}</h3>
        </div>
        <div class="chart-container">
          <Pie v-if="store.topApps.length > 0" :data="appChartData" :options="pieChartOptions" />
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useActivityStore } from '../stores/activity';
import { Bar, Pie } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const { t } = useI18n();
const store = useActivityStore();
const weeklyStats = computed(() => store.weeklyStats);

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  return `${hours}h ${Math.floor((seconds % 3600) / 60)}m`;
}

const totalWeekTime = computed(() => weeklyStats.value.reduce((acc, d) => acc + d.total_seconds, 0));
const dailyAverage = computed(() => weeklyStats.value.length ? Math.round(totalWeekTime.value / weeklyStats.value.length) : 0);

const weeklyChartData = computed(() => ({
  labels: weeklyStats.value.map(d => new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })).reverse(),
  datasets: [{ data: weeklyStats.value.map(d => Math.round(d.total_seconds / 60)).reverse(), backgroundColor: '#6366f1', borderRadius: 8 }]
}));

const barChartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

const appChartData = computed(() => ({
  labels: store.topApps.map(a => a.app_name),
  datasets: [{ data: store.topApps.map(a => a.total_seconds), backgroundColor: ['#6366f1', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b'] }]
}));

const pieChartOptions = { responsive: true, maintainAspectRatio: false };

onMounted(async () => { await store.fetchTodayData(); await store.fetchWeeklyStats(); });
</script>
