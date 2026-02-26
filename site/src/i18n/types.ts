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
  };
  hero: {
    new_version: string;
    tagline: string;
    subtext: string;
    cta_download: string;
    cta_github: string;
    built_for: string;
    powered_by: string;
  };
  features: {
    title: string;
    realtime_title: string;
    realtime_desc: string;
    privacy_title: string;
    privacy_desc: string;
    analytics_title: string;
    analytics_desc: string;
    timeline_title: string;
    timeline_desc: string;
    crossplatform_title: string;
    crossplatform_desc: string;
    i18n_title: string;
    i18n_desc: string;
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
  footer: {
    rights: string;
    created_by: string;
    built_with: string;
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
  home: {
    badge: string;
    hero_line1: string;
    hero_line2: string;
    unique_title: string;
    unique_subtitle: string;
    feat_focus_title: string;
    feat_focus_desc: string;
    feat_timeout_title: string;
    feat_timeout_desc: string;
    feat_weather_title: string;
    feat_weather_desc: string;
    feat_gdrive_title: string;
    feat_gdrive_desc: string;
    feat_privacy_title: string;
    feat_privacy_desc: string;
    feat_analytics_title: string;
    feat_analytics_desc: string;
    compare_title: string;
    compare_subtitle: string;
    compare_free: string;
    compare_opensource: string;
    compare_focus: string;
    compare_local: string;
    compare_notelemetry: string;
    compare_desktop: string;
    compare_android: string;
    compare_breaks: string;
    compare_weather: string;
    compare_gdrive: string;
    platform_label: string;
    platform_title: string;
    platform_desc: string;
    platform_tech: string;
    cta_title: string;
    cta_subtitle: string;
  };
}