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
  }> = ({ title, icon, assets, description, accentColor }) => {
    const hasAssets = assets.length > 0;

    return (
      <div className="relative group h-full">
        <div className="relative h-full flex flex-col p-8 rounded-3xl glass-panel bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-300 hover:shadow-2xl">
          <div className="flex items-start justify-between mb-6">
            <div className={`p-4 rounded-2xl bg-white/5 border border-white/5 ${accentColor}`}>
               {icon}
            </div>
            {hasAssets && latestRelease && (
               <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-apple-gray-400 flex items-center gap-1.5">
                 <span className={`w-1.5 h-1.5 rounded-full bg-current opacity-75`}></span>
                 {latestRelease.tag_name}
               </div>
            )}
          </div>

          <h3 className="text-2xl font-display font-bold text-white mb-2">{title}</h3>
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
                    className="flex items-center justify-between w-full p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group/btn"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-apple-gray-800 text-apple-gray-300">
                        <DownloadIcon className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-semibold text-white">
                           {t.downloads.installer_label.replace('{ext}', ext)} {ext}
                        </span>
                        <span className="text-xs text-apple-gray-500 font-medium">
                          {formatSize(asset.size)}
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })
            ) : (
              <div className="p-6 rounded-xl bg-white/5 border border-dashed border-white/10 text-center flex flex-col items-center gap-3">
                 <AlertCircle className="w-6 h-6 text-apple-gray-500" />
                 <p className="text-xs text-apple-gray-400 font-medium">{t.downloads.no_assets_platform}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-20">
        <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 text-white tracking-tight">
            {t.downloads.title}
        </h1>
        <p className="text-xl text-apple-gray-400 max-w-2xl mx-auto leading-relaxed">{t.downloads.subtitle}</p>
        
        {loading && (
            <div className="mt-8 flex items-center justify-center gap-2 text-apple-blue font-medium">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-150"></div>
                <span className="ml-2">{t.downloads.loading}</span>
            </div>
        )}
      </div>

      {!loading && !latestRelease && (
          <div className="text-center p-12 glass-panel rounded-3xl border border-red-500/20 max-w-lg mx-auto bg-red-500/5">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-red-400 mb-2">{t.downloads.error}</h3>
              <p className="text-apple-gray-400 font-medium">Could not fetch release information from GitHub.</p>
          </div>
      )}

      {!loading && latestRelease && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <DownloadCard 
                title={t.downloads.windows}
                icon={<Monitor className="w-8 h-8" />}
                assets={windowsAssets}
                description={t.downloads.windows_desc}
                accentColor="text-blue-400"
            />
            <DownloadCard 
                title={t.downloads.mac}
                icon={<Apple className="w-8 h-8" />}
                assets={macAssets}
                description={t.downloads.mac_desc}
                accentColor="text-white"
            />
            <DownloadCard 
                title={t.downloads.linux}
                icon={<Terminal className="w-8 h-8" />}
                assets={linuxAssets}
                description={t.downloads.linux_desc}
                accentColor="text-orange-400"
            />
        </div>
      )}
      
      {!loading && latestRelease && (
          <div className="mt-24 max-w-3xl mx-auto">
              <div className="relative p-8 glass-panel rounded-3xl border border-white/5 bg-white/5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-start gap-5">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-purple-400">
                            <Box className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                {t.downloads.source_title}
                            </h3>
                            <p className="text-apple-gray-400 text-sm font-medium leading-relaxed">
                                {t.downloads.source_desc}
                            </p>
                        </div>
                    </div>
                    <a 
                        href={latestRelease.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-all shadow-xl shadow-white/5 whitespace-nowrap"
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