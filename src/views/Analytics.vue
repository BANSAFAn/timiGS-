<template>
  <div class="page page-shell analytics-page">
    <div class="page-container">
      <div class="page-header">
        <div class="header-left">
          <h2>{{ $t('analytics.title') }}</h2>
          <p class="subtitle">Insights into your productivity patterns</p>
        </div>
        <div class="week-nav">
          <button class="nav-btn" @click="prevWeek">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div class="date-range-badge">
            <span class="range-icon" v-html="Icons.timeline"></span>
            <span>{{ weekRangeLabel }}</span>
          </div>
          <button class="nav-btn" @click="nextWeek" :disabled="weekOffset >= 0">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      <div class="analytics-dashboard">
        <!-- Key Metrics Row -->
        <div class="stats-row animate-enter">
          <div class="stat-card premium-card purple">
            <div class="stat-bg-icon" v-html="Icons.clock"></div>
            <div class="stat-content">
              <span class="stat-label">{{ $t('analytics.totalWeek') }}</span>
              <span class="stat-value">{{ formatDuration(totalWeekTime) }}</span>
            </div>
          </div>
          <div class="stat-card premium-card blue">
            <div class="stat-bg-icon" v-html="Icons.chart"></div>
            <div class="stat-content">
              <span class="stat-label">{{ $t('analytics.dailyAverage') }}</span>
              <span class="stat-value">{{ formatDuration(dailyAverage) }}</span>
            </div>
            <div class="stat-trend">
               <span>Based on 7 days</span>
            </div>
          </div>
          <div class="stat-card premium-card orange">
            <div class="stat-bg-icon" v-html="Icons.fire"></div>
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

        <!-- Empty State -->
        <div v-if="weeklyStats.length === 0 && store.topApps.length === 0 && !store.isLoading" class="empty-state animate-enter">
          <div class="empty-icon">📊</div>
          <h3>No Data Available Yet</h3>
          <p>Start using your applications to see analytics here.</p>
        </div>
      </div>
    </div>

    <!-- Detail Modal (App Breakdown) -->
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

    <!-- Daily Detail Modal -->
    <Teleport to="body">
      <div v-if="showDayDetail" class="modal-overlay" @click.self="showDayDetail = false">
        <div class="modal-content animate-enter" style="max-width: 700px;">
          <div class="modal-header">
            <h3><span style="margin-right:8px" v-html="Icons.timeline"></span> {{ dayDetailDate }}</h3>
            <button class="close-btn" @click="showDayDetail = false">×</button>
          </div>
          <div class="modal-body custom-scrollbar" style="max-height: 60vh;">
            <div v-if="dayDetailSessions.length === 0" class="empty-day">No activity recorded</div>
            <div v-else class="day-sessions">
              <div v-for="s in dayDetailSessions" :key="s.id" class="day-session-item">
                <div class="day-session-icon" :style="{ background: getAppColor(s.app_name) }">
                  {{ s.app_name.charAt(0).toUpperCase() }}
                </div>
                <div class="day-session-info">
                  <div class="day-session-app">{{ s.app_name }}</div>
                  <div class="day-session-title">{{ s.window_title }}</div>
                </div>
                <div class="day-session-time">
                  <div class="day-session-dur">{{ formatDuration(s.duration_seconds) }}</div>
                  <div class="day-session-range">{{ formatTimeShort(s.start_time) }} – {{ s.end_time ? formatTimeShort(s.end_time) : 'Now' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useActivityStore, type ActivitySession } from '../stores/activity';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Pie } from 'vue-chartjs';
import { useI18n } from 'vue-i18n';
import { Icons } from '../components/icons/IconMap';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler);

const { t } = useI18n();
const store = useActivityStore();
const showDetailModal = ref(false);

// --- Week Navigation ---
const weekOffset = ref(0); // 0 = current week, -1 = last week, etc.
interface DailyStatLocal { date: string; total_seconds: number; app_count: number; }
const customWeeklyStats = ref<DailyStatLocal[]>([]);

const weeklyStats = computed(() => {
  if (weekOffset.value === 0) return store.weeklyStats;
  return customWeeklyStats.value;
});

function getWeekRange(offset: number): { from: string; to: string } {
  const now = new Date();
  const to = new Date(now);
  to.setDate(to.getDate() + offset * 7);
  const from = new Date(to);
  from.setDate(from.getDate() - 6);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0]
  };
}

