import { defineStore } from 'pinia';
import { invoke } from '@tauri-apps/api/core';

export interface ActiveWindow {
  app_name: string;
  window_title: string;
  exe_path: string;
}

export interface CurrentSession {
  id: number;
  app_name: string;
  window_title: string;
  exe_path: string;
}

export interface ActivitySession {
  id: number;
  app_name: string;
  window_title: string;
  exe_path: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number;
}

export interface AppUsageSummary {
  app_name: string;
  exe_path: string;
  total_seconds: number;
  session_count: number;
}

export interface DailyStats {
  date: string;
  total_seconds: number;
  app_count: number;
}

export interface Settings {
  language: string;
  theme: string;
  autostart: boolean;
  minimize_to_tray: boolean;
}

export const useActivityStore = defineStore('activity', {
  state: () => ({
    currentActivity: null as ActiveWindow | null,
    currentSession: null as CurrentSession | null,
    todaySummary: [] as AppUsageSummary[],
    todaySessions: [] as ActivitySession[],
    weeklyStats: [] as DailyStats[],
    settings: {
      language: 'en',
      theme: 'dark',
      autostart: true,
      minimize_to_tray: true
    } as Settings,
    isTracking: false,
    isLoading: false
  }),

  getters: {
    totalTimeToday: (state) => {
      return state.todaySummary.reduce((acc, app) => acc + app.total_seconds, 0);
    },
    
    topApps: (state) => {
      return [...state.todaySummary].slice(0, 5);
    },

    appCount: (state) => {
      return state.todaySummary.length;
    },

    sessionCount: (state) => {
      return state.todaySessions.length;
    }
  },

  actions: {
    async fetchCurrentActivity() {
      try {
        this.currentActivity = await invoke<ActiveWindow | null>('get_current_activity');
        this.currentSession = await invoke<CurrentSession | null>('get_current_session');
      } catch (error) {
        console.error('Failed to fetch current activity:', error);
      }
    },

    async fetchTodayData() {
      this.isLoading = true;
      try {
        this.todaySummary = await invoke<AppUsageSummary[]>('get_today_summary');
        this.todaySessions = await invoke<ActivitySession[]>('get_today_activity');
      } catch (error) {
        console.error('Failed to fetch today data:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchWeeklyStats() {
      try {
        this.weeklyStats = await invoke<DailyStats[]>('get_weekly_stats');
      } catch (error) {
        console.error('Failed to fetch weekly stats:', error);
      }
    },

    async fetchSettings() {
      try {
        this.settings = await invoke<Settings>('get_settings');
        // Apply theme
        document.documentElement.setAttribute('data-theme', this.settings.theme);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    },

    async saveSettings(newSettings: Settings) {
      try {
        await invoke('save_settings', { settings: newSettings });
        this.settings = newSettings;
        document.documentElement.setAttribute('data-theme', newSettings.theme);
      } catch (error) {
        console.error('Failed to save settings:', error);
        throw error;
      }
    },

    async fetchTrackingStatus() {
      try {
        this.isTracking = await invoke<boolean>('is_tracking');
      } catch (error) {
        console.error('Failed to fetch tracking status:', error);
      }
    },

    async startTracking() {
      try {
        await invoke('start_tracking');
        this.isTracking = true;
      } catch (error) {
        console.error('Failed to start tracking:', error);
      }
    },

    async stopTracking() {
      try {
        await invoke('stop_tracking');
        this.isTracking = false;
      } catch (error) {
        console.error('Failed to stop tracking:', error);
      }
    },

    async getActivityRange(from: string, to: string) {
      try {
        return await invoke<ActivitySession[]>('get_activity_range', { from, to });
      } catch (error) {
        console.error('Failed to fetch activity range:', error);
        return [];
      }
    }
  }
});
