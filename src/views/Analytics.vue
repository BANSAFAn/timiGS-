<template>
  <div class="page page-shell analytics-page">
    <div class="page-container">
      <div class="page-header">
        <div class="header-left">
          <h2>{{ $t('analytics.title') }}</h2>
          <p class="subtitle">Insights into your productivity patterns</p>
        </div>
        <div class="header-controls">
          <!-- Time Range Selector -->
          <div class="time-range-selector">
            <button class="range-btn" :class="{ active: selectedRange === 'day' }" @click="selectedRange = 'day'">Day</button>
            <button class="range-btn" :class="{ active: selectedRange === 'week' }" @click="selectedRange = 'week'">Week</button>
            <button class="range-btn" :class="{ active: selectedRange === 'month' }" @click="selectedRange = 'month'">Month</button>
          </div>

          <button class="nav-btn" @click="prevPeriod">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div class="date-range-badge">
            <span class="range-icon" v-html="Icons.timeline"></span>
            <span>{{ periodLabel }}</span>
          </div>
          <button class="nav-btn" @click="nextPeriod" :disabled="isCurrentPeriod">
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
        <div class="section-block animate-enter websites-section" style="animation-delay: 0.2s" v-if="store.websiteUsage.length > 0">
           <div class="section-header">
             <h3>
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; vertical-align: middle; margin-right: 8px;">
                 <circle cx="12" cy="12" r="10"></circle>
                 <line x1="2" y1="12" x2="22" y2="12"></line>
                 <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
               </svg>
               {{ $t('analytics.topWebsites') }}
             </h3>
             <span class="header-badge websites-badge">{{ store.websiteUsage.length }} sites</span>
           </div>

           <div class="website-grid">
             <div v-for="(site, index) in store.websiteUsage.slice(0, 8)" :key="site.name" class="website-card" @click="openWebsiteHistory(site.name)">
               <div class="website-rank" :class="getRankClass(index)">{{ index + 1 }}</div>
               <div class="website-icon-wrapper">
                 <img :src="getFaviconUrl(site.name)" class="website-favicon" :alt="site.name" @error="handleFaviconError($event, site.name)" />
               </div>
               <div class="website-info">
                 <div class="website-name" :title="site.name">{{ site.name }}</div>
                 <div class="website-bar-bg">
                   <div class="website-bar-fill" :style="{ width: calculateWebsitePercentage(site.seconds) + '%', background: getWebsiteBarGradient(index) }"></div>
                 </div>
               </div>
               <div class="website-time">
                 <span class="time-value" :title="formatDurationFull(site.seconds)">{{ formatTimeReadable(site.seconds) }}</span>
                 <span class="time-label">today</span>
               </div>
               <div class="website-view-history">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                   <circle cx="12" cy="12" r="3"></circle>
                 </svg>
               </div>
             </div>
           </div>
        </div>

        <!-- Music Listening Section -->
        <div class="section-block animate-enter music-section" style="animation-delay: 0.25s" v-if="store.musicSummary.length > 0">
           <div class="section-header">
             <h3>
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; vertical-align: middle; margin-right: 8px;">
                 <path d="M9 18V5l12-2v13"></path>
                 <circle cx="6" cy="18" r="3"></circle>
                 <circle cx="18" cy="16" r="3"></circle>
               </svg>
               Music Listening
             </h3>
             <span class="header-badge total-music">{{ formatDuration(store.totalMusicTime) }}</span>
           </div>

           <div class="music-grid">
             <div v-for="(music, index) in store.musicApps.slice(0, 6)" :key="music.app_name" class="music-card" @click="openMusicHistory(music.app_name)">
               <div class="music-rank" :class="getRankClass(index)">{{ index + 1 }}</div>
               <div class="music-icon-wrapper">
                 <img v-if="appIcons[music.app_name]" :src="appIcons[music.app_name]" class="music-app-icon" :alt="music.app_name" />
                 <div v-else-if="music.app_name === 'YouTube Music'" class="music-icon" style="background: linear-gradient(135deg, #ff0000, #ff4444);">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
                     <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5v-9l6 4.5-6 4.5z"/>
                   </svg>
                 </div>
                 <div v-else class="music-icon" :style="{ background: getMusicGradient(index) }">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                     <path d="M9 18V5l12-2v13"></path>
                     <circle cx="6" cy="18" r="3"></circle>
                     <circle cx="18" cy="16" r="3"></circle>
                   </svg>
                 </div>
               </div>
               <div class="music-info">
                 <div class="music-app-name" :title="music.app_name">{{ music.app_name }}</div>
                 <div class="music-bar-bg">
                   <div class="music-bar-fill" :style="{ width: getMusicPercentage(music.total_seconds) + '%', background: getMusicBarGradient(index) }"></div>
                 </div>
               </div>
               <div class="music-time">
                 <span class="time-value" :title="formatDurationFull(music.total_seconds)">{{ formatTimeReadable(music.total_seconds) }}</span>
                 <span class="time-label">{{ music.session_count }} sessions</span>
               </div>
               <div class="music-view-history">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                   <circle cx="12" cy="12" r="3"></circle>
                 </svg>
               </div>
             </div>
           </div>

           <!-- Now Playing (if there's a current music session) -->
           <div class="now-playing" v-if="currentMusicSession">
             <div class="now-playing-header">
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <circle cx="12" cy="12" r="10"></circle>
                 <polyline points="12 6 12 12 16 14"></polyline>
               </svg>
               <span>Now Playing</span>
               <span class="now-playing-live-badge">
                 <span class="live-indicator"></span>
                 LIVE
               </span>
             </div>
             <div class="now-playing-content">
               <div class="now-playing-icon">
                 <img v-if="appIcons[currentMusicSession.app_name]" :src="appIcons[currentMusicSession.app_name]" class="now-playing-app-icon" :alt="currentMusicSession.app_name" />
                 <svg v-else-if="currentMusicSession.app_name === 'YouTube Music'" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="white" style="background: linear-gradient(135deg, #ff0000, #ff4444); border-radius: 8px;">
                   <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5v-9l6 4.5-6 4.5z"/>
                 </svg>
                 <svg v-else xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <path d="M9 18V5l12-2v13"></path>
                   <circle cx="6" cy="18" r="3"></circle>
                   <circle cx="18" cy="16" r="3"></circle>
                 </svg>
               </div>
               <div class="now-playing-info">
                 <div class="now-playing-track" :title="currentMusicSession.window_title || 'Unknown Track'">{{ currentMusicSession.window_title || 'Unknown Track' }}</div>
                 <div class="now-playing-app">{{ currentMusicSession.app_name }}</div>
               </div>
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

    <!-- Music History Modal -->
    <Teleport to="body">
      <div v-if="showMusicHistory" class="modal-overlay" @click.self="showMusicHistory = false">
        <div class="modal-content animate-enter music-history-modal">
          <div class="modal-header">
            <div class="music-history-title">
              <div class="music-history-icon" :style="{ background: musicHistoryColor }">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 18V5l12-2v13"></path>
                  <circle cx="6" cy="18" r="3"></circle>
                  <circle cx="18" cy="16" r="3"></circle>
                </svg>
              </div>
              <div>
                <h3>{{ musicHistoryApp }}</h3>
                <span class="music-history-total">{{ formatDuration(musicHistoryTotalTime) }} total</span>
              </div>
            </div>
            <button class="close-btn" @click="showMusicHistory = false">×</button>
          </div>
          <div class="modal-body custom-scrollbar" style="max-height: 60vh;">
            <div v-if="musicHistorySessions.length === 0" class="empty-day">No music sessions recorded</div>
            <div v-else class="music-sessions-list">
              <div v-for="session in musicHistorySessions" :key="session.id" class="music-session-item">
                <div class="music-session-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 18V5l12-2v13"></path>
                    <circle cx="6" cy="18" r="3"></circle>
                    <circle cx="18" cy="16" r="3"></circle>
                  </svg>
                </div>
                <div class="music-session-info">
                  <div class="music-session-track">{{ session.window_title || 'Unknown Track' }}</div>
                  <div class="music-session-date">{{ formatDate(session.start_time) }}</div>
                </div>
                <div class="music-session-time">
                  <div class="music-session-dur">{{ formatDuration(session.duration_seconds) }}</div>
                  <div class="music-session-range">{{ formatTimeShort(session.start_time) }} – {{ session.end_time ? formatTimeShort(session.end_time) : 'Now' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Website History Modal -->
    <Teleport to="body">
      <div v-if="showWebsiteHistory" class="modal-overlay" @click.self="showWebsiteHistory = false">
        <div class="modal-content animate-enter website-history-modal">
          <div class="modal-header">
            <div class="website-history-title">
              <div class="website-history-icon">
                <img :src="getFaviconUrl(websiteHistoryName)" class="website-history-favicon" :alt="websiteHistoryName" @error="handleWebsiteFaviconError($event, websiteHistoryName)" />
              </div>
              <div>
                <h3>{{ websiteHistoryName }}</h3>
                <span class="website-history-total">{{ formatDuration(websiteHistoryTotalTime) }} total</span>
              </div>
            </div>
            <button class="close-btn" @click="showWebsiteHistory = false">×</button>
          </div>
          <div class="modal-body custom-scrollbar" style="max-height: 60vh;">
            <div v-if="websiteHistorySessions.length === 0" class="empty-day">No browsing sessions recorded</div>
            <div v-else class="website-sessions-list">
              <div v-for="session in websiteHistorySessions" :key="session.id" class="website-session-item">
                <div class="website-session-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                </div>
                <div class="website-session-info">
                  <div class="website-session-title">{{ session.window_title || 'Unknown Page' }}</div>
                  <div class="website-session-url" :title="extractUrl(session.window_title)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline;vertical-align:middle;margin-right:4px;">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                    {{ extractUrl(session.window_title) }}
                  </div>
                </div>
                <div class="website-session-time">
                  <div class="website-session-dur">{{ formatDuration(session.duration_seconds) }}</div>
                  <div class="website-session-range">{{ formatTimeShort(session.start_time) }} – {{ session.end_time ? formatTimeShort(session.end_time) : 'Now' }}</div>
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
import { computed, onMounted, ref, watch } from 'vue';
import { useActivityStore, type ActivitySession, type MusicSession } from '../stores/activity';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Pie } from 'vue-chartjs';
import { useI18n } from 'vue-i18n';
import { Icons } from '../components/icons/IconMap';
import { invoke } from '@tauri-apps/api/core';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend, Filler);

const { t } = useI18n();
const store = useActivityStore();
const showDetailModal = ref(false);

// Current music session from store (for "Now Playing")
const currentMusicSession = computed(() => store.currentMusicSession);

// App icons
const appIcons = ref<Record<string, string>>({});

// Music History Modal
const showMusicHistory = ref(false);
const musicHistoryApp = ref('');
const musicHistorySessions = ref<MusicSession[]>([]);
const musicHistoryTotalTime = ref(0);
const musicHistoryColor = ref('#ec4899');
// Я забув що ви не розумієте моєї мови, хоча зря :3
// Website History Modal
const showWebsiteHistory = ref(false);
const websiteHistoryName = ref('');
const websiteHistorySessions = ref<ActivitySession[]>([]);
const websiteHistoryTotalTime = ref(0);

// Favicon cache
const faviconCache = ref<Record<string, string>>({});
const faviconErrors = ref<Set<string>>(new Set());

function getMusicPercentage(seconds: number): number {
  if (store.totalMusicTime === 0) return 0;
  return Math.min(100, Math.round((seconds / store.totalMusicTime) * 100));
}

function calculateWebsitePercentage(seconds: number): number {
  const total = store.websiteUsage.reduce((acc, site) => acc + site.seconds, 0) || 1;
  return Math.round((seconds / total) * 100);
}

function getRankClass(index: number): string {
  if (index === 0) return 'gold';
  if (index === 1) return 'silver';
  if (index === 2) return 'bronze';
  return '';
}

function getWebsiteBarGradient(index: number): string {
  const gradients = [
    'linear-gradient(90deg, #06b6d4, #22d3ee)',
    'linear-gradient(90deg, #8b5cf6, #a78bfa)',
    'linear-gradient(90deg, #ec4899, #f472b6)',
    'linear-gradient(90deg, #f59e0b, #fbbf24)',
    'linear-gradient(90deg, #10b981, #34d399)',
  ];
  return gradients[index % gradients.length];
}

function getMusicGradient(index: number): string {
  const gradients = [
    'linear-gradient(135deg, #ec4899, #db2777)',
    'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    'linear-gradient(135deg, #06b6d4, #0891b2)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #10b981, #059669)',
  ];
  return gradients[index % gradients.length];
}

function getMusicBarGradient(index: number): string {
  const gradients = [
    'linear-gradient(90deg, #ec4899, #f472b6)',
    'linear-gradient(90deg, #8b5cf6, #a78bfa)',
    'linear-gradient(90deg, #06b6d4, #22d3ee)',
    'linear-gradient(90deg, #f59e0b, #fbbf24)',
    'linear-gradient(90deg, #10b981, #34d399)',
  ];
  return gradients[index % gradients.length];
}

function getFaviconUrl(siteName: string): string {
  if (faviconCache.value[siteName]) return faviconCache.value[siteName];

  // Try to extract domain from site name
  const domain = extractDomain(siteName);
  if (domain) {
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    faviconCache.value[siteName] = faviconUrl;
    return faviconUrl;
  }

  // Fallback: return a default favicon URL
  return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2306b6d4" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
}

function extractDomain(siteName: string): string | null {
  // Clean up site name
  const cleanName = siteName.trim();

  // Direct domain patterns
  const domainPatterns = [
    { pattern: /youtube/i, domain: 'youtube.com' },
    { pattern: /google/i, domain: 'google.com' },
    { pattern: /facebook/i, domain: 'facebook.com' },
    { pattern: /twitter/i, domain: 'twitter.com' },
    { pattern: /\bx\b/i, domain: 'x.com' },
    { pattern: /instagram/i, domain: 'instagram.com' },
    { pattern: /reddit/i, domain: 'reddit.com' },
    { pattern: /stackoverflow/i, domain: 'stackoverflow.com' },
    { pattern: /amazon/i, domain: 'amazon.com' },
    { pattern: /netflix/i, domain: 'netflix.com' },
    { pattern: /spotify/i, domain: 'spotify.com' },
    { pattern: /discord/i, domain: 'discord.com' },
    { pattern: /telegram/i, domain: 'telegram.org' },
    { pattern: /whatsapp/i, domain: 'whatsapp.com' },
    { pattern: /tiktok/i, domain: 'tiktok.com' },
    { pattern: /pinterest/i, domain: 'pinterest.com' },
    { pattern: /linkedin/i, domain: 'linkedin.com' },
    { pattern: /medium/i, domain: 'medium.com' },
    { pattern: /vivaldi/i, domain: 'vivaldi.com' },
  ];

  for (const { pattern, domain } of domainPatterns) {
    if (pattern.test(cleanName)) {
      return `https://${domain}`;
    }
  }

  // Try to detect URL pattern in site name
  const urlPattern = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/i;
  const match = cleanName.match(urlPattern);
  if (match) {
    return `https://${match[1]}`;
  }

  return null;
}

function handleFaviconError(event: Event, siteName: string) {
  const target = event.target as HTMLImageElement;
  faviconErrors.value.add(siteName);
  // Set fallback SVG as source
  target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44"><rect width="44" height="44" rx="10" fill="rgba(6,182,212,0.2)"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="20" font-weight="bold" fill="%2306b6d4">' + encodeURIComponent(siteName.charAt(0).toUpperCase()) + '</text></svg>';
}

function handleWebsiteFaviconError(event: Event, siteName: string) {
  const target = event.target as HTMLImageElement;
  // Set fallback SVG as source
  target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44"><rect width="44" height="44" rx="10" fill="rgba(6,182,212,0.2)"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="20" font-weight="bold" fill="%2306b6d4">' + encodeURIComponent(siteName.charAt(0).toUpperCase()) + '</text></svg>';
}

async function loadIcon(appName: string, path: string) {
  if (appIcons.value[appName] || !path) return;
  try {
    const base64 = await invoke<string | null>('get_app_icon', { path });
    if (base64) {
      appIcons.value[appName] = `data:image/png;base64,${base64}`;
    }
  } catch (error) {
    console.error('Failed to load icon:', error);
  }
}

async function openMusicHistory(appName: string) {
  musicHistoryApp.value = appName;
  musicHistoryColor.value = getAppColor(appName);
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Use the dedicated music activity range method
    const musicSessions = await store.getMusicActivityRange(today, today);
    
    // Normalize app name for comparison
    const targetName = appName.toLowerCase();
    
    // Common music app name variations
    const musicAppVariations = [
      targetName,
      targetName + ' music',
      targetName + '.exe',
      targetName.replace(' music', ''),
    ];
    
    // For Spotify specifically, also check for "spotify music"
    if (targetName.includes('spotify')) {
      musicAppVariations.push('spotify music', 'spotifymusic');
    }
    
    // Filter sessions by app name
    const filteredSessions = musicSessions
      .filter(s => {
        const sessionName = s.app_name.toLowerCase();
        // Check all variations
        return musicAppVariations.some(variation => 
          sessionName === variation || 
          sessionName.includes(variation) || 
          variation.includes(sessionName)
        );
      })
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    
    musicHistorySessions.value = filteredSessions as MusicSession[];
    musicHistoryTotalTime.value = filteredSessions.reduce((acc, s) => acc + s.duration_seconds, 0);
    showMusicHistory.value = true;
  } catch (error) {
    console.error('Failed to fetch music history:', error);
  }
}

async function openWebsiteHistory(siteName: string) {
  websiteHistoryName.value = siteName;
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const sessions = await store.getActivityRange(today, today);
    
    // Filter browser sessions that match this site
    const BROWSERS = ['chrome', 'msedge', 'firefox', 'opera', 'brave', 'vivaldi'];
    const websiteSessions = sessions
      .filter(s => {
        const appNameLower = s.app_name.toLowerCase();
        const isBrowser = BROWSERS.some(b => appNameLower.includes(b));
        const title = s.window_title || '';
        // Check if site name appears in the title
        const matchesSite = title.toLowerCase().includes(siteName.toLowerCase()) || 
                           siteName.toLowerCase().includes(title.toLowerCase());
        return isBrowser && matchesSite;
      })
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    
    websiteHistorySessions.value = websiteSessions;
    websiteHistoryTotalTime.value = websiteSessions.reduce((acc, s) => acc + s.duration_seconds, 0);
    showWebsiteHistory.value = true;
  } catch (error) {
    console.error('Failed to fetch website history:', error);
  }
}

