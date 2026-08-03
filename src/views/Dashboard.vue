<template>
  <div class="page page-shell dashboard-page">
    <div class="page-container">
      
      <div class="page-header">
        <div class="header-left">
          <h2>{{ $t("dashboard.title") }}</h2>
          <p class="subtitle">{{ currentDate }}</p>
        </div>
        <div class="header-right">
          <div class="tracking-pill" :class="{ active: store.isTracking }">
            <span class="tracking-dot"></span>
             <span>{{ store.isTracking ? $t("settings.active", "Active") : $t("settings.paused", "Paused") }}</span>
          </div>
        </div>
      </div>

      
      <ProcessExcludeModal v-if="showExcludeModal" @close="showExcludeModal = false" />

      
      <div class="hero-card animate-enter">
        <div class="hero-content">
          <div class="active-section">
            <template v-if="isAppFocused">
              <div class="active-icon-box timigs-brand-icon animate-pop-in" v-html="catSvgContent"></div>

              <div class="active-info">
                <div class="status-row">
                  <span class="status-badge">
                    <span class="status-pulse"></span>
                    {{ $t("dashboard.activeNow") }}
                  </span>
                  <span
                    class="app-tag-pill"
                    :style="{
                      color: '#5b6ee1',
                      backgroundColor: 'rgba(91, 110, 225, 0.08)',
                      borderColor: 'rgba(91, 110, 225, 0.2)'
                    }"
                  >
                    TimiGS
                  </span>
                </div>
                <h2 class="active-app">
                  TimiGS
                </h2>
                <p class="active-window">
                  {{ $t("dashboard.timigsActive") }}
                </p>

                <!-- Previous Activity Section -->
                <div class="previous-activity-box animate-slide-up" v-if="previousSession">
                  <span class="prev-label">{{ $t("dashboard.previousActivity") }}</span>
                  <div class="prev-session-info">
                    <img
                      v-if="appIcons[previousSession.app_name]"
                      :src="appIcons[previousSession.app_name]"
                      class="prev-icon-img"
                    />
                    <div v-else class="prev-icon-fallback">
                      {{ previousSession.app_name.charAt(0) }}
                    </div>
                    <div class="prev-text">
                      <span class="prev-app-name">{{ previousSession.app_name }}</span>
                      <span class="prev-window-title" v-if="previousSession.window_title">
                        &mdash; {{ previousSession.window_title }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="previous-activity-box animate-slide-up" v-else>
                  <span class="prev-label">{{ $t("dashboard.previousActivity") }}</span>
                  <span class="prev-no-data">{{ $t("dashboard.noPreviousActivity") }}</span>
                </div>
              </div>
            </template>

            <template v-else>
              <div class="active-icon-box">
                <img
                  v-if="currentActivity?.app_name && appIcons[currentActivity.app_name]"
                  :src="appIcons[currentActivity.app_name]"
                  class="app-icon-img"
                />
                <div v-else class="app-icon-fallback">
                  {{ currentActivity?.app_name?.charAt(0) || "?" }}
                </div>
              </div>

              <div class="active-info">
                <div class="status-row">
                  <span class="status-badge">
                    <span class="status-pulse"></span>
                    {{ $t("dashboard.activeNow") }}
                  </span>
                  <span
                    v-if="currentActivity"
                    class="app-tag-pill"
                    :style="{
                      color: getProgramTag(currentActivity.app_name, currentActivity.exe_path, currentActivity.window_title).color,
                      backgroundColor: getProgramTag(currentActivity.app_name, currentActivity.exe_path, currentActivity.window_title).bg,
                      borderColor: getProgramTag(currentActivity.app_name, currentActivity.exe_path, currentActivity.window_title).border
                    }"
                  >
                    {{ $t(getProgramTag(currentActivity.app_name, currentActivity.exe_path, currentActivity.window_title).labelKey) }}
                  </span>
                </div>
                <h2 class="active-app">
                  {{ currentActivity ? currentActivity.app_name : $t("dashboard.idle") }}
                </h2>
                <p class="active-window" v-if="currentActivity">
                  {{ currentActivity.window_title }}
                </p>
              </div>
            </template>

            <button
              class="exclude-btn hero-exclude"
              @click="showExcludeModal = true"
              :class="{ active: store.excludedProcesses.length > 0 }"
              :title="$t('excludeProcesses.buttonTitle') || 'Manage excluded processes'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
              </svg>
              <span v-if="store.excludedProcesses.length > 0" class="exclude-count">{{ store.excludedProcesses.length }}</span>
            </button>
          </div>
        </div>
      </div>

      
      <div class="stats-row animate-enter" style="animation-delay: 0.1s">
        
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

      
      <div class="main-grid animate-enter" style="animation-delay: 0.2s">
        
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
                <div class="app-name-row">
                  <span class="app-name">{{ app.app_name }}</span>
                  <span
                    class="app-tag-pill-mini"
                    :style="{
                      color: getProgramTag(app.app_name, app.exe_path).color,
                      backgroundColor: getProgramTag(app.app_name, app.exe_path).bg,
                      borderColor: getProgramTag(app.app_name, app.exe_path).border
                    }"
                  >
                    {{ $t(getProgramTag(app.app_name, app.exe_path).labelKey) }}
                  </span>
                </div>
                <div class="app-progress-row">
                  <div class="progress-track">
                    <div
                      class="progress-fill"
                      :style="{
                        width: getProgressWidth(app.total_seconds) + '%',
                        background: getProgressColor(index)
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
            <div class="empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            </div>
            <p>No activity recorded today</p>
            <span>Start using apps to see your stats</span>
          </div>
        </div>

        
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
                :options="computedDoughnutOptions"
              />
              <Bar
                v-else
                :data="barChartData"
                :options="computedBarOptions"
              />

              
              <div class="chart-center" v-if="selectedChartType === 'doughnut'">
                <span class="center-value">{{ formatDuration(store.totalTimeToday) }}</span>
                <span class="center-label">Total</span>
              </div>
            </div>

            <div v-else class="empty-chart">
              <div class="empty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </div>
              <p>Not enough data</p>
            </div>
          </div>

          
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

          <!-- Interactive terminal status console -->
          <div class="chart-terminal-console" v-if="chartData.labels.length && selectedAppStats">
            <div class="console-header">
              <span class="console-dot-green"></span>
              <span class="console-title">APP_METRICS_LOG // {{ selectedAppStats.app_name }}</span>
            </div>
            <div class="console-body">
              <div class="console-row">
                <span class="console-label">> APP_NAME:</span>
                <span class="console-val">{{ selectedAppStats.app_name }}</span>
              </div>
              <div class="console-row">
                <span class="console-label">> DURATION:</span>
                <span class="console-val">{{ formatDuration(selectedAppStats.total_seconds) }}</span>
              </div>
              <div class="console-row">
                <span class="console-label">> RATIO:</span>
                <span class="console-val">{{ getProgressWidth(selectedAppStats.total_seconds) }}%</span>
              </div>
              <div class="console-row">
                <span class="console-label">> SESSIONS:</span>
                <span class="console-val">{{ selectedAppStats.session_count || 1 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { invoke } from "@tauri-apps/api/core";
import { useActivityStore, getProgramTag } from "../stores/activity";
import ProcessExcludeModal from "../components/ProcessExcludeModal.vue";
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

const { t, locale } = useI18n();
const store = useActivityStore();
const currentTheme = computed(() => store.settings.theme || "dark");

const darkCatSvg = `<svg viewBox="0 0 64 64" class="sleeping-cat-svg animate-pulse" width="68" height="68" xmlns="http://www.w3.org/2000/svg">
  <rect x="18" y="24" width="28" height="24" stroke="#39ff14" stroke-width="2" fill="none" />
  <rect x="10" y="14" width="16" height="16" stroke="#39ff14" stroke-width="2" fill="none" />
  <polyline points="10,14 6,6 16,14" stroke="#39ff14" stroke-width="2" fill="none" />
  <polyline points="20,14 26,6 26,14" stroke="#39ff14" stroke-width="2" fill="none" />
  <polyline points="46,36 54,36 54,20 50,20" stroke="#39ff14" stroke-width="2" fill="none" />
  <line x1="13" y1="22" x2="16" y2="22" stroke="#39ff14" stroke-width="2" />
  <line x1="20" y1="22" x2="23" y2="22" stroke="#39ff14" stroke-width="2" />
  <text x="40" y="16" fill="#39ff14" font-family="monospace" font-size="10" font-weight="bold">Z_z</text>
  <text x="48" y="10" fill="#39ff14" font-family="monospace" font-size="12" font-weight="bold">Z</text>
</svg>`;

const lightCatSvg = `<svg viewBox="0 0 64 64" class="sleeping-cat-svg animate-pulse" width="68" height="68" xmlns="http://www.w3.org/2000/svg">
  <rect x="18" y="24" width="28" height="24" stroke="#ffb300" stroke-width="2" fill="none" />
  <rect x="10" y="14" width="16" height="16" stroke="#ffb300" stroke-width="2" fill="none" />
  <polyline points="10,14 6,6 16,14" stroke="#ffb300" stroke-width="2" fill="none" />
  <polyline points="20,14 26,6 26,14" stroke="#ffb300" stroke-width="2" fill="none" />
  <polyline points="46,36 54,36 54,20 50,20" stroke="#ffb300" stroke-width="2" fill="none" />
  <line x1="13" y1="22" x2="16" y2="22" stroke="#ffb300" stroke-width="2" />
  <line x1="20" y1="22" x2="23" y2="22" stroke="#ffb300" stroke-width="2" />
  <text x="40" y="16" fill="#ffb300" font-family="monospace" font-size="10" font-weight="bold">Z_z</text>
  <text x="48" y="10" fill="#ffb300" font-family="monospace" font-size="12" font-weight="bold">Z</text>
</svg>`;

const glitchCatSvg = `<svg viewBox="0 0 64 64" class="sleeping-cat-svg animate-pulse" width="68" height="68" xmlns="http://www.w3.org/2000/svg">
  <polygon points="16,24 46,24 46,48 16,48" stroke="#00f0ff" stroke-width="2" fill="rgba(0,240,255,0.05)" />
  <polygon points="8,14 26,14 26,30 8,30" stroke="#00f0ff" stroke-width="2" fill="rgba(255,0,85,0.1)" />
  <rect x="10" y="18" width="14" height="6" fill="#ff0055" />
  <polygon points="8,14 4,4 14,14" stroke="#ff0055" stroke-width="2" fill="#00f0ff" />
  <polygon points="20,14 26,4 26,14" stroke="#ff0055" stroke-width="2" fill="#ff0055" />
  <polyline points="46,36 56,36 56,18 50,18" stroke="#00f0ff" stroke-width="2.5" />
  <text x="36" y="16" fill="#00f0ff" font-family="monospace" font-size="10" font-weight="bold">>_Z</text>
  <text x="46" y="10" fill="#ff0055" font-family="monospace" font-size="11" font-weight="bold">ERR</text>
</svg>`;

const materialCatSvg = `<svg viewBox="0 0 64 64" class="sleeping-cat-svg animate-pulse" width="68" height="68" xmlns="http://www.w3.org/2000/svg">
  <path d="M 18 24 C 18 24, 48 24, 48 36 C 48 44, 40 48, 30 48 C 20 48, 18 40, 18 36 Z" fill="#36343b" stroke="#d0bcff" stroke-width="2.5" />
  <circle cx="18" cy="22" r="10" fill="#2b2930" stroke="#d0bcff" stroke-width="2.5" />
  <path d="M 10 16 Q 6 6 15 13 Z" fill="#e8def8" stroke="#d0bcff" stroke-width="2" />
  <path d="M 21 13 Q 28 6 25 16 Z" fill="#e8def8" stroke="#d0bcff" stroke-width="2" />
  <path d="M 12 21 Q 14 18 16 21" stroke="#d0bcff" stroke-width="2" fill="none" stroke-linecap="round" />
  <path d="M 18 21 Q 20 18 22 21" stroke="#d0bcff" stroke-width="2" fill="none" stroke-linecap="round" />
  <circle cx="44" cy="18" r="6" fill="#e8def8" opacity="0.8" />
  <text x="41" y="21" fill="#1d192b" font-family="sans-serif" font-size="9" font-weight="bold">z</text>
  <circle cx="52" cy="10" r="8" fill="#d0bcff" opacity="0.9" />
  <text x="48" y="14" fill="#1d192b" font-family="sans-serif" font-size="11" font-weight="bold">Z</text>
</svg>`;

const officeCatSvg = `<svg viewBox="0 0 64 64" class="sleeping-cat-svg animate-pulse" width="68" height="68" xmlns="http://www.w3.org/2000/svg">
  <rect x="18" y="24" width="28" height="24" rx="2" stroke="#0078d4" stroke-width="2.5" fill="#ffffff" />
  <rect x="10" y="14" width="16" height="16" rx="2" stroke="#0078d4" stroke-width="2.5" fill="#ffffff" />
  <polygon points="17,30 21,30 19,42" fill="#0078d4" />
  <polygon points="10,14 6,6 16,14" fill="#0078d4" />
  <polygon points="20,14 26,6 26,14" fill="#0078d4" />
  <rect x="11" y="19" width="6" height="4" stroke="#106ebe" stroke-width="1.5" fill="none" />
  <rect x="19" y="19" width="6" height="4" stroke="#106ebe" stroke-width="1.5" fill="none" />
  <text x="40" y="18" fill="#0078d4" font-family="Segoe UI, sans-serif" font-size="11" font-weight="bold">z_z</text>
  <text x="48" y="11" fill="#106ebe" font-family="Segoe UI, sans-serif" font-size="13" font-weight="bold">Z</text>
</svg>`;

const simpleCatSvg = `<svg viewBox="0 0 64 64" class="sleeping-cat-svg animate-pulse" width="68" height="68" xmlns="http://www.w3.org/2000/svg">
  <rect x="18" y="24" width="28" height="24" rx="8" stroke="#3b82f6" stroke-width="2.5" fill="none" stroke-linecap="round" />
  <rect x="8" y="14" width="18" height="18" rx="6" stroke="#3b82f6" stroke-width="2.5" fill="none" stroke-linecap="round" />
  <path d="M 10 14 L 6 6 L 15 12" stroke="#3b82f6" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 21 12 L 26 6 L 24 14" stroke="#3b82f6" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 12 23 Q 15 26 18 23" stroke="#3b82f6" stroke-width="2" fill="none" stroke-linecap="round" />
  <text x="40" y="16" fill="#3b82f6" font-family="sans-serif" font-size="11" font-weight="600">z</text>
  <text x="48" y="10" fill="#60a5fa" font-family="sans-serif" font-size="13" font-weight="700">Z</text>
</svg>`;

const catSvgContent = computed(() => {
  const theme = currentTheme.value;
  if (theme === 'glitch') return glitchCatSvg;
  if (theme === 'material') return materialCatSvg;
  if (theme === 'office') return officeCatSvg;
  if (theme === 'simple') return simpleCatSvg;
  if (theme === 'light') return lightCatSvg;
  return darkCatSvg;
});
const currentActivity = computed(() => store.currentActivity);
const previousSession = computed(() => {
  if (store.currentSession) {
    return store.currentSession;
  }
  if (store.todaySessions && store.todaySessions.length > 0) {
    return store.todaySessions[0];
  }
  return null;
});
const selectedChartType = ref("doughnut");
const appIcons = ref<Record<string, string>>({});
const showExcludeModal = ref(false);
const isAppFocused = ref(document.hasFocus());

function handleFocus() {
  isAppFocused.value = true;
  refreshData();
}

function handleBlur() {
  isAppFocused.value = false;
}

const currentDate = computed(() => {
  return new Date().toLocaleDateString(locale.value, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
});

let intervalId: number | null = null;

const selectedAppStats = ref<any | null>(null);

watch(() => store.topApps, (newTopApps) => {
  if (newTopApps && newTopApps.length > 0 && !selectedAppStats.value) {
    selectedAppStats.value = newTopApps[0];
  }
}, { immediate: true });

const chartColors = computed(() => {
  const isLight = store.settings.theme === 'light';
  if (isLight) {
    return [
      "#ffb300", // main amber
      "#fbbf24", // amber-400
      "#d97706", // amber-600
      "#f97316", // orange-500
      "#ea580c", // orange-600
      "#b45309", // amber-700
      "#78350f", // amber-900
    ];
  } else {
    return [
      "#39ff14", // main neon green
      "#4ade80", // green-400
      "#16a34a", // green-600
      "#22c55e", // green-500
      "#15803d", // green-700
      "#86efac", // green-300
      "#14532d", // green-900
    ];
  }
});

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) seconds = 0;
  const s_sym = t('common.s_symbol', 's');
  const m_sym = t('common.m_symbol', 'm');
  const h_sym = t('common.h_symbol', 'h');
  if (seconds < 60) return `${seconds}${s_sym}`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}${m_sym}`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}${h_sym} ${m}${m_sym}`;
}

