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
  Tag,
  ArrowRight
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
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-12 sm:py-16 md:py-24">
      {/* Header */}
      <div className="text-center mb-16 sm:mb-20 md:mb-24 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-apple-blue/10 blur-[100px] sm:blur-[120px] rounded-full -z-10 pointer-events-none"></div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl lg:text-7xl font-display font-bold mb-4 sm:mb-6 text-white tracking-tight px-2">
          {t.releases.title}
        </h1>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-apple-gray-400 max-w-2xl mx-auto font-medium leading-relaxed px-4">
           {releases.length > 0 ? t.releases.subtitle : t.downloads.no_assets}
        </p>
      </div>

      <div className="relative space-y-10 sm:space-y-12 md:space-y-16 pl-6 sm:pl-8 md:pl-0">
        {/* Timeline Line */}
        <div className="absolute left-6 sm:left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-apple-blue/50 via-white/10 to-transparent -translate-x-1/2 hidden md:block"></div>
        <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-apple-blue/50 via-white/10 to-transparent md:hidden"></div>

        {releases.map((release, index) => {
          const isLatest = index === 0;
          return (
            <div key={release.id} className={`relative md:flex items-start gap-8 sm:gap-12 group ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>

              {/* Timeline Node */}
              <div className="absolute left-[-2.5rem] sm:left-[-2rem] md:left-1/2 md:-translate-x-1/2 top-6 sm:top-8 md:top-8 z-10">
                  <div className={`relative flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full border-4 ${isLatest ? 'bg-apple-blue border-apple-blue/30 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-apple-gray-900 border-white/10'}`}>
                    {isLatest && <div className="absolute inset-0 bg-apple-blue rounded-full animate-ping opacity-20"></div>}
                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isLatest ? 'bg-white' : 'bg-apple-gray-500'}`}></div>
                  </div>
              </div>

              {/* Date Column (Desktop) */}
              <div className={`hidden md:flex flex-col flex-1 pt-6 sm:pt-8 ${index % 2 === 0 ? 'items-end text-right' : 'items-start text-left'}`}>
                 <span className="text-2xl sm:text-3xl font-display font-bold text-white mb-1 sm:mb-2">{new Date(release.published_at).toLocaleDateString(lang, { month: 'long', day: 'numeric' })}</span>
                 <span className="text-apple-gray-400 font-mono text-xs sm:text-sm">{new Date(release.published_at).getFullYear()}</span>
              </div>

              {/* Content Card */}
              <div className="flex-1 w-full min-w-0 ml-10 sm:ml-0">
                <div className={`relative flex flex-col rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden transition-all duration-500 group-hover:-translate-y-1
                    ${isLatest
                        ? 'glass-panel bg-[#1c1c1e]/80 border border-white/10 shadow-2xl shadow-blue-500/5'
                        : 'bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10'
                    }`}
                >
                    {/* Latest Badge */}
                    {isLatest && (
                        <div className="absolute top-0 right-0 p-4 sm:p-6 z-10">
                            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-apple-blue/10 border border-apple-blue/20 text-apple-blue text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-lg shadow-blue-500/10">
                                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                {t.releases.latest_badge}
                            </div>
                        </div>
                    )}

                    {/* Card Header */}
                    <div className="p-5 sm:p-6 md:p-8 border-b border-white/5 relative">
                        {/* Mobile Date */}
                        <div className="md:hidden mb-4 flex items-center gap-2 text-apple-gray-400 text-xs sm:text-sm font-medium">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            {new Date(release.published_at).toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>

                        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6 relative z-10">
                            <div className="flex items-baseline gap-3 sm:gap-4 flex-wrap pr-16 sm:pr-20">
                                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight">
                                    {release.tag_name}
                                </h2>
                                {release.prerelease && (
                                    <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] sm:text-xs font-bold uppercase tracking-wide">
                                        {t.releases.prerelease_badge}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-apple-gray-500 font-mono">
                                 <span className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/5">
                                    <GitCommit className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    {release.target_commitish.substring(0, 7)}
                                 </span>
                            </div>
                        </div>

                        {/* Changelog */}
                        <div className="prose prose-invert max-w-none
                            prose-headings:text-white prose-headings:font-display prose-headings:font-bold
                            prose-p:text-apple-gray-300 prose-p:leading-relaxed
                            prose-li:text-apple-gray-300 prose-li:marker:text-apple-gray-600
                            prose-a:text-apple-blue prose-a:no-underline hover:prose-a:underline
                            prose-code:text-white prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-code:font-mono prose-code:text-xs
                            prose-h1:text-xl prose-h2:text-lg prose-h3:text-base">
                            <ReactMarkdown>{release.body}</ReactMarkdown>
                        </div>
                    </div>

                    {/* Assets Section */}
                    <div className="p-4 sm:p-6 md:p-8 bg-black/20">
                        <h3 className="text-[10px] sm:text-xs font-bold text-apple-gray-500 uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-1.5 sm:gap-2 pl-1">
                            <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                            {t.releases.assets}
                        </h3>

                        <div className="grid grid-cols-1 gap-2 sm:gap-3">
                            {release.assets.map(asset => (
                                <a
                                    key={asset.id}
                                    href={asset.browser_download_url}
                                    className="group/asset flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                                        <div className="p-2 sm:p-2.5 rounded-lg bg-[#1c1c1e] border border-white/5 text-apple-gray-400 group-hover/asset:text-white transition-colors shadow-sm flex-shrink-0">
                                            <AssetIcon name={asset.name} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs sm:text-sm font-semibold text-apple-gray-200 group-hover/asset:text-white truncate transition-colors">
                                                {asset.name}
                                            </span>
                                            <span className="text-[10px] sm:text-xs text-apple-gray-500 font-mono mt-0.5">
                                                {formatSize(asset.size)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-1.5 sm:p-2 text-apple-gray-500 group-hover/asset:text-white transition-transform duration-300 group-hover/asset:-translate-y-0.5 opacity-0 group-hover/asset:opacity-100 flex-shrink-0">
                                        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                </a>
                            ))}
                        </div>

                        {/* View on GitHub Button */}
                        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/5 flex justify-end">
                            <a
                                href={release.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold text-apple-gray-400 hover:text-white transition-colors group/link px-3 sm:px-4 py-2 rounded-full hover:bg-white/5"
                            >
                                {t.releases.view_on_github}
                                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover/link:translate-x-1 opacity-50 group-hover/link:opacity-100" />
                            </a>
                        </div>
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