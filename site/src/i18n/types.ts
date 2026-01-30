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
}