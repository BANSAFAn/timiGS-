import React, { useEffect, useState, useRef } from 'react';
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

/* ── Scroll reveal hook ── */
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

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

/* ── Release Card with scroll animation ── */
const ReleaseCard: React.FC<{
  release: GithubRelease;
  index: number;
  isLatest: boolean;
  lang: Language;
  t: Translation;
  formatSize: (bytes: number) => string;
}> = ({ release, index, isLatest, lang, t, formatSize }) => {
  const { ref, visible } = useInView(0.05);
  const [expanded, setExpanded] = useState(isLatest);

  return (
    <div ref={ref} className={`relative md:flex items-start gap-12 group ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
      {/* Timeline Node */}
      <div className="absolute left-[-2.5rem] sm:left-[-2rem] md:left-1/2 md:-translate-x-1/2 top-8 z-10">
        <div className={`relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full border-[3px] transition-all duration-500 ${
          isLatest 
            ? 'bg-apple-blue border-apple-blue/40 shadow-[0_0_25px_rgba(0,113,227,0.4)]' 
            : visible 
              ? 'bg-apple-gray-800 border-white/15' 
              : 'bg-apple-gray-900 border-white/5'
        }`}>
          {isLatest && <div className="absolute inset-0 bg-apple-blue rounded-full animate-ping opacity-20" />}
          <div className={`w-2 h-2 rounded-full ${isLatest ? 'bg-white' : 'bg-apple-gray-500'}`} />
        </div>
      </div>

      {/* Date Column (Desktop) */}
      <div className={`hidden md:flex flex-col flex-1 pt-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} ${index % 2 === 0 ? 'items-end text-right' : 'items-start text-left'}`}>
        <span className="text-2xl sm:text-3xl font-display font-bold text-white mb-1">
          {new Date(release.published_at).toLocaleDateString(lang, { month: 'long', day: 'numeric' })}
        </span>
        <span className="text-apple-gray-500 font-mono text-sm">
          {new Date(release.published_at).getFullYear()}
        </span>
      </div>

      {/* Content Card */}
      <div className={`flex-1 w-full min-w-0 ml-10 sm:ml-0 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        style={{ transitionDelay: `${Math.min(index * 100, 400)}ms` }}
      >
        <div className={`relative rounded-2xl overflow-hidden transition-all duration-500
          ${isLatest
            ? 'bg-white/[0.04] border border-white/[0.1] shadow-2xl shadow-blue-500/5'
            : 'bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.04]'
          }`}
        >
          {/* Latest Badge */}
          {isLatest && (
            <div className="absolute top-0 right-0 p-5 z-10">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-apple-blue/10 border border-apple-blue/20 text-apple-blue text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                <Sparkles className="w-3 h-3" />
                {t.releases.latest_badge}
              </div>
            </div>
          )}

          {/* Card Header */}
          <div className="p-6 sm:p-8 border-b border-white/[0.04]">
            {/* Mobile Date */}
            <div className="md:hidden mb-4 flex items-center gap-2 text-apple-gray-400 text-sm font-medium">
              <Calendar className="w-4 h-4" />
              {new Date(release.published_at).toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-baseline gap-4 flex-wrap pr-20">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
                  {release.tag_name}
                </h2>
                {release.prerelease && (
                  <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold uppercase tracking-wide">
                    {t.releases.prerelease_badge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-apple-gray-500 font-mono">
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04]">
                  <GitCommit className="w-3.5 h-3.5" />
                  {release.target_commitish.substring(0, 7)}
                </span>
              </div>
            </div>

            {/* Changelog — collapsed by default for non-latest */}
            {!isLatest && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-apple-gray-500 hover:text-white font-medium mb-4 flex items-center gap-1.5 transition-colors"
              >
                <ArrowRight className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
                {expanded ? "Hide" : "Show"} changelog
              </button>
            )}

            <div className={`overflow-hidden transition-all duration-500 ${expanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
              <div className="prose prose-invert max-w-none prose-sm
                prose-headings:text-white prose-headings:font-display prose-headings:font-bold
                prose-p:text-apple-gray-300 prose-p:leading-relaxed
                prose-li:text-apple-gray-300 prose-li:marker:text-apple-gray-600
                prose-a:text-apple-blue prose-a:no-underline hover:prose-a:underline
                prose-code:text-white/80 prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-code:font-mono prose-code:text-xs
                prose-h1:text-xl prose-h2:text-lg prose-h3:text-base">
                <ReactMarkdown>{release.body}</ReactMarkdown>
              </div>
            </div>
          </div>

          {/* Assets Section */}
          <div className="p-5 sm:p-6 md:p-8 bg-black/10">
            <h3 className="text-[10px] sm:text-xs font-bold text-apple-gray-500 uppercase tracking-[0.15em] mb-5 flex items-center gap-2">
              <Package className="w-3.5 h-3.5" />
              {t.releases.assets} • {release.assets.length} files
            </h3>

            <div className="grid grid-cols-1 gap-2">
              {release.assets.map(asset => (
                <a
                  key={asset.id}
                  href={asset.browser_download_url}
                  className="group/asset flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:border-white/[0.12] hover:bg-white/[0.06] transition-all duration-300"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.05] text-apple-gray-400 group-hover/asset:text-white transition-colors flex-shrink-0">
                      <AssetIcon name={asset.name} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-apple-gray-200 group-hover/asset:text-white truncate transition-colors">
                        {asset.name}
                      </span>
                      <span className="text-xs text-apple-gray-500 font-mono mt-0.5">
                        {formatSize(asset.size)}
                      </span>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-apple-gray-600 group-hover/asset:text-white opacity-0 group-hover/asset:opacity-100 transition-all shrink-0 ml-2" />
                </a>
              ))}
            </div>

            {/* View on GitHub */}
            <div className="mt-6 pt-5 border-t border-white/[0.04] flex justify-end">
              <a
                href={release.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-apple-gray-500 hover:text-white transition-colors group/link px-4 py-2 rounded-full hover:bg-white/[0.04]"
              >
                {t.releases.view_on_github}
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1 opacity-50 group-hover/link:opacity-100" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
          <div className="w-16 h-16 border-4 border-white/5 rounded-full" />
          <div className="w-16 h-16 border-4 border-apple-blue border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
        </div>
        <p className="text-apple-gray-400 font-medium animate-pulse">{t.downloads.loading}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-24 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute top-[-100px] left-[30%] w-[600px] h-[500px] bg-apple-blue/8 blur-[180px] rounded-full pointer-events-none -z-10 animate-glow-pulse" />

      {/* Header */}
      <div className="text-center mb-20 md:mb-28">
        <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-apple-gray-300 mb-8">
            <Tag className="w-3.5 h-3.5 text-apple-blue" />
            {releases.length} releases
          </div>
        </div>

        <h1 className="animate-fade-in-up text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white tracking-tight mb-6 leading-[1.1]" style={{ animationDelay: "0.2s" }}>
          {t.releases.title}
        </h1>
        <p className="animate-fade-in-up text-lg text-apple-gray-400 max-w-2xl mx-auto font-medium leading-relaxed" style={{ animationDelay: "0.35s" }}>
          {releases.length > 0 ? t.releases.subtitle : t.downloads.no_assets}
        </p>
      </div>

      {/* Timeline */}
      <div className="relative space-y-12 md:space-y-16 pl-8 md:pl-0">
        {/* Timeline Line */}
        <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-apple-blue/40 via-white/8 to-transparent md:-translate-x-1/2" />

        {releases.map((release, index) => (
          <ReleaseCard
            key={release.id}
            release={release}
            index={index}
            isLatest={index === 0}
            lang={lang}
            t={t}
            formatSize={formatSize}
          />
        ))}
      </div>
    </div>
  );
};

export default Releases;