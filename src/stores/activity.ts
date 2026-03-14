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

export interface MusicAppUsage {
  app_name: string;
  exe_path: string;
  total_seconds: number;
  session_count: number;
}

export interface MusicSession {
  id: number;
  app_name: string;
  window_title: string | null;
  exe_path: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number;
}

export interface Settings {
  language: string;
  theme: string;
  autostart: boolean;
  minimize_to_tray: boolean;
  discord_rpc: boolean;
}

export function detectCategory(appName: string, exePath: string = ''): string {
  const name = appName.toLowerCase();
  const path = exePath.toLowerCase();

  // Games (Check specific names or common launcher paths)
  const gameKeywords = ['steam', 'epicgames', 'riot', 'league of', 'valorant', 'overwatch', 'minecraft', 'roblox', 'csgo', 'dota', 'gta', 'witcher', 'cyberpunk', 'ea app', 'battle.net'];
  if (gameKeywords.some(kw => name.includes(kw)) || path.includes('\\steam\\') || path.includes('\\epic games\\') || path.includes('\\riot games\\') || path.includes('battlenet')) {
    return 'Games';
  }

  // Work (Office, IDEs, Design, Comms)
  const workKeywords = ['word', 'excel', 'powerpoint', 'code', 'studio', 'figma', 'notion', 'obsidian', 'webstorm', 'pycharm', 'intellij', 'slack', 'zoom', 'teams', 'illustrator', 'photoshop', 'after effects', 'premiere'];
  if (workKeywords.some(kw => name.includes(kw))) {
    return 'Work';
  }

  // Rest (Music, Video, Social)
  const restKeywords = ['spotify', 'youtube music', 'discord', 'netflix', 'telegram', 'whatsapp', 'viber', 'tiktok', 'instagram', 'facebook', 'twitter'];
  if (restKeywords.some(kw => name.includes(kw))) {
    return 'Rest';
  }

  // Programs (Browsers and Utilities)
  const programKeywords = ['chrome', 'edge', 'firefox', 'brave', 'opera', 'vivaldi', 'safari', 'explorer', 'settings', 'taskmgr'];
  if (programKeywords.some(kw => name.includes(kw))) {
    return 'Programs';
  }

  return 'Uncategorized';
}

export const useActivityStore = defineStore('activity', {
  state: () => ({
    currentActivity: null as ActiveWindow | null,
    currentSession: null as CurrentSession | null,
    todaySummary: [] as AppUsageSummary[],
    todaySessions: [] as ActivitySession[],
    weeklyStats: [] as DailyStats[],
    musicSummary: [] as MusicAppUsage[],
    totalMusicTime: 0,
    currentMusicSession: null as MusicSession | null,
    settings: {
      language: 'en',
      theme: 'dark',
      autostart: true,
      minimize_to_tray: true,
      discord_rpc: true
    } as Settings,
    appCategories: {} as Record<string, string>,
    isTracking: false,
    isLoading: false,
    isMobile: false
  }),

  getters: {
    totalTimeToday: (state) => {
      return state.todaySummary.reduce((acc, app) => acc + app.total_seconds, 0);
    },

    totalTimeMusicToday: (state) => {
      return state.musicSummary.reduce((acc, app) => acc + app.total_seconds, 0);
    },

    musicApps: (state) => {
      return [...state.musicSummary].sort((a, b) => b.total_seconds - a.total_seconds);
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
          // Skip YouTube Music - it's tracked as music
          if (session.window_title.toLowerCase().includes('youtube music')) return;
          
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
    },

    categorySummary: (state) => {
      const summary: Record<string, number> = {
        'Games': 0,
        'Programs': 0,
        'Work': 0,
        'Rest': 0,
        'Uncategorized': 0
      };

      state.todaySummary.forEach(app => {
        let category = state.appCategories[app.app_name];
        
        // Auto-detect if no category mapped
        if (!category || category === 'Uncategorized') {
           category = detectCategory(app.app_name, app.exe_path);
        }

        if (summary[category] !== undefined) {
          summary[category] += app.total_seconds;
        } else {
          // If a category was renamed or removed, fallback to Uncategorized
          summary['Uncategorized'] += app.total_seconds;
        }
      });

      // Filter out categories with 0 seconds to avoid empty slices in pie chart
      return Object.entries(summary)
        .map(([name, seconds]) => ({ name, seconds }))
        .filter(cat => cat.seconds > 0)
        .sort((a, b) => b.seconds - a.seconds);
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
        this.musicSummary = await invoke<MusicAppUsage[]>('get_music_today_summary');
        this.totalMusicTime = await invoke<number>('get_total_music_time_today');
        this.currentMusicSession = await invoke<MusicSession | null>('get_current_music_session');
        await this.fetchAppCategories();
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

    async checkPlatform() {
        // Simple check: if window.screen.width < 768 or navigator.userAgent ... 
        // Better: use explicit Tauri API if available, or just heuristic for now.
        // We can check if 'shutdown_pc' is supported or if 'get_current_activity' returns null constantly.
        // But let's use a simple detection.
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    async getActivityRange(from: string, to: string) {
      try {
        return await invoke<ActivitySession[]>('get_activity_range', { from, to });
      } catch (error) {
        console.error('Failed to fetch activity range:', error);
        return [];
      }
    },

    async getMusicActivityRange(from: string, to: string) {
      try {
        return await invoke<MusicSession[]>('get_music_activity_range', { from, to });
      } catch (error) {
        console.error('Failed to fetch music activity range:', error);
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
    },

    async fetchAppCategories() {
      try {
        const categoriesJson = await invoke<string | null>('get_setting_cmd', { key: 'app_categories' });
        if (categoriesJson) {
          this.appCategories = JSON.parse(categoriesJson);
        } else {
          this.appCategories = {};
        }
      } catch (error) {
        console.error('Failed to parse app categories:', error);
        this.appCategories = {};
      }
    },

    async saveAppCategory(appName: string, category: string) {
      try {
        // Clone for reactivity
        const newCategories = { ...this.appCategories };
        
        if (category === 'Uncategorized' || !category) {
          delete newCategories[appName];
        } else {
          newCategories[appName] = category;
        }
        
        this.appCategories = newCategories;
        
        // Save to backend
        await invoke('save_setting_cmd', { 
          key: 'app_categories', 
          value: JSON.stringify(newCategories) 
        });
      } catch (error) {
        console.error('Failed to save app category:', error);
      }
    }
  }
});
