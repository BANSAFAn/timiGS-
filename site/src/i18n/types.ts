export enum Language {
  EN = 'en',
  UK = 'uk',
  DE = 'de',
  ZH_CN = 'zh-CN',
  ZH_TW = 'zh-TW',
  AR = 'ar',
  NL = 'nl',
  BE = 'be',
  FR = 'fr',
  ES = 'es',
}

export interface GithubAsset {
  id: number;
  name: string;
  size: number;
  browser_download_url: string;
  content_type: string;
}

export interface GithubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  prerelease: boolean;
  html_url: string;
  target_commitish: string;
  assets: GithubAsset[];
}

export interface Translation {
  nav: {
    home: string;
    releases: string;
    download: string;
    features: string;
    terms: string;
    docs: string;
    notes: string;
    testing: string;
    music: string;
  };
  hero: {
    badge: string;
    badge_new: string;
    tagline1: string;
    tagline2: string;
    subtext: string;
    cta_download: string;
    cta_github: string;
    stats_downloads: string;
    stats_stars: string;
    stats_platforms: string;
    stats_privacy: string;
  };
  whyTimiGS: {
    title: string;
    subtitle: string;
    features: {
      privacy: { badge: string; title: string; description: string };
      focus: { badge: string; title: string; description: string };
      timeout: { badge: string; title: string; description: string };
      analytics: { badge: string; title: string; description: string };
      crossplatform: { badge: string; title: string; description: string };
      opensource: { badge: string; title: string; description: string };
    };
  };
  features: {
    title: string;
    subtitle: string;
    sections: {
      tracking: { icon: string; title: string; description: string; highlights: string[] };
      timeline: { icon: string; title: string; description: string; highlights: string[] };
      focus: { icon: string; title: string; description: string; highlights: string[] };
      weather: { icon: string; title: string; description: string; highlights: string[] };
    };
  };
  animations: {
    title: string;
    subtitle: string;
    cards: {
      live: { title: string; description: string };
      transitions: { title: string; description: string };
      visual: { title: string; description: string };
    };
  };
  comparison: {
    title: string;
    subtitle: string;
    features: {
      free: string;
      opensource: string;
      focus: string;
      local: string;
      telemetry: string;
      desktop: string;
      android: string;
      breaks: string;
      weather: string;
      gdrive: string;
    };
    products: {
      timigs: string;
      rescuetime: string;
      toggl: string;
      wakatime: string;
    };
    labels: {
      yes: string;
      no: string;
      partial: string;
      alpha: string;
    };
  };
  platforms: {
    title: string;
    subtitle: string;
    tech: string;
    platforms: {
      windows: { name: string; description: string };
      macos: { name: string; description: string };
      linux: { name: string; description: string };
      android: { name: string; description: string };
    };
  };
  cta: {
    title: string;
    subtitle: string;
    primary: string;
    secondary: string;
  };
  footer: {
    rights: string;
    created_by: string;
    built_with: string;
  };
  downloads: {
    title: string;
    subtitle: string;
    latest_version: string;
    windows: string;
    windows_desc: string;
    mac: string;
    mac_desc: string;
    linux: string;
    linux_desc: string;
    android: string;
    android_desc: string;
    android_alpha_badge: string;
    android_alpha_warning: string;
    source: string;
    source_title: string;
    source_desc: string;
    installer_label: string;
    no_assets: string;
    loading: string;
    error: string;
    no_assets_platform: string;
    cta_download: string;
  };
  releases: {
    title: string;
    subtitle: string;
    published_on: string;
    view_on_github: string;
    assets: string;
    latest_badge: string;
    prerelease_badge: string;
  };
  terms: {
    title: string;
    privacy_title: string;
    privacy_content: string;
    data_title: string;
    data_content: string;
    license_title: string;
    license_content: string;
  };
  testing: {
    title: string;
    subtitle: string;
    latest_commit: string;
    recent_changes: string;
    test_builds: string;
    commit_by: string;
    no_commits: string;
    download_debug: string;
    alpha_warning: string;
  };
}