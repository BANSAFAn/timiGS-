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

export interface CodingSession {
  id: number;
  app_name: string;
  editor_name: string;
  file_path: string | null;
  language: string | null;
  project_dir: string | null;
  is_ai_assisted: boolean;
  window_title: string;
  exe_path: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number;
}

export interface CodingStats {
  language: string;
  total_seconds: number;
  ai_seconds: number;
  manual_seconds: number;
  session_count: number;
}

export interface CodingProjectStats {
  project_dir: string;
  total_seconds: number;
  ai_seconds: number;
  session_count: number;
}

export interface CurrentCodingSession {
  id: number;
  app_name: string;
  editor_name: string;
  file_path: string | null;
  language: string | null;
  project_dir: string | null;
  is_ai_assisted: boolean;
  window_title: string;
  exe_path: string;
}

export interface Settings {
  language: string;
  theme: string;
  autostart: boolean;
  minimize_to_tray: boolean;
}

export function detectCategory(appName: string, exePath: string = ''): string {
  const name = appName.toLowerCase();
  const path = exePath.toLowerCase();


  const gameKeywords = ['steam', 'epicgames', 'riot', 'league of', 'valorant', 'overwatch', 'minecraft', 'roblox', 'csgo', 'dota', 'gta', 'witcher', 'cyberpunk', 'ea app', 'battle.net'];
  if (gameKeywords.some(kw => name.includes(kw)) || path.includes('\\steam\\') || path.includes('\\epic games\\') || path.includes('\\riot games\\') || path.includes('battlenet')) {
    return 'Games';
  }


  const workKeywords = [
    'word', 'excel', 'powerpoint', 'code', 'studio', 'figma', 'notion', 'obsidian',
    'webstorm', 'pycharm', 'intellij', 'slack', 'zoom', 'teams',
    'illustrator', 'photoshop', 'after effects', 'premiere',
    // Code editors
    'cursor', 'windsurf', 'zed', 'neovim', 'nvim', 'vim', 'helix', 'lapce',
    'sublime', 'atom', 'emacs', 'fleet', 'kiro', 'qoder', 'antigravity',
    'rustrover', 'goland', 'rider', 'clion', 'phpstorm', 'datagrip',
    // AI coding tools (browser-based)
    'chatgpt', 'claude', 'deepseek', 'gemini', 'copilot', 'v0.dev',
    'z.ai', 'qwen', 'omniroute', 'openrouter', 'perplexity', 'phind',
    'bolt.new', 'lovable', 'devin', 'replit',
  ];
  if (workKeywords.some(kw => name.includes(kw))) {
    return 'Work';
  }


  const restKeywords = [
    'spotify', 'youtube music', 'discord', 'netflix', 'telegram', 'whatsapp',
    'viber', 'tiktok', 'instagram', 'facebook', 'twitter',
    // More music apps
    'yandex music', 'apple music', 'tidal', 'deezer', 'soundcloud',
    'foobar2000', 'musicbee', 'aimp', 'winamp', 'itunes', 'audible',
    'vlc', 'mpv', 'potplayer',
  ];
  if (restKeywords.some(kw => name.includes(kw))) {
    return 'Rest';
  }


  const programKeywords = ['chrome', 'edge', 'firefox', 'brave', 'opera', 'vivaldi', 'safari', 'explorer', 'settings', 'taskmgr'];
  if (programKeywords.some(kw => name.includes(kw))) {
    return 'Programs';
  }

  return 'Uncategorized';
}

export interface ProgramTag {
  key: string;
  labelKey: string;
  color: string;
  bg: string;
  border: string;
}

const pendingLookups = new Set<string>();

