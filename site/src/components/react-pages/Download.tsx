import React, { useEffect, useState } from 'react';
import { fetchReleases } from '../../services/githubService';
import { Language } from '../../i18n/types';
import type { GithubRelease, GithubAsset, Translation } from '../../i18n/types';
import { Monitor, Apple, Terminal, Box, Download as DownloadIcon, AlertCircle, ExternalLink, Sparkles } from 'lucide-react';

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

  const formatSize = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1) + ' MB';

  const DownloadCard: React.FC<{ 
    title: string; 
    icon: React.ReactNode; 
    assets: GithubAsset[]; 
    description: string;
    accentColor: string;
    gradient: string;
  }> = ({ title, icon, assets, description, accentColor, gradient }) => {
    const hasAssets = assets.length > 0;

    return (
      <div className="relative group h-full">
        <div className={`absolute -inset-0.5 rounded-[2rem] bg-gradient-to-b ${gradient} opacity-0 group-hover:opacity-20 transition duration-500 blur-lg`}></div>
        <div className="relative h-full flex flex-col p-8 rounded-[2rem] glass-panel bg-[#1c1c1e]/40 border border-white/5 group-hover:border-white/10 transition-all duration-500 group-hover:shadow-2xl group-hover:translate-y-[-4px]">
          <div className="flex items-start justify-between mb-8">
            <div className={`p-5 rounded-2xl bg-white/5 border border-white/10 ${accentColor} shadow-inner`}>
               {icon}
            </div>
            {hasAssets && latestRelease && (
               <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-medium text-apple-gray-400 flex items-center gap-2 backdrop-blur-md">
                 <span className={`w-2 h-2 rounded-full bg-emerald-500 animate-pulse`}></span>
                 {latestRelease.tag_name}
               </div>
            )}
          </div>

          <h3 className="text-3xl font-display font-bold text-white mb-3 tracking-tight">{title}</h3>
          <p className="text-sm text-apple-gray-400 mb-8 flex-grow leading-relaxed font-medium">
            {description}
          </p>

          <div className="space-y-3 mt-auto">
            {hasAssets ? (
              assets.map(asset => {
                const ext = asset.name.split('.').pop()?.toUpperCase() || 'FILE';
                return (
                  <a
                    key={asset.id}
                    href={asset.browser_download_url}
                    className="flex items-center justify-between w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-300 group/btn active:scale-95"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-lg bg-black/40 text-apple-gray-300 shadow-sm">
                        <DownloadIcon className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-bold text-white tracking-wide">
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
              <div className="p-8 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center flex flex-col items-center gap-4">
                 <AlertCircle className="w-8 h-8 text-apple-gray-600" />
                 <p className="text-sm text-apple-gray-500 font-medium">{t.downloads.no_assets_platform}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-apple-blue/10 blur-[120px] rounded-full pointer-events-none -z-10 opacity-60 mix-blend-screen" />

      <div className="text-center mb-24 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-apple-blue mb-8 backdrop-blur-xl">
            <Sparkles className="w-4 h-4" />
            <span>Ready for Production</span>
        </div>
        <h1 className="text-6xl md:text-7xl font-display font-bold mb-6 text-white tracking-tight text-balance">
            {t.downloads.title}
        </h1>
        <p className="text-xl md:text-2xl text-apple-gray-400 max-w-2xl mx-auto leading-relaxed">
            {t.downloads.subtitle}
        </p>
        
        {loading && (
            <div className="mt-12 flex items-center justify-center gap-3 text-apple-blue font-semibold bg-apple-blue/10 px-6 py-3 rounded-full w-fit mx-auto border border-apple-blue/20">
                <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 bg-current rounded-full animate-bounce"></div>
                    <div className="w-2.5 h-2.5 bg-current rounded-full animate-bounce delay-75"></div>
                    <div className="w-2.5 h-2.5 bg-current rounded-full animate-bounce delay-150"></div>
                </div>
                <span className="tracking-wide text-sm uppercase">{t.downloads.loading}</span>
            </div>
        )}
      </div>

      {!loading && !latestRelease && (
          <div className="text-center p-12 glass-panel rounded-3xl border border-red-500/20 max-w-lg mx-auto bg-red-500/5 backdrop-blur-2xl">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6 opacity-80" />
              <h3 className="text-2xl font-bold text-red-400 mb-3">{t.downloads.error}</h3>
              <p className="text-apple-gray-400 font-medium text-lg">Could not fetch release information from GitHub.</p>
          </div>
      )}

      {!loading && latestRelease && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 relative z-10">
            <DownloadCard 
                title={t.downloads.windows}
                icon={<Monitor className="w-8 h-8" />}
                assets={windowsAssets}
                description={t.downloads.windows_desc}
                accentColor="text-blue-400"
                gradient="from-blue-500/20 to-cyan-500/20"
            />
            <DownloadCard 
                title={t.downloads.mac}
                icon={<Apple className="w-8 h-8" />}
                assets={macAssets}
                description={t.downloads.mac_desc}
                accentColor="text-white"
                gradient="from-white/20 to-gray-500/20"
            />
            <DownloadCard 
                title={t.downloads.linux}
                icon={<Terminal className="w-8 h-8" />}
                assets={linuxAssets}
                description={t.downloads.linux_desc}
                accentColor="text-orange-400"
                gradient="from-orange-500/20 to-red-500/20"
            />
        </div>
      )}
      
      {!loading && latestRelease && (
          <div className="mt-32 max-w-4xl mx-auto animate-fade-in-up">
              <div className="relative p-10 glass-panel rounded-[2.5rem] border border-white/5 bg-[#1c1c1e]/60 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="flex items-start gap-6">
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 text-purple-300 shadow-xl">
                            <Box className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                                {t.downloads.source_title}
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-apple-gray-400">Developers</span>
                            </h3>
                            <p className="text-apple-gray-400 text-base font-medium leading-relaxed max-w-md">
                                {t.downloads.source_desc}
                            </p>
                        </div>
                    </div>
                    <a 
                        href={latestRelease.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-8 py-4 rounded-full bg-white text-black font-bold hover:bg-gray-100 transition-all shadow-xl shadow-white/5 whitespace-nowrap hover:scale-105 active:scale-95"
                    >
                        <span>{t.releases.view_on_github}</span>
                        <ExternalLink className="w-4 h-4 opacity-50" />
                    </a>
                </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Download;