const weekRangeLabel = computed(() => {
  if (weekOffset.value === 0) return t('analytics.last7Days') || 'This Week';
  const { from, to } = getWeekRange(weekOffset.value);
  const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${fmt(from)} – ${fmt(to)}`;
});

async function fetchWeekData() {
  if (weekOffset.value === 0) {
    await store.fetchTodayData();
    await store.fetchWeeklyStats();
    return;
  }
  const { from, to } = getWeekRange(weekOffset.value);
  const sessions = await store.getActivityRange(from, to);
  // Aggregate sessions into daily stats
  const daily: Record<string, DailyStatLocal> = {};
  for (const s of sessions) {
    const dateKey = s.start_time.split('T')[0];
    if (!daily[dateKey]) {
      daily[dateKey] = { date: dateKey, total_seconds: 0, app_count: 0 };
    }
    daily[dateKey].total_seconds += s.duration_seconds;
  }
  // Count unique apps per day
  const appsPerDay: Record<string, Set<string>> = {};
  for (const s of sessions) {
    const dateKey = s.start_time.split('T')[0];
    if (!appsPerDay[dateKey]) appsPerDay[dateKey] = new Set();
    appsPerDay[dateKey].add(s.app_name);
  }
  for (const d of Object.keys(daily)) {
    daily[d].app_count = appsPerDay[d]?.size || 0;
  }
  // Fill in missing days
  const result: DailyStatLocal[] = [];
  const start = new Date(from);
  const end = new Date(to);
  for (let d = new Date(end); d >= start; d.setDate(d.getDate() - 1)) {
    const key = d.toISOString().split('T')[0];
    result.push(daily[key] || { date: key, total_seconds: 0, app_count: 0 });
  }
  customWeeklyStats.value = result;
}

function prevWeek() { weekOffset.value--; fetchWeekData(); }
function nextWeek() { if (weekOffset.value < 0) { weekOffset.value++; fetchWeekData(); } }

// --- Daily Detail ---
const showDayDetail = ref(false);
const dayDetailDate = ref('');
const dayDetailSessions = ref<ActivitySession[]>([]);

async function openDayDetail(dateStr: string) {
  dayDetailDate.value = new Date(dateStr).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  dayDetailSessions.value = await store.getActivityRange(dateStr, dateStr);
  showDayDetail.value = true;
}

function formatTimeShort(timeStr: string): string {
  return new Date(timeStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

// --- Colors & Formatting ---
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

// --- Charts ---
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

const barChartOptions = {
  ...commonOptions,
  onClick: (_event: any, elements: any[]) => {
    if (elements.length > 0) {
      const idx = elements[0].index;
      const dates = [...weeklyStats.value].reverse();
      if (dates[idx]) openDayDetail(dates[idx].date);
    }
  }
};
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

onMounted(async () => { await fetchWeekData(); });
</script>

<style scoped>
.analytics-page { padding-bottom: 40px; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.header-left h2 {
  background: linear-gradient(135deg, #fff 30%, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle { color: var(--text-muted); font-size: 0.95rem; margin-top: 4px; }

.week-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}
.week-nav .nav-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.3s;
}
.week-nav .nav-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  transform: scale(1.05);
}
.week-nav .nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
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
  min-width: 140px;
  justify-content: center;
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card.premium-card {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01));
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover { transform: translateY(-4px); }

.stat-card.purple { border-color: rgba(99, 102, 241, 0.15); }
.stat-card.purple:hover {
  box-shadow: 0 8px 30px rgba(99, 102, 241, 0.15), 0 0 60px rgba(99, 102, 241, 0.05);
  border-color: rgba(99, 102, 241, 0.3);
}
.stat-card.purple::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent, #6366f1, transparent);
  opacity: 0; transition: opacity 0.4s;
}
.stat-card.purple:hover::before { opacity: 1; }

.stat-card.blue { border-color: rgba(6, 182, 212, 0.15); }
.stat-card.blue:hover {
  box-shadow: 0 8px 30px rgba(6, 182, 212, 0.15), 0 0 60px rgba(6, 182, 212, 0.05);
  border-color: rgba(6, 182, 212, 0.3);
}
.stat-card.blue::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent, #06b6d4, transparent);
  opacity: 0; transition: opacity 0.4s;
}
.stat-card.blue:hover::before { opacity: 1; }

.stat-card.orange { border-color: rgba(249, 115, 22, 0.15); }
.stat-card.orange:hover {
  box-shadow: 0 8px 30px rgba(249, 115, 22, 0.15), 0 0 60px rgba(249, 115, 22, 0.05);
  border-color: rgba(249, 115, 22, 0.3);
}
.stat-card.orange::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent, #f97316, transparent);
  opacity: 0; transition: opacity 0.4s;
}
.stat-card.orange:hover::before { opacity: 1; }

.stat-bg-icon {
  position: absolute; right: -10px; bottom: -10px;
  width: 80px; height: 80px; opacity: 0.08;
  transform: rotate(-15deg); pointer-events: none; transition: all 0.4s;
}
.stat-card:hover .stat-bg-icon { opacity: 0.15; transform: rotate(-10deg) scale(1.1); }
.stat-bg-icon :deep(svg) { width: 100%; height: 100%; stroke: currentColor; fill: currentColor; }

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
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}
.chart-card:hover {
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.large-chart { grid-column: span 2; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.card-header h3 {
  font-size: 1rem; font-weight: 600; color: #fff;
  display: flex; align-items: center; gap: 8px;
}
.card-header h3::before {
  content: ''; width: 4px; height: 16px;
  background: linear-gradient(180deg, #6366f1, #8b5cf6); border-radius: 2px;
}

.chart-container { height: 250px; width: 100%; position: relative; }

/* Pie Chart Layout */
.pie-container { display: flex; align-items: center; gap: 20px; }
.pie-wrapper { flex: 1; height: 200px; position: relative; }

.custom-legend { width: 150px; display: flex; flex-direction: column; gap: 10px; }
.legend-item {
  display: flex; align-items: center; font-size: 0.8rem; gap: 8px;
  padding: 6px 10px; border-radius: 8px; transition: background 0.2s;
}
.legend-item:hover { background: rgba(255, 255, 255, 0.04); }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.legend-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-muted); }
.legend-percent { font-weight: 600; color: #fff; font-size: 0.85rem; }

.btn-icon {
  background: rgba(255, 255, 255, 0.05); border: none;
  width: 32px; height: 32px; border-radius: 8px;
  color: var(--text-muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.btn-icon:hover { background: rgba(255, 255, 255, 0.1); color: #fff; transform: scale(1.05); }

/* Websites Grid */
.section-block { margin-top: 20px; }
.section-header { margin-bottom: 16px; }
.section-header h3 { display: flex; align-items: center; gap: 8px; }
.section-header h3::before {
  content: ''; width: 4px; height: 16px;
  background: linear-gradient(180deg, #06b6d4, #0ea5e9); border-radius: 2px;
}

.website-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.website-card {
  background: rgba(255, 255, 255, 0.03); padding: 16px;
  border-radius: 14px; display: flex; align-items: center; gap: 12px;
  transition: all 0.3s ease; border: 1px solid transparent;
}
.website-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.08);
  transform: translateX(4px);
}
.website-rank {
  font-size: 0.7rem; font-weight: 700; color: #fff;
  width: 22px; height: 22px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.website-icon {
  width: 36px; height: 36px;
  background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
  border-radius: 10px; display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 1rem; flex-shrink: 0;
}
.website-info { flex: 1; min-width: 0; }
.website-name {
  font-size: 0.9rem; font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 6px;
}
.website-bar-bg {
  height: 4px; background: rgba(255, 255, 255, 0.08);
  border-radius: 2px; overflow: hidden;
}
.website-bar-fill {
  height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 2px; transition: width 0.6s ease;
}
.website-time { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; font-feature-settings: "tnum"; }

/* Empty State */
.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 3rem; margin-bottom: 16px; }
.empty-state h3 {
  background: linear-gradient(135deg, #fff, #818cf8);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  margin-bottom: 8px;
}
.empty-state p { color: var(--text-muted); font-size: 0.9rem; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px); z-index: 100;
  display: flex; align-items: center; justify-content: center;
}
.modal-content {
  background: #1a1b26; border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px; width: 600px; max-width: 90%; max-height: 80vh;
  display: flex; flex-direction: column; box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
}
.modal-header {
  padding: 20px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex; justify-content: space-between; align-items: center;
}
.close-btn {
  background: rgba(255, 255, 255, 0.05); border: none;
  font-size: 1.3rem; color: var(--text-muted); cursor: pointer;
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.close-btn:hover { color: #fff; background: rgba(255, 255, 255, 0.1); }
.modal-body { padding: 0; overflow-y: auto; }

.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  text-align: left; padding: 16px 24px; color: var(--text-muted);
  font-weight: 500; font-size: 0.85rem; background: rgba(255, 255, 255, 0.02);
}
.data-table td { padding: 16px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.04); }
.table-row { transition: background 0.2s; }
.table-row:hover { background: rgba(255, 255, 255, 0.03); }

.app-row { display: flex; align-items: center; gap: 12px; }
.app-icon-mini {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 0.8rem; font-weight: 700;
}
.mono-font { font-family: monospace; color: var(--text-muted); }
.percent-pill {
  display: inline-block; padding: 4px 10px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1));
  border-radius: 12px; font-size: 0.8rem; font-weight: 600; color: #818cf8;
}

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

/* Daily Detail Modal */
.empty-day { text-align: center; padding: 40px; color: var(--text-muted); font-size: 0.95rem; }
.day-sessions { display: flex; flex-direction: column; gap: 2px; }
.day-session-item {
  display: flex; align-items: center; gap: 14px; padding: 14px 20px;
  transition: all 0.2s; border-bottom: 1px solid rgba(255,255,255,0.03);
}
.day-session-item:hover { background: rgba(255,255,255,0.04); transform: translateX(4px); }
.day-session-icon {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 0.95rem; flex-shrink: 0;
}
.day-session-info { flex: 1; min-width: 0; }
.day-session-app { font-weight: 600; font-size: 0.95rem; margin-bottom: 2px; }
.day-session-title {
  font-size: 0.8rem; color: var(--text-muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.day-session-time { text-align: right; flex-shrink: 0; }
.day-session-dur { font-weight: 600; font-size: 0.9rem; color: var(--color-primary); }
.day-session-range { font-size: 0.75rem; color: var(--text-muted); font-feature-settings: "tnum"; }
</style>