async function runOnlineAppClassification(appName: string) {
  if (pendingLookups.has(appName)) return;
  pendingLookups.add(appName);

  try {
    console.log(`[Online Lookup] Querying Wikipedia for app: ${appName}`);
    const result = await invoke<[string, string] | null>('lookup_app_info_online', { appName });

    if (result) {
      const [title, desc] = result;
      const lowerDesc = desc.toLowerCase();
      console.log(`[Online Lookup] Wikipedia matched "${title}" with description: ${desc}`);

      let category = 'Uncategorized';

      if (
        lowerDesc.includes('video game') ||
        lowerDesc.includes('digital distribution platform') ||
        lowerDesc.includes('game engine') ||
        lowerDesc.includes('mmorpg') ||
        lowerDesc.includes('multiplayer') ||
        lowerDesc.includes('shooter') ||
        lowerDesc.includes('arcade') ||
        lowerDesc.includes('gameplay') ||
        lowerDesc.includes('game developed')
      ) {
        category = 'Games';
      } else if (
        lowerDesc.includes('source code editor') ||
        lowerDesc.includes('integrated development environment') ||
        lowerDesc.includes('compiler') ||
        lowerDesc.includes('debugger') ||
        lowerDesc.includes('software development') ||
        lowerDesc.includes('programming language') ||
        lowerDesc.includes('git client') ||
        lowerDesc.includes('database administration') ||
        lowerDesc.includes('database client') ||
        lowerDesc.includes('api testing')
      ) {
        category = 'Programming';
      }

      else if (
        lowerDesc.includes('artificial intelligence') ||
        lowerDesc.includes('chatbot') ||
        lowerDesc.includes('language model') ||
        lowerDesc.includes('large language model') ||
        lowerDesc.includes('ai assistant') ||
        lowerDesc.includes('openai')
      ) {
        category = 'AI';
      }

      else if (
        lowerDesc.includes('graphics editor') ||
        lowerDesc.includes('vector graphics') ||
        lowerDesc.includes('3d computer graphics') ||
        lowerDesc.includes('video editing') ||
        lowerDesc.includes('audio editing') ||
        lowerDesc.includes('image editor') ||
        lowerDesc.includes('digital art') ||
        lowerDesc.includes('animation software') ||
        lowerDesc.includes('raster graphics') ||
        lowerDesc.includes('creative suite')
      ) {
        category = 'Creative';
      }

      else if (
        lowerDesc.includes('finance') ||
        lowerDesc.includes('cryptocurrency') ||
        lowerDesc.includes('accounting') ||
        lowerDesc.includes('stock market') ||
        lowerDesc.includes('investment') ||
        lowerDesc.includes('personal finance') ||
        lowerDesc.includes('bookkeeping')
      ) {
        category = 'Finance';
      }

      else if (
        lowerDesc.includes('instant messaging') ||
        lowerDesc.includes('social media') ||
        lowerDesc.includes('chat') ||
        lowerDesc.includes('messenger') ||
        lowerDesc.includes('voip') ||
        lowerDesc.includes('telecommunications') ||
        lowerDesc.includes('social networking') ||
        lowerDesc.includes('communication service')
      ) {
        category = 'Social';
      }

      else if (
        lowerDesc.includes('media player') ||
        lowerDesc.includes('music stream') ||
        lowerDesc.includes('audio player') ||
        lowerDesc.includes('video stream') ||
        lowerDesc.includes('music downloader') ||
        lowerDesc.includes('synthesizer') ||
        lowerDesc.includes('digital audio workstation') ||
        lowerDesc.includes('daw') ||
        lowerDesc.includes('movie player')
      ) {
        category = 'Entertainment';
      }

      else if (
        lowerDesc.includes('encyclopedia') ||
        lowerDesc.includes('dictionary') ||
        lowerDesc.includes('flashcard') ||
        lowerDesc.includes('learning platform') ||
        lowerDesc.includes('pdf reader') ||
        lowerDesc.includes('document reader') ||
        lowerDesc.includes('language learning')
      ) {
        category = 'Study';
      }

      else if (
        lowerDesc.includes('spreadsheet') ||
        lowerDesc.includes('presentation software') ||
        lowerDesc.includes('word processor') ||
        lowerDesc.includes('project management') ||
        lowerDesc.includes('collaborative platform') ||
        lowerDesc.includes('office suite') ||
        lowerDesc.includes('word processing')
      ) {
        category = 'Work';
      }

      else if (
        lowerDesc.includes('text editor') ||
        lowerDesc.includes('calculator') ||
        lowerDesc.includes('file archiver') ||
        lowerDesc.includes('system customization') ||
        lowerDesc.includes('widget engine') ||
        lowerDesc.includes('screenshot') ||
        lowerDesc.includes('screencast') ||
        lowerDesc.includes('customization tool') ||
        lowerDesc.includes('desktop enhancement')
      ) {
        category = 'Utilities';
      }

      else if (
        lowerDesc.includes('web browser') ||
        lowerDesc.includes('operating system') ||
        lowerDesc.includes('file manager') ||
        lowerDesc.includes('system utility') ||
        lowerDesc.includes('task manager') ||
        lowerDesc.includes('terminal emulator') ||
        lowerDesc.includes('command line') ||
        lowerDesc.includes('user interface') ||
        lowerDesc.includes('windows shell') ||
        lowerDesc.includes('search engine')
      ) {
        category = 'System';
      }

      if (category !== 'Uncategorized') {
        console.log(`[Online Lookup] Successfully classified "${appName}" as "${category}"`);
        const store = useActivityStore();
        await store.saveAppCategory(appName, category);
      } else {
        console.log(`[Online Lookup] Could not classify "${appName}" from description. Defaulting to Uncategorized.`);
      }
    } else {
      console.log(`[Online Lookup] No Wikipedia article found for "${appName}"`);
    }
  } catch (err) {
    console.error(`[Online Lookup] Error looking up "${appName}":`, err);
  }
}