function getProgressWidth(seconds: number): number {
  if (store.totalTimeToday === 0) return 0;
  return Math.min(100, Math.round((seconds / store.totalTimeToday) * 100));
}

function getRankClass(index: number): string {
  if (index === 0) return "gold";
  if (index === 1) return "silver";
  if (index === 2) return "bronze";
  return "";
}

function getAppColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 50%)`;
}

function getProgressColor(index: number): string {
  const colors = ["#5b6ee1", "#0ea5e9", "#8b5cf6", "#ec4899", "#f59e0b"];
  return colors[index % colors.length];
}


const chartData = computed(() => ({
  labels: store.topApps.slice(0, 5).map((app) => app.app_name),
  datasets: [
    {
      data: store.topApps.slice(0, 5).map((app) => app.total_seconds),
      backgroundColor: chartColors.value,
      borderWidth: 0,
      hoverOffset: 8,
      borderRadius: 0,
    },
  ],
}));

const barChartData = computed(() => ({
  labels: store.topApps.slice(0, 5).map((app) => app.app_name),
  datasets: [
    {
      data: store.topApps.slice(0, 5).map((app) => Math.round(app.total_seconds / 60)),
      backgroundColor: chartColors.value,
      borderRadius: 0,
      borderSkipped: false,
    },
  ],
}));

const computedDoughnutOptions = computed(() => {
  const isLight = store.settings.theme === 'light';
  const primaryColor = isLight ? "#ffb300" : "#39ff14";
  const bgColor = isLight ? "rgba(10, 6, 0, 0.98)" : "rgba(2, 5, 2, 0.98)";
  const textColor = isLight ? "#ffb300" : "#39ff14";

  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    onClick: (_event: any, elements: any) => {
      if (elements && elements.length > 0) {
        const index = elements[0].index;
        const app = store.topApps[index];
        if (app) {
          selectedAppStats.value = app;
        }
      }
    },
    onHover: (event: any, elements: any) => {
      event.native.target.style.cursor = elements && elements.length > 0 ? 'pointer' : 'default';
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: bgColor,
        titleColor: textColor,
        titleFont: { family: "Consolas, Courier New, monospace", size: 12, weight: "bold" as const },
        bodyColor: textColor,
        bodyFont: { family: "Consolas, Courier New, monospace", size: 12 },
        padding: 10,
        cornerRadius: 0,
        borderColor: primaryColor,
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: (ctx: any) => {
            const seconds = ctx.raw;
            return ` DURATION: ${formatDuration(seconds)}`;
          },
        },
      },
    },
  };
});

const computedBarOptions = computed(() => {
  const isLight = store.settings.theme === 'light';
  const primaryColor = isLight ? "#ffb300" : "#39ff14";
  const bgColor = isLight ? "rgba(10, 6, 0, 0.98)" : "rgba(2, 5, 2, 0.98)";
  const textColor = isLight ? "#ffb300" : "#39ff14";

  return {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_event: any, elements: any) => {
      if (elements && elements.length > 0) {
        const index = elements[0].index;
        const app = store.topApps[index];
        if (app) {
          selectedAppStats.value = app;
        }
      }
    },
    onHover: (event: any, elements: any) => {
      event.native.target.style.cursor = elements && elements.length > 0 ? 'pointer' : 'default';
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: bgColor,
        titleColor: textColor,
        titleFont: { family: "Consolas, Courier New, monospace", size: 12, weight: "bold" as const },
        bodyColor: textColor,
        bodyFont: { family: "Consolas, Courier New, monospace", size: 12 },
        padding: 10,
        cornerRadius: 0,
        borderColor: primaryColor,
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: (ctx: any) => ` DURATION: ${ctx.raw} ${t('common.m_symbol', 'm')}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { 
          color: primaryColor, 
          font: { family: "Consolas, Courier New, monospace", size: 9 },
          maxRotation: 0,
          minRotation: 0,
          callback: function(this: any, value: any) {
            const label = this.getLabelForValue(value);
            return label.length > 10 ? label.slice(0, 8) + '..' : label;
          }
        },
      },
      y: {
        display: false,
        grid: { display: false },
      },
    },
  };
});


