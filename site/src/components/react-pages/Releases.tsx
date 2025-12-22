import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { fetchReleases } from '../../services/githubService';
import { Language } from '../../i18n/types';
import type { GithubRelease, Translation } from '../../i18n/types';
import { 
  Calendar, 
  ExternalLink, 
  Package, 
  Download, 
  Monitor, 
  Apple, 
  Terminal, 
  FileCode, 
  Archive,
  Sparkles,
  GitCommit
} from 'lucide-react';

const AssetIcon: React.FC<{ name: string }> = ({ name }) => {
  const n = name.toLowerCase();
  if (n.endsWith('.exe') || n.endsWith('.msi')) return <Monitor className="w-4 h-4 text-blue-400" />;
  if (n.endsWith('.dmg') || n.endsWith('.app')) return <Apple className="w-4 h-4 text-slate-200" />;
  if (n.endsWith('.deb') || n.endsWith('.rpm') || n.endsWith('.appimage')) return <Terminal className="w-4 h-4 text-orange-400" />;
  if (n.endsWith('.zip') || n.endsWith('.tar.gz') || n.endsWith('.7z')) return <Archive className="w-4 h-4 text-yellow-400" />;
  if (n.endsWith('.json') || n.endsWith('.sig') || n.endsWith('.pem')) return <FileCode className="w-4 h-4 text-purple-400" />;
  return <Package className="w-4 h-4 text-slate-400" />;
};

interface ReleasesProps {
    lang: Language;
    t: Translation;
}

const Releases: React.FC<ReleasesProps> = ({ lang, t }) => {
  const [releases, setReleases] = useState<GithubRelease[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchReleases();
      if (data && data.length > 0) {
        setReleases(data);
      }
      setLoading(false);
    };
    load();
  }, []);

  const formatSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-800 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="text-slate-400 animate-pulse">{t.downloads.loading}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 blur-[120px] rounded-full -z-10"></div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          {t.releases.title}
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
           {releases.length > 0 
            ? `${t.releases.subtitle}` 
            : t.downloads.no_assets}
        </p>
      </div>

      <div className="relative border-l border-slate-800 ml-4 md:ml-12 space-y-16 pb-12">
        {releases.map((release, index) => {
          const isLatest = index === 0;
          return (
            <div key={release.id} className="relative pl-8 md:pl-12 group">
              
              {/* Timeline Node */}
              <div className={`absolute -left-[5px] md:-left-[5px] top-8 w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 z-20
                ${isLatest 
                    ? 'bg-sky-500 border-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.6)] scale-125' 
                    : 'bg-slate-900 border-slate-600 group-hover:border-sky-400'}`} 
              />
              
              {/* Card Container */}
              <div className={`relative flex flex-col rounded-2xl border transition-all duration-500 overflow-hidden
                  ${isLatest 
                    ? 'bg-slate-900/60 border-sky-500/30 shadow-[0_0_30px_rgba(14,165,233,0.1)]' 
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  } glass-panel`}
              >
                {/* Decoration for Latest */}
                {isLatest && (
                    <div className="absolute top-0 right-0 p-4">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold shadow-inner">
                            <Sparkles className="w-3 h-3" />
                            {t.releases.latest_badge}
                        </div>
                    </div>
                )}

                {/* Card Header */}
                <div className="p-6 md:p-8 border-b border-slate-800/50">
                    <div className="flex flex-col gap-2 mb-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-3xl font-bold text-white tracking-tight">
                                {release.tag_name}
                            </h2>
                            {release.prerelease && (
                                <span className="px-2.5 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-mono font-medium">
                                    {t.releases.prerelease_badge}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                             <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-slate-500" />
                                {new Date(release.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                             </span>
                             <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                             <span className="flex items-center gap-1.5 font-mono text-xs text-slate-500">
                                <GitCommit className="w-3.5 h-3.5" />
                                {release.target_commitish.substring(0, 7)}
                             </span>
                        </div>
                    </div>

                    {/* Changelog */}
                    <div className="prose prose-invert prose-slate max-w-none prose-headings:text-slate-200 prose-a:text-sky-400 prose-a:no-underline hover:prose-a:underline prose-code:text-sky-300 prose-code:bg-slate-800/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                        <ReactMarkdown>{release.body}</ReactMarkdown>
                    </div>
                </div>

                {/* Assets Section */}
                <div className="p-6 md:p-8 bg-slate-950/30">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {t.releases.assets} 
                        <span className="text-slate-600 font-normal normal-case">({release.assets.length})</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {release.assets.map(asset => (
                            <a 
                                key={asset.id}
                                href={asset.browser_download_url}
                                className="group/asset flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-sky-500/30 hover:bg-slate-800 transition-all duration-300 cursor-none"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover/asset:bg-slate-700 group-hover/asset:text-white transition-colors">
                                        <AssetIcon name={asset.name} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-medium text-slate-300 group-hover/asset:text-white truncate transition-colors">
                                            {asset.name}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {formatSize(asset.size)}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-2 text-slate-500 group-hover/asset:text-sky-400 transition-transform duration-300 group-hover/asset:-translate-y-1 group-hover/asset:translate-x-1">
                                    <Download className="w-5 h-5" />
                                </div>
                            </a>
                        ))}
                    </div>

                    {/* View on GitHub Button */}
                    <div className="mt-6 pt-4 border-t border-slate-800/50 flex justify-end">
                        <a 
                            href={release.html_url}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors group/link cursor-none"
                        >
                            {t.releases.view_on_github}
                            <ExternalLink className="w-4 h-4 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
                        </a>
                    </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Releases;