export const CATEGORY_STYLES: Record<string, { labelKey: string; color: string; bg: string; border: string }> = {
  Programming: { labelKey: 'dashboard.tagProgramming', color: '#818cf8', bg: 'rgba(99, 102, 241, 0.08)', border: 'rgba(99, 102, 241, 0.2)' },
  Games: { labelKey: 'dashboard.tagGames', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.2)' },
  Social: { labelKey: 'dashboard.tagSocial', color: '#38bdf8', bg: 'rgba(14, 165, 233, 0.08)', border: 'rgba(14, 165, 233, 0.2)' },
  Study: { labelKey: 'dashboard.tagStudy', color: '#2dd4bf', bg: 'rgba(45, 212, 191, 0.08)', border: 'rgba(45, 212, 191, 0.2)' },
  Work: { labelKey: 'dashboard.tagWork', color: '#34d399', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)' },
  Rest: { labelKey: 'dashboard.tagEntertainment', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.08)', border: 'rgba(244, 114, 182, 0.2)' },
  Entertainment: { labelKey: 'dashboard.tagEntertainment', color: '#f472b6', bg: 'rgba(244, 114, 182, 0.08)', border: 'rgba(244, 114, 182, 0.2)' },
  Programs: { labelKey: 'dashboard.tagSystem', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.06)', border: 'rgba(148, 163, 184, 0.15)' },
  System: { labelKey: 'dashboard.tagSystem', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.06)', border: 'rgba(148, 163, 184, 0.15)' },
  Browser: { labelKey: 'dashboard.tagBrowser', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.08)', border: 'rgba(6, 182, 212, 0.2)' },
  Creative: { labelKey: 'dashboard.tagCreative', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.08)', border: 'rgba(236, 72, 153, 0.2)' },
  AI: { labelKey: 'dashboard.tagAI', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.08)', border: 'rgba(168, 85, 247, 0.2)' },
  Finance: { labelKey: 'dashboard.tagFinance', color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)' },
  Utilities: { labelKey: 'dashboard.tagUtilities', color: '#f97316', bg: 'rgba(249, 115, 22, 0.08)', border: 'rgba(249, 115, 22, 0.2)' },
  Uncategorized: { labelKey: 'dashboard.tagUncategorized', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.06)', border: 'rgba(148, 163, 184, 0.15)' }
};

interface KeywordCategory {
  key: string;
  keywords: string[];
  customCheck?: (name: string, path: string) => boolean;
}