async function loadIcon(appName: string, path: string) {
  if (appName in appIcons.value || !path) return;
  try {
    const base64 = await invoke<string | null>("get_app_icon", { path });
    if (base64) {
      appIcons.value[appName] = `data:image/png;base64,${base64}`;
    } else {
      appIcons.value[appName] = '';
    }
  } catch {
    appIcons.value[appName] = '';
  }
}

async function refreshData() {
  await Promise.all([
    store.fetchCurrentActivity(),
    store.fetchTrackingStatus(),
    store.fetchTodayData()
  ]);

  if (store.currentActivity?.exe_path) {
    loadIcon(store.currentActivity.app_name, store.currentActivity.exe_path);
  }
  if (previousSession.value?.exe_path) {
    loadIcon(previousSession.value.app_name, previousSession.value.exe_path);
  }
  store.topApps.forEach((app) => loadIcon(app.app_name, app.exe_path));
}

onMounted(async () => {
  await Promise.all([
    store.fetchExcludedProcesses(),
    refreshData()
  ]);
  intervalId = window.setInterval(refreshData, 5000);
  window.addEventListener("focus", handleFocus);
  window.addEventListener("blur", handleBlur);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
  window.removeEventListener("focus", handleFocus);
  window.removeEventListener("blur", handleBlur);
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
  color: var(--text-main);
}

.subtitle {
  color: var(--text-muted);
  font-size: 1rem;
  font-weight: 400;
}

.exclude-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  flex-shrink: 0;
}