function extractUrl(windowTitle: string): string {
  if (!windowTitle) return '';
  
  // Remove browser suffixes first
  let cleanTitle = windowTitle
    .replace(/ - Google Chrome$/i, '')
    .replace(/ - Microsoft Edge$/i, '')
    .replace(/ - Mozilla Firefox$/i, '')
    .replace(/ - Opera$/i, '')
    .replace(/ - Brave$/i, '')
    .replace(/ - Vivaldi$/i, '')
    .replace(/^\(\d+\)\s*/i, ''); // Remove notification counts like "(1)"
  
  // Try to extract URL from various patterns
  
  // Pattern 1: Full URL in title (e.g., "https://youtube.com - Video Title")
  const fullUrlPattern = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/i;
  const fullUrlMatch = cleanTitle.match(fullUrlPattern);
  if (fullUrlMatch) {
    return fullUrlMatch[1];
  }
  
  // Pattern 2: Domain pattern (e.g., "youtube.com" somewhere in title)
  const domainPattern = /\b([a-zA-Z0-9-]+\.(?:com|org|net|io|co|edu|gov|mil|biz|info|me|tv|fm|ly|app|dev|ai|ru|ua|de|fr|es|it|jp|cn|in|br|mx|nl|se|no|dk|fi|pl|cz|sk|hu|ro|bg|hr|si|rs|ua|by|kz|az|ge|am|md|lt|lv|ee)\b(?:\/[^\s<>"{}|\\^`\[\]]*)?)/i;
  const domainMatch = cleanTitle.match(domainPattern);
  if (domainMatch) {
    return 'https://' + domainMatch[1];
  }
  
  // Pattern 3: For YouTube specifically - extract video URL
  if (/youtube/i.test(cleanTitle)) {
    const videoIdMatch = cleanTitle.match(/watch\?v=([a-zA-Z0-9_-]+)/i);
    if (videoIdMatch) {
      return `https://youtube.com/watch?v=${videoIdMatch[1]}`;
    }
    return 'https://youtube.com';
  }
  
  // Pattern 4: For common sites
  const commonSites: Record<string, string> = {
    'youtube studio': 'https://studio.youtube.com',
    'youtube творческая студия': 'https://studio.youtube.com',
    'google': 'https://google.com',
    'facebook': 'https://facebook.com',
    'twitter': 'https://twitter.com',
    'instagram': 'https://instagram.com',
    'reddit': 'https://reddit.com',
    'stackoverflow': 'https://stackoverflow.com',
    'netflix': 'https://netflix.com',
    'spotify': 'https://spotify.com',
    'discord': 'https://discord.com',
    'telegram': 'https://telegram.org',
    'tiktok': 'https://tiktok.com',
    'pinterest': 'https://pinterest.com',
    'linkedin': 'https://linkedin.com',
    'medium': 'https://medium.com',
    'vivaldi': 'https://vivaldi.com',
  };
  
  const cleanTitleLower = cleanTitle.toLowerCase();
  for (const [key, url] of Object.entries(commonSites)) {
    if (cleanTitleLower.includes(key)) {
      return url;
    }
  }
  
  // If no URL found, return the cleaned title
  return cleanTitle.trim();
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Time range
const selectedRange = ref<'day' | 'week' | 'month'>('week');
const dayOffset = ref(0);
const monthOffset = ref(0);

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

function getMonthRange(offset: number): { from: string; to: string } {
  const now = new Date();
  const targetMonth = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
  
  return {
    from: targetMonth.toISOString().split('T')[0],
    to: lastDay.toISOString().split('T')[0]
  };
}

function getDayRange(offset: number): { from: string; to: string } {
  const now = new Date();
  now.setDate(now.getDate() + offset);
  const dateStr = now.toISOString().split('T')[0];
  return { from: dateStr, to: dateStr };
}

const weekRangeLabel = computed(() => {
  if (weekOffset.value === 0) return t('analytics.last7Days') || 'This Week';
  const { from, to } = getWeekRange(weekOffset.value);
  const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${fmt(from)} – ${fmt(to)}`;
});

const periodLabel = computed(() => {
  if (selectedRange.value === 'day') {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset.value);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  } else if (selectedRange.value === 'week') {
    return weekRangeLabel.value;
  } else {
    const now = new Date();
    const month = new Date(now.getFullYear(), now.getMonth() + monthOffset.value, 1);
    return month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }
});

const isCurrentPeriod = computed(() => {
  if (selectedRange.value === 'day') return dayOffset.value === 0;
  if (selectedRange.value === 'week') return weekOffset.value === 0;
  return monthOffset.value === 0;
});

function prevPeriod() {
  if (selectedRange.value === 'day') {
    dayOffset.value--;
  } else if (selectedRange.value === 'week') {
    weekOffset.value--;
  } else {
    monthOffset.value--;
  }
  fetchPeriodData();
}

function nextPeriod() {
  if (selectedRange.value === 'day') {
    if (dayOffset.value < 0) dayOffset.value++;
  } else if (selectedRange.value === 'week') {
    if (weekOffset.value < 0) weekOffset.value++;
  } else {
    if (monthOffset.value < 0) monthOffset.value++;
  }
  fetchPeriodData();
}

async function fetchPeriodData() {
  // If it's the current period and we are on week/day view and offset is 0
  // we could potentially just use store methods, but custom fetching covers all bases uniformly.
  let fromStr = '';
  let toStr = '';

  if (selectedRange.value === 'day') {
    const { from, to } = getDayRange(dayOffset.value);
    fromStr = from;
    toStr = to;
  } else if (selectedRange.value === 'week') {
    if (weekOffset.value === 0) {
      await store.fetchTodayData();
      await store.fetchWeeklyStats();
      return; // Uses store default
    }
    const { from, to } = getWeekRange(weekOffset.value);
    fromStr = from;
    toStr = to;
  } else if (selectedRange.value === 'month') {
    const { from, to } = getMonthRange(monthOffset.value);
    fromStr = from;
    toStr = to;
  }

  const sessions = await store.getActivityRange(fromStr, toStr);
  
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
  const start = new Date(fromStr);
  const end = new Date(toStr);
  
  // If viewing a single day, just show one data point
  if (start.getTime() === end.getTime()) {
    const key = start.toISOString().split('T')[0];
    result.push(daily[key] || { date: key, total_seconds: 0, app_count: 0 });
  } else {
    for (let d = new Date(end); d >= start; d.setDate(d.getDate() - 1)) {
      const key = d.toISOString().split('T')[0];
      result.push(daily[key] || { date: key, total_seconds: 0, app_count: 0 });
    }
  }
  
  customWeeklyStats.value = result;
}

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

function formatTimeReadable(seconds: number): string {
  if (!seconds) return '0s';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatDurationFull(seconds: number): string {
  if (!seconds) return '0 seconds';
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} minute${mins > 1 ? 's' : ''}${secs > 0 ? ` ${secs} second${secs > 1 ? 's' : ''}` : ''}`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours} hour${hours > 1 ? 's' : ''}${mins > 0 ? ` ${mins} minute${mins > 1 ? 's' : ''}` : ''}`;
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

onMounted(async () => {
  await fetchPeriodData();
  // Load icons for music apps
  store.musicApps.forEach(app => {
    if (app.exe_path) {
      loadIcon(app.app_name, app.exe_path);
    }
  });
  if (currentMusicSession.value?.exe_path) {
    loadIcon(currentMusicSession.value.app_name, currentMusicSession.value.exe_path);
  }
});

// Watch for range changes and reset offset + fetch data
watch(selectedRange, async () => {
  dayOffset.value = 0;
  weekOffset.value = 0;
  monthOffset.value = 0;
  await fetchPeriodData();
});
</script>

<style scoped>
.analytics-page { 
  padding-bottom: 40px; 
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 36px;
  flex-wrap: wrap;
  gap: 20px;
}

.header-left h2 {
  background: linear-gradient(135deg, #fff 30%, #818cf8, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.subtitle { 
  color: var(--text-muted); 
  font-size: 1rem; 
  margin-top: 6px; 
  font-weight: 400;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.view-selector {
  display: flex;
  gap: 5px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03));
  padding: 5px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.view-btn {
  background: transparent;
  border: none;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
}

.view-btn svg {
  pointer-events: none;
}

.view-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-main);
  transform: scale(1.05);
}

.view-btn.active {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: white;
  box-shadow: 0 4px 12px rgba(99,102,241,0.3);
}

.time-range-selector {
  display: flex;
  gap: 5px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03));
  padding: 5px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.range-btn {
  background: transparent;
  border: none;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 0.85rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.range-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: var(--text-main);
}

.range-btn.active {
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
  color: white;
  box-shadow: 0 4px 12px rgba(99,102,241,0.25);
}

.nav-btn {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
  color: #fff;
  transform: scale(1.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.date-range-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.03));
  padding: 10px 18px;
  border-radius: 22px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-main);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 150px;
  justify-content: center;
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
}

.date-range-badge:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
}

.range-icon {
  opacity: 0.7;
}

/* Stats Row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 36px;
}

.stat-card.premium-card {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 22px;
  padding: 26px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.stat-card:hover { 
  transform: translateY(-6px);
}

.stat-card.purple { 
  border-color: rgba(99, 102, 241, 0.2);
  background: linear-gradient(145deg, rgba(99, 102, 241, 0.08), rgba(255, 255, 255, 0.02));
}
.stat-card.purple:hover {
  box-shadow: 0 12px 40px rgba(99, 102, 241, 0.2), 0 0 80px rgba(99, 102, 241, 0.08);
  border-color: rgba(99, 102, 241, 0.4);
}
.stat-card.purple::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent, #6366f1, transparent);
  opacity: 0; transition: opacity 0.4s;
}
.stat-card.purple:hover::before { opacity: 1; }

.stat-card.blue { 
  border-color: rgba(6, 182, 212, 0.2);
  background: linear-gradient(145deg, rgba(6, 182, 212, 0.08), rgba(255, 255, 255, 0.02));
}
.stat-card.blue:hover {
  box-shadow: 0 12px 40px rgba(6, 182, 212, 0.2), 0 0 80px rgba(6, 182, 212, 0.08);
  border-color: rgba(6, 182, 212, 0.4);
}
.stat-card.blue::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent, #06b6d4, transparent);
  opacity: 0; transition: opacity 0.4s;
}
.stat-card.blue:hover::before { opacity: 1; }

.stat-card.orange { 
  border-color: rgba(249, 115, 22, 0.2);
  background: linear-gradient(145deg, rgba(249, 115, 22, 0.08), rgba(255, 255, 255, 0.02));
}
.stat-card.orange:hover {
  box-shadow: 0 12px 40px rgba(249, 115, 22, 0.2), 0 0 80px rgba(249, 115, 22, 0.08);
  border-color: rgba(249, 115, 22, 0.4);
}
.stat-card.orange::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent, #f97316, transparent);
  opacity: 0; transition: opacity 0.4s;
}
.stat-card.orange:hover::before { opacity: 1; }

.stat-bg-icon {
  position: absolute; right: -10px; bottom: -10px;
  width: 90px; height: 90px; opacity: 0.1;
  transform: rotate(-15deg); pointer-events: none; transition: all 0.4s;
}
.stat-card:hover .stat-bg-icon { opacity: 0.2; transform: rotate(-10deg) scale(1.15); }
.stat-bg-icon :deep(svg) { width: 100%; height: 100%; stroke: currentColor; fill: currentColor; }

.stat-label { 
  font-size: 0.9rem; 
  color: var(--text-muted); 
  margin-bottom: 6px; 
  display: block;
  font-weight: 500;
}
.stat-value { 
  font-size: 1.65rem; 
  font-weight: 800; 
  color: #fff;
  letter-spacing: -0.5px;
}
.text-ellipsis { 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  max-width: 160px; 
  display: block;
  font-weight: 600;
}
.stat-trend { 
  font-size: 0.75rem; 
  color: var(--text-muted); 
  margin-top: 6px;
  font-weight: 500;
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 28px;
  margin-bottom: 36px;
}

.chart-card {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.chart-card:hover {
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25), 0 0 30px rgba(99,102,241,0.08);
  transform: translateY(-3px);
}

.large-chart { grid-column: span 2; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-header h3 {
  font-size: 1.05rem; 
  font-weight: 700; 
  color: #fff;
  display: flex; 
  align-items: center; 
  gap: 10px;
  letter-spacing: -0.3px;
}

.card-header h3::before {
  content: ''; 
  width: 5px; 
  height: 20px;
  background: linear-gradient(180deg, #6366f1, #8b5cf6); 
  border-radius: 3px;
  box-shadow: 0 0 10px rgba(99,102,241,0.5);
}

.card-header.flex-between h3::before {
  background: linear-gradient(180deg, #06b6d4, #0ea5e9);
  box-shadow: 0 0 10px rgba(6,182,212,0.5);
}

.chart-container { 
  height: 260px; 
  width: 100%; 
  position: relative; 
}

/* Pie Chart Layout */
.pie-container { 
  display: flex; 
  align-items: center; 
  gap: 24px; 
}

.pie-wrapper { 
  flex: 1; 
  height: 220px; 
  position: relative; 
}

.custom-legend { 
  width: 160px; 
  display: flex; 
  flex-direction: column; 
  gap: 12px; 
}

.legend-item {
  display: flex; 
  align-items: center; 
  font-size: 0.85rem; 
  gap: 10px;
  padding: 8px 12px; 
  border-radius: 10px; 
  transition: all 0.2s;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.04);
}

.legend-item:hover { 
  background: rgba(255, 255, 255, 0.08); 
  border-color: rgba(255,255,255,0.1);
  transform: translateX(4px);
}

.legend-dot { 
  width: 12px; 
  height: 12px; 
  border-radius: 50%; 
  flex-shrink: 0;
  box-shadow: 0 0 8px currentColor;
}

.legend-name { 
  flex: 1; 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  color: var(--text-muted);
  font-weight: 500;
}

.legend-percent { 
  font-weight: 700; 
  color: #fff; 
  font-size: 0.85rem;
  background: rgba(255,255,255,0.1);
  padding: 4px 8px;
  border-radius: 6px;
}

.btn-icon {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 36px; 
  height: 36px; 
  border-radius: 10px;
  color: var(--text-muted); 
  cursor: pointer;
  display: flex; 
  align-items: center; 
  justify-content: center; 
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-icon:hover { 
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
  color: #fff; 
  transform: scale(1.08);
  border-color: rgba(255, 255, 255, 0.2);
}

/* Websites Grid */
.websites-section {
  border: 1px solid rgba(6, 182, 212, 0.25);
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.06), rgba(14, 165, 233, 0.04));
  border-radius: 20px;
  padding: 24px;
  backdrop-filter: blur(10px);
}

.websites-section .section-header {
  margin-bottom: 20px;
}

.websites-section .section-header h3 {
  color: #06b6d4;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.websites-section .section-header h3::before {
  background: linear-gradient(180deg, #06b6d4, #0ea5e9);
  box-shadow: 0 0 10px rgba(6,182,212,0.5);
}

.websites-badge {
  background: linear-gradient(135deg, #06b6d4, #0ea5e9);
  color: #fff;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 0.8rem;
  box-shadow: 0 2px 8px rgba(6,182,212,0.3);
}

.website-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.website-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
  padding: 18px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.website-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #06b6d4, #0ea5e9);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.website-card:hover::before {
  opacity: 1;
}

.website-card:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
  border-color: rgba(6, 182, 212, 0.4);
  transform: translateX(8px);
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.2);
}

.website-rank {
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.website-rank.gold {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  box-shadow: 0 2px 10px rgba(251, 191, 36, 0.5);
}

.website-rank.silver {
  background: linear-gradient(135deg, #94a3b8, #64748b);
  box-shadow: 0 2px 10px rgba(148, 163, 184, 0.4);
}

.website-rank.bronze {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  box-shadow: 0 2px 10px rgba(245, 158, 11, 0.4);
}

.website-icon-wrapper {
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.website-favicon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.website-card:hover .website-favicon {
  transform: scale(1.08);
  border-color: rgba(6, 182, 212, 0.5);
  background: rgba(6, 182, 212, 0.1);
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.2);
}

.website-info {
  flex: 1;
  min-width: 0;
}

.website-name {
  font-size: 0.95rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 10px;
  color: #fff;
  letter-spacing: -0.3px;
}

.website-bar-bg {
  height: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 3px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.website-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 8px currentColor;
}

.website-time {
  text-align: right;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.website-time .time-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: #06b6d4;
  font-feature-settings: "tnum";
  letter-spacing: -0.3px;
}

.website-time .time-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-weight: 500;
}

.website-view-history {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(14, 165, 233, 0.1));
  color: #06b6d4;
  opacity: 0;
  transition: all 0.3s ease;
  flex-shrink: 0;
  border: 1px solid rgba(6, 182, 212, 0.2);
}

.website-card:hover .website-view-history {
  opacity: 1;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(14, 165, 233, 0.15));
  transform: translateX(4px);
  border-color: rgba(6, 182, 212, 0.4);
}

/* Empty State */
.empty-state { 
  text-align: center; 
  padding: 80px 20px; 
  background: linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,0.06);
}

.empty-icon { 
  font-size: 4rem; 
  margin-bottom: 20px;
  opacity: 0.5;
  filter: grayscale(0.3);
}

.empty-state h3 {
  background: linear-gradient(135deg, #fff, #818cf8, #6366f1);
  -webkit-background-clip: text; 
  -webkit-text-fill-color: transparent; 
  background-clip: text;
  margin-bottom: 10px;
  font-size: 1.3rem;
  font-weight: 700;
}

.empty-state p { 
  color: var(--text-muted); 
  font-size: 0.95rem;
  font-weight: 400;
}

/* Modal */
.modal-overlay {
  position: fixed; 
  inset: 0; 
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12px); 
  z-index: 100;
  display: flex; 
  align-items: center; 
  justify-content: center;
  padding: 20px;
}

.modal-content {
  background: linear-gradient(145deg, rgba(30, 34, 48, 0.95), rgba(26, 27, 38, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px; 
  width: 650px; 
  max-width: 90%; 
  max-height: 80vh;
  display: flex; 
  flex-direction: column; 
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(99,102,241,0.1);
}

.modal-header {
  padding: 24px 28px; 
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  background: linear-gradient(135deg, rgba(255,255,255,0.02), transparent);
}

.modal-header h3 {
  font-size: 1.2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #fff, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.close-btn {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 1.4rem; 
  color: var(--text-muted); 
  cursor: pointer;
  width: 36px; 
  height: 36px; 
  border-radius: 10px;
  display: flex; 
  align-items: center; 
  justify-content: center; 
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.close-btn:hover { 
  color: #fff; 
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.08));
  border-color: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.modal-body { 
  padding: 0; 
  overflow-y: auto; 
}

.data-table { 
  width: 100%; 
  border-collapse: collapse; 
}

.data-table th {
  text-align: left; 
  padding: 18px 28px; 
  color: var(--text-muted);
  font-weight: 600; 
  font-size: 0.85rem; 
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.data-table td { 
  padding: 16px 28px; 
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  color: var(--text-main);
}

.table-row { 
  transition: all 0.2s; 
}

.table-row:hover { 
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
  transform: translateX(4px);
}

.app-row { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
}

.app-icon-mini {
  width: 32px; 
  height: 32px; 
  border-radius: 10px;
  display: flex; 
  align-items: center; 
  justify-content: center;
  color: #fff; 
  font-size: 0.85rem; 
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}

.mono-font { 
  font-family: 'Consolas', monospace; 
  color: var(--text-muted);
  font-weight: 500;
}

.percent-pill {
  display: inline-block; 
  padding: 6px 12px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15));
  border-radius: 14px; 
  font-size: 0.85rem; 
  font-weight: 700; 
  color: #818cf8;
  border: 1px solid rgba(129, 140, 248, 0.2);
}

.custom-scrollbar::-webkit-scrollbar { 
  width: 6px; 
}

.custom-scrollbar::-webkit-scrollbar-thumb { 
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.1)); 
  border-radius: 3px; 
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
}

@media (max-width: 900px) {
  .stats-row { 
    grid-template-columns: 1fr; 
  }
  
  .charts-grid { 
    grid-template-columns: 1fr; 
  }
  
  .large-chart { 
    grid-column: span 1; 
  }
  
  .pie-container { 
    flex-direction: column; 
    height: auto; 
    padding: 20px 0;
  }
  
  .pie-wrapper { 
    height: 220px; 
    width: 100%; 
  }
  
  .custom-legend { 
    width: 100%; 
    flex-direction: row; 
    flex-wrap: wrap; 
    justify-content: center;
  }
  
  .legend-item {
    font-size: 0.8rem;
    padding: 6px 10px;
  }
  
  .website-grid {
    grid-template-columns: 1fr;
  }
  
  .music-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .view-selector,
  .time-range-selector {
    order: 2;
  }
  
  .nav-btn,
  .date-range-badge {
    order: 1;
  }
  
  .header-left h2 {
    font-size: 1.5rem;
  }
}

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

/* Daily Detail Modal */
.empty-day { 
  text-align: center; 
  padding: 60px 40px; 
  color: var(--text-muted); 
  font-size: 1rem;
  font-weight: 500;
}

.day-sessions { 
  display: flex; 
  flex-direction: column; 
  gap: 4px; 
  padding: 8px 0;
}

.day-session-item {
  display: flex; 
  align-items: center; 
  gap: 16px; 
  padding: 16px 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
  border-bottom: 1px solid rgba(255,255,255,0.04);
  border-radius: 12px;
}

.day-session-item:hover { 
  background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02)); 
  transform: translateX(8px);
  border-color: rgba(255,255,255,0.08);
}

.day-session-icon {
  width: 40px; 
  height: 40px; 
  border-radius: 12px;
  display: flex; 
  align-items: center; 
  justify-content: center;
  color: #fff; 
  font-weight: 700; 
  font-size: 1rem; 
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.day-session-info { 
  flex: 1; 
  min-width: 0; 
}

.day-session-app { 
  font-weight: 700; 
  font-size: 1rem; 
  margin-bottom: 4px;
  letter-spacing: -0.3px;
}

.day-session-title {
  font-size: 0.85rem; 
  color: var(--text-muted);
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis;
  font-weight: 400;
}

.day-session-time { 
  text-align: right; 
  flex-shrink: 0; 
}

.day-session-dur { 
  font-weight: 700; 
  font-size: 0.95rem; 
  color: var(--color-primary);
  letter-spacing: -0.3px;
}

.day-session-range { 
  font-size: 0.8rem; 
  color: var(--text-muted); 
  font-feature-settings: "tnum";
  font-weight: 500;
}

/* Music Section */
.music-section {
  border: 1px solid rgba(236, 72, 153, 0.25);
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.06), rgba(139, 92, 246, 0.04));
  border-radius: 20px;
  padding: 24px;
  backdrop-filter: blur(10px);
}

.music-section .section-header {
  margin-bottom: 20px;
}

.music-section .section-header h3 {
  color: #ec4899;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.music-section .section-header h3::before {
  background: linear-gradient(180deg, #ec4899, #8b5cf6);
  box-shadow: 0 0 10px rgba(236,72,153,0.5);
}

.total-music {
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  color: #fff;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 0.8rem;
  box-shadow: 0 2px 8px rgba(236,72,153,0.3);
}

.music-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.music-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
  padding: 18px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.music-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #ec4899, #8b5cf6);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.music-card:hover::before {
  opacity: 1;
}

.music-card:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 0.04));
  border-color: rgba(236, 72, 153, 0.4);
  transform: translateX(8px);
  box-shadow: 0 8px 24px rgba(236, 72, 153, 0.2);
}

.music-rank {
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.music-rank.gold {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  box-shadow: 0 2px 10px rgba(251, 191, 36, 0.5);
}

.music-rank.silver {
  background: linear-gradient(135deg, #94a3b8, #64748b);
  box-shadow: 0 2px 10px rgba(148, 163, 184, 0.4);
}

.music-rank.bronze {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  box-shadow: 0 2px 10px rgba(245, 158, 11, 0.4);
}

.music-icon-wrapper {
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.music-app-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: contain;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.music-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.music-card:hover .music-icon,
.music-card:hover .music-app-icon {
  transform: scale(1.08);
  border-color: rgba(236, 72, 153, 0.5);
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.2);
}

.music-info {
  flex: 1;
  min-width: 0;
}

.music-app-name {
  font-size: 0.95rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 10px;
  color: #fff;
  letter-spacing: -0.3px;
}

.music-bar-bg {
  height: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 3px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.music-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 8px currentColor;
}

.music-time {
  text-align: right;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.music-time .time-value {
  font-size: 0.95rem;
  font-weight: 700;
  color: #ec4899;
  font-feature-settings: "tnum";
  letter-spacing: -0.3px;
}

.music-time .time-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-weight: 500;
}

.music-view-history {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(139, 92, 246, 0.1));
  color: #ec4899;
  opacity: 0;
  transition: all 0.3s ease;
  flex-shrink: 0;
  border: 1px solid rgba(236, 72, 153, 0.2);
}

.music-card:hover .music-view-history {
  opacity: 1;
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(139, 92, 246, 0.15));
  transform: translateX(4px);
  border-color: rgba(236, 72, 153, 0.4);
}

/* Now Playing */
.now-playing {
  margin-top: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(236, 72, 153, 0.2);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  position: relative;
}

.now-playing::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, #ec4899, #8b5cf6, #ec4899);
  background-size: 200% 100%;
  animation: gradientMove 3s ease infinite;
}

.now-playing-header {
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-weight: 600;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

@keyframes gradientMove {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.now-playing-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 800;
  color: #ef4444;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1));
  padding: 4px 10px;
  border-radius: 12px;
  margin-left: auto;
  border: 1px solid rgba(239, 68, 68, 0.3);
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.2);
}

.now-playing-content {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 20px;
}

.now-playing-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(236, 72, 153, 0.4);
  border: 1px solid rgba(236, 72, 153, 0.3);
}

.now-playing-app-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  object-fit: contain;
}

.now-playing-info {
  flex: 1;
  min-width: 0;
}

.now-playing-track {
  font-size: 1.05rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fff;
  margin-bottom: 6px;
  letter-spacing: -0.3px;
}

.now-playing-app {
  font-size: 0.9rem;
  color: var(--text-muted);
  font-weight: 500;
}

.now-playing-live {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #ef4444;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1));
  padding: 6px 14px;
  border-radius: 14px;
  flex-shrink: 0;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.live-indicator {
  width: 9px;
  height: 9px;
  background: #ef4444;
  border-radius: 50%;
  animation: pulse-live 1.5s infinite;
  box-shadow: 0 0 8px #ef4444;
}

@keyframes pulse-live {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.15); }
}

/* Music History Modal */
.music-history-modal {
  max-width: 700px;
}

.music-history-title {
  display: flex;
  align-items: center;
  gap: 14px;
}

.music-history-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
}

.music-history-total {
  display: block;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.music-sessions-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.music-session-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  transition: all 0.2s;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.music-session-item:hover {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(139, 92, 246, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ec4899;
  flex-shrink: 0;
  transform: translateX(4px);
}

.music-session-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(139, 92, 246, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ec4899;
  flex-shrink: 0;
}

.music-session-info {
  flex: 1;
  min-width: 0;
}

.music-session-track {
  font-size: 0.95rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fff;
  margin-bottom: 4px;
}

.music-session-date {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.music-session-time {
  text-align: right;
  flex-shrink: 0;
}

.music-session-dur {
  font-size: 0.9rem;
  font-weight: 600;
  color: #ec4899;
  margin-bottom: 2px;
}

.music-session-range {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-feature-settings: "tnum";
}

/* Website History Modal */
.website-history-modal {
  max-width: 700px;
}

.website-history-title {
  display: flex;
  align-items: center;
  gap: 14px;
}

.website-history-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(14, 165, 233, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.website-history-favicon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  object-fit: contain;
  padding: 4px;
}

.website-history-total {
  display: block;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.website-sessions-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.website-session-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  transition: all 0.2s;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.website-session-item:hover {
  background: rgba(6, 182, 212, 0.08);
  transform: translateX(4px);
}

.website-session-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(14, 165, 233, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #06b6d4;
  flex-shrink: 0;
}

.website-session-info {
  flex: 1;
  min-width: 0;
}

.website-session-title {
  font-size: 0.95rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fff;
  margin-bottom: 4px;
}

.website-session-url {
  font-size: 0.8rem;
  color: #06b6d4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(6, 182, 212, 0.1);
  padding: 3px 8px;
  border-radius: 6px;
  margin-top: 4px;
  width: fit-content;
  max-width: 100%;
}

.website-session-time {
  text-align: right;
  flex-shrink: 0;
}

.website-session-dur {
  font-size: 0.9rem;
  font-weight: 600;
  color: #06b6d4;
  margin-bottom: 2px;
}

.website-session-range {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-feature-settings: "tnum";
}
</style>