const KEYWORD_CATEGORIES: KeywordCategory[] = [
  {
    key: 'AI',
    keywords: ['chatgpt', 'claude', 'gemini', 'copilot', 'perplexity', 'poe', 'ollama', 'huggingface', 'openai', 'artificial intelligence'],
    customCheck: (name) => name.includes('assistant')
  },
  {
    key: 'Creative',
    keywords: ['figma', 'photoshop', 'illustrator', 'premiere', 'after effects', 'indesign', 'lightroom', 'blender', 'canva', 'gimp', 'inkscape', 'davinci resolve', 'audacity', 'design', 'paint', 'coreldraw', 'creative', 'affinity', 'krita', 'clip studio']
  },
  {
    key: 'Finance',
    keywords: ['excel', 'spreadsheet', 'sheets', 'binance', 'metamask', 'tradingview', 'crypto', 'finance', 'wallet', 'bank', 'accounting', 'tax']
  },
  {
    key: 'Utilities',
    keywords: ['notepad', 'notepad++', 'notepad.exe', 'calc', 'calculator', '7-zip', '7z', 'winrar', 'rar', 'zip', 'rufus', 'etcher', 'ditto', 'everything', 'rainmeter', 'wps'],
    customCheck: (name) => name.includes('utility') || name.includes('утиліт')
  },
  {
    key: 'Programming',
    keywords: ['code', 'vscode', 'visual studio', 'zed', 'cursor', 'windsurf', 'neovim', 'nvim', 'vim', 'helix', 'lapce', 'sublime', 'atom', 'emacs', 'fleet', 'kiro', 'qoder', 'antigravity', 'webstorm', 'pycharm', 'intellij', 'rustrover', 'goland', 'rider', 'clion', 'phpstorm', 'datagrip', 'android studio', 'xcode', 'qt creator', 'eclipse', 'compiler', 'builder', 'dev-c++', 'code::blocks', 'dbeaver', 'pgadmin', 'postman', 'github', 'git', 'sourcetree'],
    customCheck: (_, path) => path.includes('vscode') || path.includes('visual studio')
  },
  {
    key: 'Games',
    keywords: ['steam', 'epicgames', 'riot', 'league of', 'valorant', 'overwatch', 'minecraft', 'roblox', 'csgo', 'dota', 'gta', 'witcher', 'cyberpunk', 'ea app', 'battle.net', 'game', 'play', 'retroarch', 'emulator', 'cs2', 'halflife', 'portal', 'genshin'],
    customCheck: (_, path) => path.includes('\\steam\\') || path.includes('\\epic games\\') || path.includes('\\riot games\\') || path.includes('battlenet')
  },
  {
    key: 'Social',
    keywords: ['discord', 'telegram', 'whatsapp', 'viber', 'tiktok', 'instagram', 'facebook', 'twitter', 'skype', 'messenger', 'signal', 'wechat', 'slack']
  },
  {
    key: 'Study',
    keywords: ['duolingo', 'anki', 'coursera', 'edx', 'quizlet', 'moodle', 'canvas', 'wikipedia', 'scholar', 'pdf', 'reader', 'book', 'math', 'dictionary', 'translate', 'word'],
    customCheck: (name) => name.includes('учеба') || name.includes('study')
  },
  {
    key: 'Work',
    keywords: ['teams', 'zoom', 'autocad', 'trello', 'jira', 'asana', 'linear', 'notion', 'obsidian', 'onenote'],
    customCheck: (name) => name.includes('work') || name.includes('работа')
  },
  {
    key: 'Entertainment',
    keywords: ['spotify', 'youtube', 'netflix', 'yandex music', 'apple music', 'tidal', 'deezer', 'soundcloud', 'foobar2000', 'musicbee', 'aimp', 'winamp', 'itunes', 'vlc', 'mpv', 'potplayer', 'twitch', 'prime video', 'plex', 'cinema', 'movie'],
    customCheck: (name) => name.includes('music') || name.includes('музыка')
  },
  {
    key: 'Browser',
    keywords: ['chrome', 'edge', 'firefox', 'brave', 'opera', 'vivaldi', 'safari', 'browser', 'zen', 'msedge'],
    customCheck: (name) => name.includes('browser')
  },
  {
    key: 'System',
    keywords: ['explorer', 'settings', 'taskmgr', 'terminal', 'cmd', 'powershell', 'bash', 'file', 'total', 'cmd.exe', 'powershell.exe', 'conhost.exe', 'explorer.exe']
  }
];