.exclude-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: var(--color-danger);
  transform: scale(1.05);
}

.exclude-btn.active {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.35);
  color: var(--color-danger);
  box-shadow: 0 0 16px rgba(239, 68, 68, 0.15);
}

.exclude-btn svg {
  width: 18px;
  height: 18px;
}

.hero-exclude {
  margin-left: auto;
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
}

.exclude-count {
  position: absolute;
  top: -6px;
  right: -6px;
  background: var(--color-danger);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
}

.tracking-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  background: var(--bg-tertiary);
  border-radius: 24px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-muted);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.tracking-pill.active {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
  border-color: rgba(16, 185, 129, 0.3);
  box-shadow: 0 0 16px rgba(16, 185, 129, 0.1);
}

.tracking-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--text-muted);
  transition: all 0.3s ease;
}

.tracking-pill.active .tracking-dot {
  background: var(--color-success);
  box-shadow: 0 0 12px var(--color-success);
  animation: pulse-dot 2s infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.9); }
}


.hero-card {
  position: relative;
  border-radius: var(--radius-2xl);
  padding: 40px;
  margin-bottom: 28px;
  overflow: hidden;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-md);
  transition: var(--transition-base);
}

.hero-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-glow);
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
  background: var(--bg-tertiary);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  transition: transform 0.3s ease;
}

