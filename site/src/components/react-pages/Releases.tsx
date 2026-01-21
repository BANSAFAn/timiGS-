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
  GitCommit,
  Tag
} from 'lucide-react';

const AssetIcon: React.FC<{ name: string }> = ({ name }) => {
  const n = name.toLowerCase();
  if (n.endsWith('.exe') || n.endsWith('.msi')) return <Monitor className="w-4 h-4 text-blue-400" />;
  if (n.endsWith('.dmg') || n.endsWith('.app')) return <Apple className="w-4 h-4 text-white" />;
  if (n.endsWith('.deb') || n.endsWith('.rpm') || n.endsWith('.appimage')) return <Terminal className="w-4 h-4 text-orange-400" />;
  if (n.endsWith('.zip') || n.endsWith('.tar.gz') || n.endsWith('.7z')) return <Archive className="w-4 h-4 text-yellow-400" />;
  if (n.endsWith('.json') || n.endsWith('.sig') || n.endsWith('.pem')) return <FileCode className="w-4 h-4 text-purple-400" />;
  return <Package className="w-4 h-4 text-apple-gray-400" />;
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
            <div className="w-16 h-16 border-4 border-white/5 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-apple-blue border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
        </div>
        <p className="text-apple-gray-400 font-medium animate-pulse">{t.downloads.loading}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-apple-blue/10 blur-[120px] rounded-full -z-10"></div>
        <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 text-white tracking-tight">
          {t.releases.title}
        </h1>
        <p className="text-lg text-apple-gray-400 max-w-2xl mx-auto font-medium">
           {releases.length > 0 ? t.releases.subtitle : t.downloads.no_assets}
        </p>
      </div>

      <div className="space-y-12">
        {releases.map((release, index) => {
          const isLatest = index === 0;
          return (
            <div key={release.id} className="relative group">
              {/* Card Container */}
              <div className={`relative flex flex-col rounded-3xl overflow-hidden transition-all duration-300
                  ${isLatest 
                    ? 'glass-panel bg-white/5 border border-white/10 shadow-2xl shadow-apple-blue/5' 
                    : 'bg-white/5 border border-white/5 hover:border-white/10'
                  }`}
              >
                {/* Decoration for Latest */}
                {isLatest && (
                    <div className="absolute top-0 right-0 p-6">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-apple-blue/10 border border-apple-blue/20 text-apple-blue text-xs font-bold uppercase tracking-wider">
                            <Sparkles className="w-3 h-3" />
                            {t.releases.latest_badge}
                        </div>
                    </div>
                )}

                {/* Card Header */}
                <div className="p-8 border-b border-white/5">
                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex items-baseline gap-4 flex-wrap">
                            <h2 className="text-3xl font-display font-bold text-white tracking-tight">
                                {release.tag_name}
                            </h2>
                            {release.prerelease && (
                                <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-mono font-bold uppercase">
                                    {t.releases.prerelease_badge}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-6 text-sm text-apple-gray-400">
                             <span className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-apple-gray-500" />
                                {new Date(release.published_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                             </span>
                             <span className="flex items-center gap-2 font-mono text-xs">
                                <GitCommit className="w-3.5 h-3.5 text-apple-gray-500" />
                                {release.target_commitish.substring(0, 7)}
                             </span>
                        </div>
                    </div>

                    {/* Changelog */}
                    <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-apple-gray-300 prose-li:text-apple-gray-300 prose-a:text-apple-blue prose-a:no-underline hover:prose-a:underline prose-code:text-white prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none">
                        <ReactMarkdown>{release.body}</ReactMarkdown>
                    </div>
                </div>

                {/* Assets Section */}
                <div className="p-8 bg-black/20">
                    <h3 className="text-xs font-bold text-apple-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {t.releases.assets} 
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {release.assets.map(asset => (
                            <a 
                                key={asset.id}
                                href={asset.browser_download_url}
                                className="group/asset flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all duration-300"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 rounded-lg bg-white/5 text-apple-gray-400 group-hover/asset:text-white transition-colors">
                                        <AssetIcon name={asset.name} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-medium text-apple-gray-200 group-hover/asset:text-white truncate transition-colors">
                                            {asset.name}
                                        </span>
                                        <span className="text-xs text-apple-gray-500 font-medium">
                                            {formatSize(asset.size)}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-2 text-apple-gray-500 group-hover/asset:text-apple-blue transition-transform duration-300 group-hover/asset:-translate-y-1">
                                    <Download className="w-5 h-5" />
                                </div>
                            </a>
                        ))}
                    </div>

                    {/* View on GitHub Button */}
                    <div className="mt-8 flex justify-end">
                        <a 
                            href={release.html_url}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-apple-gray-400 hover:text-white transition-colors group/link"
                        >
                            {t.releases.view_on_github}
                            <ExternalLink className="w-4 h-4 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5 opacity-50 group-hover/link:opacity-100" />
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