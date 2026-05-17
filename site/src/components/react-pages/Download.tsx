import React, { useEffect, useState } from 'react';
import { fetchReleases } from '../../services/githubService';
import { Language } from '../../i18n/types';
import type { GithubRelease, Translation } from '../../i18n/types';
import { Monitor, AppleLogo as Apple, TerminalWindow as Terminal, DownloadSimple as DownloadIcon, CheckCircle, Package, ArrowRight } from '@phosphor-icons/react';

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

  const platforms = [
    {
      id: "windows",
      name: "Windows",
      icon: <Monitor className="w-12 h-12" />,
      assets: windowsAssets,
      color: "from-blue-500 to-blue-600",
      recommended: ".exe",
    },
    {
      id: "mac",
      name: "macOS",
      icon: <Apple className="w-12 h-12" />,
      assets: macAssets,
      color: "from-gray-600 to-gray-700",
      recommended: ".dmg",
    },
    {
      id: "linux",
      name: "Linux",
      icon: <Terminal className="w-12 h-12" />,
      assets: linuxAssets,
      color: "from-orange-500 to-orange-600",
      recommended: ".AppImage",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex gap-3 justify-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" />
            <div className="w-4 h-4 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
            <div className="w-4 h-4 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading releases...</p>
        </div>
      </div>
    );
  }

  if (!latestRelease) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-12 rounded-3xl border-2 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 max-w-lg">
          <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Failed to load releases</h3>
          <p className="text-gray-600 dark:text-gray-400">Could not fetch release information from GitHub.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 space-y-20">
      <div className="text-center space-y-6 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold">
          <CheckCircle className="w-5 h-5" />
          Latest: {latestRelease.tag_name}
        </div>
        
        <h1 className="text-6xl md:text-7xl font-black text-gray-900 dark:text-white">
          Download TimiGS
        </h1>
        
        <p className="text-2xl text-gray-600 dark:text-gray-400 font-light">
          Choose your platform and start tracking
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
        {platforms.map((platform) => {
          const mainAsset = platform.assets.find(a => a.name.endsWith(platform.recommended)) || platform.assets[0];
          const hasAssets = platform.assets.length > 0;

          return (
            <div key={platform.id} className="group relative">
              <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-5 rounded-[2rem] transition-opacity blur-xl" />
              
              <div className="relative p-8 rounded-[2rem] border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-900 dark:hover:border-white transition-all hover:shadow-2xl">
                <div className={`w-20 h-20 rounded-2xl ${platform.id === 'windows' ? 'bg-blue-500' : platform.id === 'mac' ? 'bg-gray-600' : 'bg-orange-500'} text-white flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                  {platform.icon}
                </div>

                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {platform.name}
                </h3>

                {hasAssets && mainAsset ? (
                  <div className="space-y-4 mt-6">
                    <a
                      href={mainAsset.browser_download_url}
                      className="flex items-center justify-between p-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:scale-105 transition-transform group/btn"
                    >
                      <div className="flex items-center gap-3">
                        <DownloadIcon className="w-6 h-6" />
                        <div className="text-left">
                          <div className="font-bold">{mainAsset.name.split('.').pop()?.toUpperCase()}</div>
                          <div className="text-xs opacity-70">{formatSize(mainAsset.size)}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                    </a>

                    {platform.assets.length > 1 && (
                      <details className="text-sm">
                        <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium">
                          + {platform.assets.length - 1} more options
                        </summary>
                        <div className="mt-3 space-y-2">
                          {platform.assets.filter(a => a !== mainAsset).map(asset => (
                            <a
                              key={asset.id}
                              href={asset.browser_download_url}
                              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-900 dark:hover:border-white transition-colors"
                            >
                              <span className="font-medium text-gray-900 dark:text-white truncate">{asset.name}</span>
                              <span className="text-xs text-gray-500 ml-2">{formatSize(asset.size)}</span>
                            </a>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-500">No builds available</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="p-10 rounded-[2rem] bg-purple-100 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center flex-shrink-0">
              <Package className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Want the source code?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                TimiGS is fully open source. Build it yourself or contribute to the project.
              </p>
              <a
                href={latestRelease.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-bold hover:scale-105 transition-transform"
              >
                View on GitHub
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Download;