.active-icon-box:hover {
  transform: scale(1.05);
}

.app-icon-img {
  width: 64px;
  height: 64px;
  object-fit: contain;
}

.app-icon-fallback {
  font-size: 2.5rem;
  font-weight: 800;
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
  background: rgba(16, 185, 129, 0.1);
  padding: 6px 14px;
  border-radius: 16px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-pulse {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-success);
  box-shadow: 0 0 12px var(--color-success);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.15); }
}

.active-app {
  font-size: 2.2rem;
  font-weight: 800;
  margin-bottom: 6px;
  line-height: 1.2;
  letter-spacing: -0.5px;
  color: var(--text-main);
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
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: 24px;
  transition: var(--transition-base);
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  border-color: var(--color-primary);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.stat-icon-box {
  width: 58px;
  height: 58px;
  border-radius: var(--radius-lg);
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
  background: rgba(91, 110, 225, 0.1);
  color: var(--color-primary);
}

.stat-icon-box.accent {
  background: rgba(14, 165, 233, 0.1);
  color: var(--color-secondary);
}

.stat-icon-box.success {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
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
  color: var(--text-main);
}


.main-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 24px;
}

.grid-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-2xl);
  padding: 28px;
  transition: var(--transition-base);
  position: relative;
  overflow: hidden;
}

