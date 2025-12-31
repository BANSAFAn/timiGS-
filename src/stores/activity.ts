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
  discord_rpc: boolean;
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
      minimize_to_tray: true,
      discord_rpc: true
    } as Settings,
    isTracking: false,
    isLoading: false
  }),

  getters: {
    totalTimeToday: (state) => {
      return state.todaySummary.reduce((acc, app) => acc + app.total_seconds, 0);
    },
    
    topApps: (state) => {
      // Sort by time descending
      return [...state.todaySummary].sort((a, b) => b.total_seconds - a.total_seconds).slice(0, 5);
    },

    websiteUsage: (state) => {
      const BROWSERS = ['chrome', 'msedge', 'firefox', 'opera', 'brave', 'vivaldi'];
      const SITE_USAGE: Record<string, number> = {};

      state.todaySessions.forEach(session => {
        const appNameLower = session.app_name.toLowerCase();
        // Check if app is a browser
        if (BROWSERS.some(b => appNameLower.includes(b))) {
          let site = 'Unknown';
          const title = session.window_title;
          
          // Pattern 1: "Page Title - Site Name - Browser" or "Page Title - Site Name"
          // We assume the Site Name is the last meaningful part before the browser suffix
          
          // Remove browser suffix if present
          let cleanTitle = title
            .replace(/ - Google Chrome$/i, '')
            .replace(/ - Microsoft Edge$/i, '')
            .replace(/ - Mozilla Firefox$/i, '')
            .replace(/ - Opera$/i, '')
            .replace(/ - Brave$/i, '')
            .replace(/ - Vivaldi$/i, '');

          // Split by " - " or " | "
          const parts = cleanTitle.split(/ - | \| /);

          if (parts.length > 1) {
            // Usually the site name is the last part, e.g. "Video - YouTube"
            site = parts[parts.length - 1].trim();
          } else {
            // If no separator, use the whole title, or try to detect domains
            site = cleanTitle.trim();
          }
          
          // Grouping common sites cleanup
          if (site === 'New Tab') return; // Skip new tabs
          if (site.endsWith('.com') || site.endsWith('.org')) site = site; 

          if (!SITE_USAGE[site]) SITE_USAGE[site] = 0;
          SITE_USAGE[site] += session.duration_seconds;
        }
      });

      // Convert to array and sort
      return Object.entries(SITE_USAGE)
        .map(([name, seconds]) => ({ name, seconds }))
        .sort((a, b) => b.seconds - a.seconds)
        .slice(0, 5); // Top 5 websites
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
    },

    generateWeeklyReport(): string {
      const totalTime = this.weeklyStats.reduce((acc, d) => acc + d.total_seconds, 0);
      const hours = Math.floor(totalTime / 3600);
      const mins = Math.floor((totalTime % 3600) / 60);

      let report = `📊 TimiGS Weekly Activity Report\n`;
      report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      report += `📅 Period: Last 7 days\n`;
      report += `⏱️ Total Time: ${hours}h ${mins}m\n\n`;

      report += `🏆 Top Applications:\n`;
      this.todaySummary.slice(0, 5).forEach((app, i) => {
        const appHours = Math.floor(app.total_seconds / 3600);
        const appMins = Math.floor((app.total_seconds % 3600) / 60);
        report += `  ${i + 1}. ${app.app_name}: ${appHours}h ${appMins}m\n`;
      });

      report += `\n📈 Daily Breakdown:\n`;
      this.weeklyStats.forEach(day => {
        const dayHours = Math.floor(day.total_seconds / 3600);
        const dayMins = Math.floor((day.total_seconds % 3600) / 60);
        report += `  ${day.date}: ${dayHours}h ${dayMins}m\n`;
      });

      report += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      report += `Generated by TimiGS Activity Tracker`;

      return report;
    }
  }
});
