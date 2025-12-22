import React, { useEffect, useState } from 'react';
import { fetchReleases } from '../../services/githubService';
import { Language } from '../../i18n/types';
import type { GithubRelease, GithubAsset, Translation } from '../../i18n/types';
import { Monitor, Apple, Terminal, Box, Download as DownloadIcon, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';

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
        setLatestRelease(data[0]); // Assume first is latest
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
    glowColor: string;
    iconColor: string;
  }> = ({ title, icon, assets, description, glowColor, iconColor }) => {
    const hasAssets = assets.length > 0;

    return (
      <div className="relative group h-full">
        {/* Animated Glow Effect */}
        <div className={`absolute -inset-0.5 rounded-2xl blur opacity-20 group-hover:opacity-50 transition duration-500 ${glowColor}`}></div>
        
        <div className="relative h-full flex flex-col p-6 rounded-2xl glass-panel border border-slate-800 bg-slate-900/80 backdrop-blur-xl">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl bg-slate-800 border border-slate-700 ${iconColor}`}>
               {icon}
            </div>
            {hasAssets && latestRelease && (
               <div className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs font-mono text-slate-400 flex items-center gap-1">
                 <span className={`w-1.5 h-1.5 rounded-full ${glowColor.replace('bg-', 'bg-')}`}></span>
                 {latestRelease.tag_name}
               </div>
            )}
          </div>

          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-sm text-slate-400 mb-6 flex-grow leading-relaxed">
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
                    className="flex items-center justify-between w-full p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700 border border-slate-700/50 hover:border-slate-500 transition-all group/btn cursor-none overflow-hidden relative"
                  >
                    <div className="flex items-center gap-3 z-10">
                      <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400 group-hover/btn:text-white transition-colors">
                        <DownloadIcon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium text-slate-200 group-hover/btn:text-white transition-colors">
                           {t.downloads.installer_label.replace('{ext}', ext)} {ext}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatSize(asset.size)}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover/btn:text-white opacity-0 group-hover/btn:opacity-100 transition-all -translate-x-4 group-hover/btn:translate-x-0 z-10" />
                    
                    {/* Hover fill effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/10 to-slate-700/30 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                  </a>
                );
              })
            ) : (
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800/50 text-center flex flex-col items-center gap-2">
                 <AlertCircle className="w-5 h-5 text-slate-600" />
                 <p className="text-xs text-slate-500 font-medium">{t.downloads.no_assets_platform}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-sky-500/20 blur-[100px] rounded-full -z-10"></div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            {t.downloads.title}
        </h1>
        <p className="text-xl text-slate-400">{t.downloads.subtitle}</p>
        
        {loading && (
            <div className="mt-8 flex items-center justify-center gap-2 text-sky-400">
                <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce delay-150"></div>
                <span className="ml-2">{t.downloads.loading}</span>
            </div>
        )}
      </div>

      {!loading && !latestRelease && (
          <div className="text-center p-12 glass-panel rounded-2xl border border-red-900/30 max-w-lg mx-auto">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-red-400 mb-2">{t.downloads.error}</h3>
              <p className="text-slate-400">Could not fetch release information from GitHub.</p>
          </div>
      )}

      {!loading && latestRelease && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <DownloadCard 
                title={t.downloads.windows}
                icon={<Monitor className="w-8 h-8" />}
                assets={windowsAssets}
                description={t.downloads.windows_desc}
                glowColor="bg-blue-500"
                iconColor="text-blue-400"
            />
            <DownloadCard 
                title={t.downloads.mac}
                icon={<Apple className="w-8 h-8" />}
                assets={macAssets}
                description={t.downloads.mac_desc}
                glowColor="bg-slate-200"
                iconColor="text-slate-200"
            />
            <DownloadCard 
                title={t.downloads.linux}
                icon={<Terminal className="w-8 h-8" />}
                assets={linuxAssets}
                description={t.downloads.linux_desc}
                glowColor="bg-orange-500"
                iconColor="text-orange-400"
            />
        </div>
      )}
      
      {!loading && latestRelease && (
          <div className="mt-16 group relative">
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-purple-500/20 to-sky-500/20 blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
              <div className="relative p-8 glass-panel rounded-2xl border border-slate-800 bg-slate-900/50">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                            <Box className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                                {t.downloads.source_title}
                            </h3>
                            <p className="text-slate-400 text-sm max-w-md">
                                {t.downloads.source_desc}
                            </p>
                        </div>
                    </div>
                    <a 
                        href={latestRelease.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all border border-slate-700 hover:border-slate-600 hover:shadow-lg hover:shadow-purple-900/20 cursor-none"
                    >
                        <span>{t.downloads.view_github}</span>
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Download;