.grid-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-glow);
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
  color: var(--text-main);
}

.header-badge {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg-tertiary);
  padding: 6px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}


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
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  transition: var(--transition-base);
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
}

.app-row::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--color-primary);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.app-row:hover::before {
  opacity: 1;
}

.app-row:hover {
  background: var(--bg-hover);
  border-color: var(--color-primary);
  transform: translateX(4px);
  box-shadow: var(--shadow-md);
}

.app-rank {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-weight: 700;
  font-size: 0.9rem;
  background: var(--bg-hover);
  color: var(--text-muted);
  transition: var(--transition-base);
}

.app-row:hover .app-rank {
  background: var(--bg-active);
  color: var(--text-main);
}

.app-rank.gold {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.app-rank.silver {
  background: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
}

.app-rank.bronze {
  background: rgba(180, 83, 9, 0.15);
  color: #f59e0b;
}

.app-icon-small {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--border-color);
  transition: var(--transition-base);
}

.app-row:hover .app-icon-small {
  transform: scale(1.08);
  border-color: var(--color-primary);
}

.app-icon-small img {
  width: 32px;
  height: 32px;
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
  font-size: 1.1rem;
}

.app-details {
  flex: 1;
  min-width: 0;
}

.app-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  margin-bottom: 8px;
}