export function getProgramTag(appName: string, exePath: string = '', windowTitle: string = ''): ProgramTag {
  if (!appName) {
    return {
      key: 'Uncategorized',
      ...CATEGORY_STYLES.Uncategorized
    };
  }

  try {
    const store = useActivityStore();
    const savedCategory = store.appCategories[appName];
    if (savedCategory && CATEGORY_STYLES[savedCategory]) {
      return { key: savedCategory, ...CATEGORY_STYLES[savedCategory] };
    }
  } catch {}

  const name = appName.toLowerCase();
  const path = exePath.toLowerCase();
  const title = windowTitle.toLowerCase();

  // If the app is a browser, try classifying based on the window title (website visited)
  const BROWSERS = ['chrome', 'edge', 'firefox', 'brave', 'opera', 'vivaldi', 'safari', 'browser', 'zen', 'msedge'];
  const isBrowser = BROWSERS.some(b => name.includes(b)) || path.includes('chrome') || path.includes('browser') || path.includes('msedge');
  
  if (isBrowser && title) {
    // 1. AI Websites
    const aiWebsites = ['chatgpt', 'claude.ai', 'gemini.google', 'deepseek', 'perplexity', 'poe.com', 'huggingface', 'openai', 'v0.dev'];
    if (aiWebsites.some(site => title.includes(site))) {
      return { key: 'AI', ...CATEGORY_STYLES.AI };
    }

    // 2. Creative Websites
    const creativeWebsites = ['figma', 'canva', 'adobe', 'behance', 'dribbble', 'photopea', 'pinterest', 'artstation', 'midjourney'];
    if (creativeWebsites.some(site => title.includes(site))) {
      return { key: 'Creative', ...CATEGORY_STYLES.Creative };
    }

    // 3. Finance/Crypto Websites
    const financeWebsites = ['binance', 'tradingview', 'metamask', 'coinmarketcap', 'coinbase', 'bybit', 'sheets.google', 'paypal', 'stripe', 'bank', 'ledger'];
    if (financeWebsites.some(site => title.includes(site))) {
      return { key: 'Finance', ...CATEGORY_STYLES.Finance };
    }

    // 4. Programming/Developer Websites
    const devWebsites = ['github', 'gitlab', 'stackoverflow', 'npmjs', 'crates.io', 'localhost', 'vercel', 'netlify', 'codepen', 'jsfiddle', 'mdn', 'w3schools', 'dev.to'];
    if (devWebsites.some(site => title.includes(site)) || title.includes('docs.')) {
      return { key: 'Programming', ...CATEGORY_STYLES.Programming };
    }

    // 5. Study Websites
    const studyWebsites = ['wikipedia', 'coursera', 'udemy', 'duolingo', 'stackexchange', 'quizlet', 'khanacademy', 'researchgate'];
    if (studyWebsites.some(site => title.includes(site))) {
      return { key: 'Study', ...CATEGORY_STYLES.Study };
    }

    // 6. Social Websites
    const socialWebsites = ['discord', 'telegram', 'whatsapp', 'viber', 'facebook', 'instagram', 'twitter', 'x.com', 'linkedin', 'reddit'];
    if (socialWebsites.some(site => title.includes(site))) {
      return { key: 'Social', ...CATEGORY_STYLES.Social };
    }

    // 7. Entertainment/Music Websites
    const entWebsites = ['youtube', 'netflix', 'spotify', 'twitch', 'soundcloud', 'apple music', 'prime video', 'hulu', 'disney+'];
    if (entWebsites.some(site => title.includes(site))) {
      return { key: 'Entertainment', ...CATEGORY_STYLES.Entertainment };
    }
  }

  for (const cat of KEYWORD_CATEGORIES) {
    if (
      cat.keywords.some(kw => name.includes(kw)) ||
      (cat.customCheck && cat.customCheck(name, path))
    ) {
      return { key: cat.key, ...CATEGORY_STYLES[cat.key] };
    }
  }

  if (appName && appName !== 'Idle' && appName !== 'No activity detected' && appName !== '?' && !appName.includes('TimiGS')) {
    runOnlineAppClassification(appName);
  }

  return {
    key: 'Uncategorized',
    ...CATEGORY_STYLES.Uncategorized
  };
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

    todayCodingSessions: [] as CodingSession[],
    codingStats: [] as CodingStats[],
    codingProjectStats: [] as CodingProjectStats[],
    totalCodingTime: 0,
    totalAiCodingTime: 0,
    currentCodingSession: null as CurrentCodingSession | null,
    settings: {
      language: 'en',
      theme: 'dark',
      autostart: true,
      minimize_to_tray: true
    } as Settings,
    appCategories: {} as Record<string, string>,
    isTracking: false,
    isLoading: false,
    isMobile: false,
    excludedProcesses: [] as string[]
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

      return [...state.todaySummary].sort((a, b) => b.total_seconds - a.total_seconds).slice(0, 5);
    },

    websiteUsage: (state) => {
      const BROWSERS = ['chrome', 'msedge', 'firefox', 'opera', 'brave', 'vivaldi'];
      const SITE_USAGE: Record<string, number> = {};

      state.todaySessions.forEach(session => {
        const appNameLower = session.app_name.toLowerCase();

        if (BROWSERS.some(b => appNameLower.includes(b))) {

          if (session.window_title.toLowerCase().includes('youtube music')) return;

          let site = 'Unknown';
          const title = session.window_title;





          let cleanTitle = title
            .replace(/ - Google Chrome$/i, '')
            .replace(/ - Microsoft Edge$/i, '')
            .replace(/ - Mozilla Firefox$/i, '')
            .replace(/ - Opera$/i, '')
            .replace(/ - Brave$/i, '')
            .replace(/ - Vivaldi$/i, '');


          const parts = cleanTitle.split(/ - | \| /);

          if (parts.length > 1) {

            site = parts[parts.length - 1].trim();
          } else {

            site = cleanTitle.trim();
          }


          if (site === 'New Tab') return; // Skip new tabs
          if (site.endsWith('.com') || site.endsWith('.org')) site = site;

          if (!SITE_USAGE[site]) SITE_USAGE[site] = 0;
          SITE_USAGE[site] += session.duration_seconds;
        }
      });


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


        if (!category || category === 'Uncategorized') {
           category = detectCategory(app.app_name, app.exe_path);
        }

        if (summary[category] !== undefined) {
          summary[category] += app.total_seconds;
        } else {

          summary['Uncategorized'] += app.total_seconds;
        }
      });


      return Object.entries(summary)
        .map(([name, seconds]) => ({ name, seconds }))
        .filter(cat => cat.seconds > 0)
        .sort((a, b) => b.seconds - a.seconds);
    },

    topCodingLanguages: (state) => {
      return [...state.codingStats].sort((a, b) => b.total_seconds - a.total_seconds).slice(0, 8);
    },

    manualCodingTime: (state) => {
      return Math.max(0, state.totalCodingTime - state.totalAiCodingTime);
    },

    aiCodingPercent: (state) => {
      if (state.totalCodingTime === 0) return 0;
      return Math.round((state.totalAiCodingTime / state.totalCodingTime) * 100);
    },

    topCodingProjects: (state) => {
      return [...state.codingProjectStats]
        .filter(p => p.project_dir && p.project_dir !== 'Unknown')
        .sort((a, b) => b.total_seconds - a.total_seconds)
        .slice(0, 6);
    }
  },

  actions: {
    async fetchCurrentActivity() {
      try {
        const [currentActivity, currentSession, currentCodingSession] = await Promise.all([
          invoke<ActiveWindow | null>('get_current_activity'),
          invoke<CurrentSession | null>('get_current_session'),
          invoke<CurrentCodingSession | null>('get_current_coding_session')
        ]);
        this.currentActivity = currentActivity;
        this.currentSession = currentSession;
        this.currentCodingSession = currentCodingSession;
      } catch (error) {
        console.error('Failed to fetch current activity:', error);
      }
    },

    async fetchTodayData() {
      this.isLoading = true;
      try {
        const [
          todaySummary,
          todaySessions,
          musicSummary,
          totalMusicTime,
          currentMusicSession
        ] = await Promise.all([
          invoke<AppUsageSummary[]>('get_today_summary'),
          invoke<ActivitySession[]>('get_today_activity'),
          invoke<MusicAppUsage[]>('get_music_today_summary'),
          invoke<number>('get_total_music_time_today'),
          invoke<MusicSession | null>('get_current_music_session')
        ]);

        this.todaySummary = todaySummary;
        this.todaySessions = todaySessions;
        this.musicSummary = musicSummary;
        this.totalMusicTime = totalMusicTime;
        this.currentMusicSession = currentMusicSession;

        await Promise.all([
          this.fetchCodingData(),
          this.fetchAppCategories()
        ]);
      } catch (error) {
        console.error('Failed to fetch today data:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async fetchCodingData() {
      try {
        const [
          todayCodingSessions,
          codingStats,
          codingProjectStats,
          totalCodingTime,
          totalAiCodingTime
        ] = await Promise.all([
          invoke<CodingSession[]>('get_today_coding_sessions'),
          invoke<CodingStats[]>('get_coding_stats_today'),
          invoke<CodingProjectStats[]>('get_coding_project_stats_today'),
          invoke<number>('get_total_coding_time_today'),
          invoke<number>('get_total_ai_coding_time_today')
        ]);

        this.todayCodingSessions = todayCodingSessions;
        this.codingStats = codingStats;
        this.codingProjectStats = codingProjectStats;
        this.totalCodingTime = totalCodingTime;
        this.totalAiCodingTime = totalAiCodingTime;
      } catch (error) {
        console.error('Failed to fetch coding data:', error);
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

        this.isMobile = false;
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

        const newCategories = { ...this.appCategories };

        if (category === 'Uncategorized' || !category) {
          delete newCategories[appName];
        } else {
          newCategories[appName] = category;
        }

        this.appCategories = newCategories;


        await invoke('save_setting_cmd', {
          key: 'app_categories',
          value: JSON.stringify(newCategories)
        });
      } catch (error) {
        console.error('Failed to save app category:', error);
      }
    },

    async fetchExcludedProcesses() {
      try {
        this.excludedProcesses = await invoke<string[]>('get_excluded_processes_cmd');
      } catch (error) {
        console.error('Failed to fetch excluded processes:', error);
        this.excludedProcesses = [];
      }
    },

    async addExcludedProcess(exePath: string) {
      try {
        await invoke('add_excluded_process_cmd', { exePath });
        await this.fetchExcludedProcesses();
      } catch (error) {
        console.error('Failed to add excluded process:', error);
        throw error;
      }
    },

    async removeExcludedProcess(exePath: string) {
      try {
        await invoke('remove_excluded_process_cmd', { exePath });
        await this.fetchExcludedProcesses();
      } catch (error) {
        console.error('Failed to remove excluded process:', error);
        throw error;
      }
    },

    clearAllData() {
      this.currentActivity = null;
      this.currentSession = null;
      this.todaySummary = [];
      this.todaySessions = [];
      this.weeklyStats = [];
      this.musicSummary = [];
      this.totalMusicTime = 0;
      this.currentMusicSession = null;
      this.todayCodingSessions = [];
      this.codingStats = [];
      this.codingProjectStats = [];
      this.totalCodingTime = 0;
      this.totalAiCodingTime = 0;
      this.currentCodingSession = null;
    },

    isProcessExcluded(exePath: string): boolean {
      const exeLower = exePath.toLowerCase();
      return this.excludedProcesses.some(p => p.toLowerCase() === exeLower);
    }
  }
});
