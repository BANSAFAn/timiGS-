import React, { useEffect, useState } from 'react';
import { fetchReleases } from '../../services/githubService';
import { Language } from '../../i18n/types';
import type { GithubRelease, GithubAsset, Translation } from '../../i18n/types';
import { Monitor, Apple, Terminal, Smartphone, Box, Download as DownloadIcon, AlertCircle, ExternalLink, Sparkles } from 'lucide-react';

interface DownloadProps {
    lang: Language;
    t: Translation;
}

const Download: React.FC<DownloadProps> = ({ lang, t }) => {
  const [latestRelease, setLatestRelease] = useState<GithubRelease | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchReleases();
      if (data && data.length > 0) {
        setLatestRelease(data[0]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const getAssetsByExt = (exts: string[]) => {
    if (!latestRelease) return [];
    return latestRelease.assets.filter(asset => exts.some(ext => asset.name.endsWith(ext)));
  };

  const windowsAssets = getAssetsByExt(['.exe', '.msi']);
  const macAssets = getAssetsByExt(['.dmg', '.app']);
  const linuxAssets = getAssetsByExt(['.AppImage', '.rpm', '.deb']);
  const androidAssets = getAssetsByExt(['.apk']);

  const formatSize = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1) + ' MB';

  const DownloadCard: React.FC<{
    title: string;
    icon: React.ReactNode;
    assets: GithubAsset[];
    description: string;
    accentColor: string;
    gradient: string;
    badge?: string;
    badgeColor?: string;
    warning?: string;
  }> = ({ title, icon, assets, description, accentColor, gradient, badge, badgeColor, warning }) => {
    const hasAssets = assets.length > 0;

    return (
      <div className="relative group h-full">
        <div className={`absolute -inset-0.5 rounded-[2rem] bg-gradient-to-b ${gradient} opacity-0 group-hover:opacity-20 transition duration-500 blur-lg`}></div>
        <div className="relative h-full flex flex-col p-5 sm:p-6 md:p-8 rounded-[2rem] glass-panel bg-[#1c1c1e]/40 border border-white/5 group-hover:border-white/10 transition-all duration-500 group-hover:shadow-2xl group-hover:translate-y-[-2px]">
          <div className="flex items-start justify-between mb-6 sm:mb-8">
            <div className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 ${accentColor} shadow-inner`}>
               {icon}
            </div>
            {hasAssets && latestRelease && (
               <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-medium text-apple-gray-400 flex items-center gap-1.5 sm:gap-2 backdrop-blur-md">
                 <span className={`w-2 h-2 rounded-full bg-emerald-500 animate-pulse`}></span>
                 {latestRelease.tag_name}
               </div>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-white mb-2 sm:mb-3 tracking-tight flex items-center gap-2 sm:gap-3">
            {title}
            {badge && (
              <span className={`px-2 sm:px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${badgeColor || 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                {badge}
              </span>
            )}
          </h3>
          <p className="text-xs sm:text-sm text-apple-gray-400 mb-4 flex-grow leading-relaxed font-medium">
            {description}
          </p>

          {warning && (
            <div className="mb-4 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-medium leading-relaxed">
              {warning}
            </div>
          )}

          <div className="space-y-2 sm:space-y-3 mt-auto">
            {hasAssets ? (
              assets.map(asset => {
                const ext = asset.name.split('.').pop()?.toUpperCase() || 'FILE';
                return (
                  <a
                    key={asset.id}
                    href={asset.browser_download_url}
                    className="flex items-center justify-between w-full p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-300 group/btn active:scale-95"
                  >
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="p-2 sm:p-2.5 rounded-lg bg-black/40 text-apple-gray-300 shadow-sm">
                        <DownloadIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                           {t.downloads.installer_label.replace('{ext}', ext)} {ext}
                        </span>
                        <span className="text-xs text-apple-gray-500 font-mono">
                          {formatSize(asset.size)}
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })
            ) : (
              <div className="p-6 sm:p-8 rounded-xl sm:rounded-2xl bg-white/5 border border-dashed border-white/10 text-center flex flex-col items-center gap-3 sm:gap-4">
                 <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-apple-gray-600" />
                 <p className="text-xs sm:text-sm text-apple-gray-500 font-medium">{t.downloads.no_assets_platform}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-12 sm:py-16 md:py-24 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] sm:w-[1000px] h-[400px] sm:h-[600px] bg-apple-blue/10 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none -z-10 opacity-60 mix-blend-screen" />

      <div className="text-center mb-16 sm:mb-20 md:mb-24 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm font-medium text-apple-blue mb-6 sm:mb-8 backdrop-blur-xl">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Ready for Production</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 sm:mb-6 text-white tracking-tight px-2">
            {t.downloads.title}
        </h1>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-apple-gray-400 max-w-2xl mx-auto leading-relaxed px-4">
            {t.downloads.subtitle}
        </p>

        {loading && (
            <div className="mt-8 sm:mt-12 flex items-center justify-center gap-3 text-apple-blue font-semibold bg-apple-blue/10 px-4 sm:px-6 py-3 rounded-full w-fit mx-auto border border-apple-blue/20">
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-current rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-current rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-current rounded-full animate-bounce delay-150"></div>
                </div>
                <span className="tracking-wide text-xs sm:text-sm uppercase">{t.downloads.loading}</span>
            </div>
        )}
      </div>

      {!loading && !latestRelease && (
          <div className="text-center p-8 sm:p-12 glass-panel rounded-2xl sm:rounded-3xl border border-red-500/20 max-w-lg mx-auto bg-red-500/5 backdrop-blur-2xl mx-4">
              <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-400 mx-auto mb-4 sm:mb-6 opacity-80" />
              <h3 className="text-xl sm:text-2xl font-bold text-red-400 mb-3">{t.downloads.error}</h3>
              <p className="text-apple-gray-400 font-medium text-base sm:text-lg">Could not fetch release information from GitHub.</p>
          </div>
      )}

      {!loading && latestRelease && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-12 relative z-10">
            <DownloadCard
                title={t.downloads.windows}
                icon={<Monitor className="w-6 h-6 sm:w-8 sm:h-8" />}
                assets={windowsAssets}
                description={t.downloads.windows_desc}
                accentColor="text-blue-400"
                gradient="from-blue-500/20 to-cyan-500/20"
            />
            <DownloadCard
                title={t.downloads.mac}
                icon={<Apple className="w-6 h-6 sm:w-8 sm:h-8" />}
                assets={macAssets}
                description={t.downloads.mac_desc}
                accentColor="text-white"
                gradient="from-white/20 to-gray-500/20"
            />
            <DownloadCard
                title={t.downloads.linux}
                icon={<Terminal className="w-6 h-6 sm:w-8 sm:h-8" />}
                assets={linuxAssets}
                description={t.downloads.linux_desc}
                accentColor="text-orange-400"
                gradient="from-orange-500/20 to-red-500/20"
            />
            <DownloadCard
                title={t.downloads.android}
                icon={<Smartphone className="w-6 h-6 sm:w-8 sm:h-8" />}
                assets={androidAssets}
                description={t.downloads.android_desc}
                accentColor="text-green-400"
                gradient="from-green-500/20 to-emerald-500/20"
                badge={t.downloads.android_alpha_badge}
                warning={t.downloads.android_alpha_warning}
            />
        </div>
      )}
      
      {!loading && latestRelease && (
          <div className="mt-16 sm:mt-20 md:mt-24 lg:mt-32 max-w-4xl mx-auto animate-fade-in-up px-3 sm:px-4">
              <div className="relative p-6 sm:p-8 md:p-10 glass-panel rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 bg-[#1c1c1e]/60 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 md:gap-10">
                    <div className="flex items-start gap-4 sm:gap-6 w-full md:w-auto">
                        <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 text-purple-300 shadow-xl flex-shrink-0">
                            <Box className="w-6 h-6 sm:w-8 sm:h-8" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-2 flex items-center gap-2 sm:gap-3 flex-wrap">
                                {t.downloads.source_title}
                                <span className="px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-white/10 text-apple-gray-400">Developers</span>
                            </h3>
                            <p className="text-xs sm:text-sm md:text-base text-apple-gray-400 font-medium leading-relaxed">
                                {t.downloads.source_desc}
                            </p>
                        </div>
                    </div>
                    <a
                        href={latestRelease.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-full bg-white text-black font-bold text-sm sm:text-base hover:bg-gray-100 transition-all shadow-xl shadow-white/5 whitespace-nowrap hover:scale-105 active:scale-95 w-full md:w-auto justify-center"
                    >
                        <span>{t.releases.view_on_github}</span>
                        <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-50" />
                    </a>
                </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Download;