.app-name {
  display: block;
  font-weight: 700;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.3px;
  color: var(--text-main);
}

.app-tag-pill {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: var(--radius-md);
  border: 1px solid currentColor;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  transition: all 0.3s ease;
}

.app-tag-pill-mini {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  border: 1px solid currentColor;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  opacity: 0.85;
  flex-shrink: 0;
}

.app-progress-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-track {
  flex: 1;
  height: 8px;
  background: var(--bg-hover);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
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
  color: var(--text-main);
}

.time-sessions {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}


.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.4;
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


.chart-tabs {
  display: flex;
  gap: 6px;
  background: var(--bg-tertiary);
  padding: 5px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.chart-tabs button {
  padding: 10px 14px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition: var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

.chart-tabs button:hover {
  color: var(--text-main);
  background: var(--bg-hover);
}

.chart-tabs button.active {
  background: var(--color-primary);
  color: #fff;
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
  color: var(--color-primary);
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


.chart-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 0px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  transition: var(--transition-fast);
}

.legend-item:hover {
  background: var(--bg-hover);
  color: var(--text-main);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 0px;
}

.legend-label {
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chart-terminal-console {
  margin-top: 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  padding: 12px;
  font-family: var(--font-family);
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--color-primary);
  text-align: left;
}

.console-header {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px dashed var(--border-color);
  padding-bottom: 8px;
  margin-bottom: 10px;
}

.console-dot-green {
  width: 6px;
  height: 6px;
  background: var(--color-primary);
}

.console-title {
  font-weight: bold;
  letter-spacing: 0.5px;
}

.console-row {
  display: flex;
  margin-bottom: 5px;
}

.console-label {
  width: 120px;
  color: var(--text-muted);
  font-weight: normal;
}

.console-val {
  color: var(--color-primary);
  font-weight: bold;
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

/* TimiGS active state & Previous activity styles */
.timigs-brand-icon {
  background: var(--bg-secondary) !important;
  border: 2px solid var(--color-primary) !important;
  box-shadow: var(--shadow-glow) !important;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.sleeping-cat-svg {
  transform-origin: center bottom;
  animation: cat-breath 4s ease-in-out infinite;
}

.zzz-1, .zzz-2, .zzz-3 {
  transform-origin: center;
  opacity: 0;
}

.zzz-1 {
  animation: float-zzz 3.5s ease-in-out infinite;
  animation-delay: 0s;
}

.zzz-2 {
  animation: float-zzz 3.5s ease-in-out infinite;
  animation-delay: 1.1s;
}

.zzz-3 {
  animation: float-zzz 3.5s ease-in-out infinite;
  animation-delay: 2.2s;
}

@keyframes float-zzz {
  0% {
    transform: translateY(4px) scale(0.7);
    opacity: 0;
  }
  30% {
    opacity: 0.95;
  }
  80% {
    opacity: 0.7;
  }
  100% {
    transform: translateY(-8px) scale(1.1);
    opacity: 0;
  }
}

@keyframes cat-breath {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.04) translateY(-1px);
  }
}

.previous-activity-box {
  margin-top: 18px;
  padding: 12px 18px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: 600px;
  transition: all 0.3s ease;
}

.previous-activity-box:hover {
  border-color: var(--color-primary);
  background: var(--bg-hover);
}

.prev-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.prev-session-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.prev-icon-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.prev-icon-fallback {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-primary);
  border: 1px solid var(--border-color);
}

.prev-text {
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
}

.prev-app-name {
  font-weight: 600;
  color: var(--text-main);
}

.prev-window-title {
  color: var(--text-muted);
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prev-no-data {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-style: italic;
}

.animate-pop-in {
  animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.animate-slide-up {
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes popIn {
  0% { transform: scale(0.85); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes slideUp {
  0% { transform: translateY(10px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
</style>
