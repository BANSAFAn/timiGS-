import React, { useEffect, useState, useRef } from 'react';
import { fetchReleases } from '../../services/githubService';
import { Language } from '../../i18n/types';
import type { GithubRelease, GithubAsset, Translation } from '../../i18n/types';
import { Download as DownloadIcon, AlertCircle, ExternalLink, Sparkles, Shield, Zap, Box, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

interface DownloadProps {
    lang: Language;
    t: Translation;
}

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

/* ── SVG Icons ── */
const WindowsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4h-13.05M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
  </svg>
);

const AppleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-.8 1.94-.8s.16 1.06-.59 1.91c-.69.81-1.82.77-1.82.77s-.15-1.07.47-1.88"/>
  </svg>
);

const LinuxIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.065 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const AndroidIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.523 15.3414c-.5511 0-.9993-.4482-.9993-.9993s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993s-.4482.9993-.9993.9993m-11.046 0c-.5511 0-.9993-.4482-.9993-.9993s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993s-.4482.9993-.9993.9993m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1527-.5676.416.416 0 00-.5676.1527l-2.0225 3.5028C15.9502 8.3996 14.0282 8 12 8c-2.0282 0-3.9502.3996-5.1388.9481L4.8387 5.4473a.416.416 0 00-.5676-.1527.416.416 0 00-.1527.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396"/>
  </svg>
);

const ClockFaceIcon: React.FC<{ className?: string; animated?: boolean }> = ({ className, animated = false }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" className="opacity-20" />
    <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="1" className="opacity-10" strokeDasharray="4 4" />
    {[...Array(12)].map((_, i) => {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const x1 = 50 + 38 * Math.cos(angle);
      const y1 = 50 + 38 * Math.sin(angle);
      const x2 = 50 + 44 * Math.cos(angle);
      const y2 = 50 + 44 * Math.sin(angle);
      return (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="currentColor"
          strokeWidth={i % 3 === 0 ? 2 : 1}
          className={i % 3 === 0 ? 'opacity-60' : 'opacity-30'}
        />
      );
    })}
    <g className={animated ? 'animate-clock-hand-hour' : ''}>
      <line x1="50" y1="50" x2="50" y2="30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-80" />
    </g>
    <g className={animated ? 'animate-clock-hand-minute' : ''}>
      <line x1="50" y1="50" x2="50" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-60" />
    </g>
    <g className={animated ? 'animate-clock-hand-second' : ''}>
      <line x1="50" y1="54" x2="50" y2="14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="text-apple-blue opacity-80" />
    </g>
    <circle cx="50" cy="50" r="3" fill="currentColor" className="opacity-80" />
  </svg>
);

const Download: React.FC<DownloadProps> = ({ lang, t }) => {
  const [latestRelease, setLatestRelease] = useState<GithubRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [hoveredAsset, setHoveredAsset] = useState<number | null>(null);

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

  const formatSize = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1) + ' MB';

  const platforms = [
    {
      id: "windows",
      title: t.downloads.windows,
      icon: WindowsIcon,
      assets: getAssetsByExt(['.exe', '.msi']),
      description: t.downloads.windows_desc,
      accent: "from-blue-500 to-cyan-500",
      bgGlow: "shadow-blue-500/20",
      border: "border-blue-500/30",
      text: "text-blue-400",
      bg: "bg-blue-500/10",
      hoverBg: "hover:bg-blue-500/20",
    },
    {
      id: "mac",
      title: t.downloads.mac,
      icon: AppleIcon,
      assets: getAssetsByExt(['.dmg', '.app']),
      description: t.downloads.mac_desc,
      accent: "from-gray-300 to-gray-500",
      bgGlow: "shadow-gray-400/20",
      border: "border-gray-400/30",
      text: "text-gray-300",
      bg: "bg-gray-500/10",
      hoverBg: "hover:bg-gray-500/20",
    },
    {
      id: "linux",
      title: t.downloads.linux,
      icon: LinuxIcon,
      assets: getAssetsByExt(['.AppImage', '.rpm', '.deb']),
      description: t.downloads.linux_desc,
      accent: "from-orange-500 to-red-500",
      bgGlow: "shadow-orange-500/20",
      border: "border-orange-500/30",
      text: "text-orange-400",
      bg: "bg-orange-500/10",
      hoverBg: "hover:bg-orange-500/20",
    },
    {
      id: "android",
      title: t.downloads.android,
      icon: AndroidIcon,
      assets: getAssetsByExt(['.apk']),
      description: t.downloads.android_desc,
      accent: "from-green-500 to-emerald-500",
      bgGlow: "shadow-green-500/20",
      border: "border-green-500/30",
      text: "text-green-400",
      bg: "bg-green-500/10",
      hoverBg: "hover:bg-green-500/20",
      badge: t.downloads.android_alpha_badge,
      warning: t.downloads.android_alpha_warning,
    },
  ];

  const selectedPlatformData = selectedPlatform ? platforms.find(p => p.id === selectedPlatform) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 relative overflow-hidden py-8 md:py-16">
      {/* ═══ BACKGROUND CLOCK ANIMATION ═══ */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.03] pointer-events-none">
        <ClockFaceIcon className="w-full h-full text-white animate-clock-rotate" animated />
      </div>

      {/* Ambient background glows */}
      <div className="absolute top-[-100px] left-[20%] w-[700px] h-[500px] bg-apple-blue/8 blur-[180px] rounded-full pointer-events-none -z-10 animate-glow-pulse" />
      <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[400px] bg-purple-500/6 blur-[150px] rounded-full pointer-events-none -z-10 animate-glow-pulse" style={{ animationDelay: "1.5s" }} />

      {/* ═══ HERO SECTION ═══ */}
      <div className="text-center pt-8 md:pt-16 pb-12 md:pb-20 relative z-10">
        <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm text-xs font-semibold text-apple-gray-300 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-apple-blue" />
            {t.downloads.latest_version}
          </div>
        </div>

        <h1 className="animate-fade-in-up text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white tracking-tight mb-6 leading-[1.1]" style={{ animationDelay: "0.2s" }}>
          {t.downloads.title}
        </h1>

        <p className="animate-fade-in-up text-lg md:text-xl text-apple-gray-400 max-w-2xl mx-auto leading-relaxed mb-8" style={{ animationDelay: "0.35s" }}>
          {t.downloads.subtitle}
        </p>

        {/* Trust badges */}
        <div className="animate-fade-in-up flex flex-wrap justify-center gap-6 text-xs text-apple-gray-500 font-medium" style={{ animationDelay: "0.5s" }}>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            No Telemetry
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Lightweight
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            Time Tracking
          </div>
        </div>

        {loading && (
          <div className="mt-16 flex flex-col items-center gap-4">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-apple-blue/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-apple-blue border-t-transparent rounded-full animate-spin" />
              <ClockFaceIcon className="absolute inset-2 w-16 h-16 text-apple-blue opacity-50" animated />
            </div>
            <span className="text-apple-blue font-semibold tracking-wide text-sm">{t.downloads.loading}</span>
          </div>
        )}
      </div>

      {/* ═══ ERROR STATE ═══ */}
      {!loading && !latestRelease && (
        <div className="text-center p-12 rounded-3xl border border-red-500/15 max-w-lg mx-auto bg-red-500/[0.03] backdrop-blur-xl">
          <AlertCircle className="w-14 h-14 text-red-400/60 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-red-400 mb-3">{t.downloads.error}</h3>
          <p className="text-apple-gray-400 font-medium">Could not fetch release information from GitHub.</p>
        </div>
      )}

      {/* ═══ PLATFORM SELECTOR ═══ */}
      {!loading && latestRelease && (
        <>
          {/* Platform Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 relative z-10">
            {platforms.map((p, i) => {
              const IconComponent = p.icon;
              const hasAssets = p.assets.length > 0;
              const isSelected = selectedPlatform === p.id;
              
              return (
                <button
                  key={p.id}
                  onClick={() => hasAssets && setSelectedPlatform(isSelected ? null : p.id)}
                  disabled={!hasAssets}
                  className={`group relative rounded-2xl border ${isSelected ? p.border : 'border-white/[0.06]'} ${isSelected ? p.bg : 'bg-white/[0.02]'} ${p.hoverBg} p-6 transition-all duration-500 hover:shadow-xl ${isSelected ? `scale-[1.02] ${p.bgGlow} shadow-2xl` : 'hover:-translate-y-1'} disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {/* Glow effect */}
                  <div className={`absolute inset-0 ${p.bg} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none`} />
                  
                  <div className="relative z-10 flex flex-col items-center text-center gap-4">
                    <div className={`p-4 rounded-xl ${p.bg} ${p.text} transition-transform duration-500 group-hover:scale-110`}>
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{p.title}</h3>
                      {p.badge && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/25">
                          {p.badge}
                        </span>
                      )}
                    </div>
                    {hasAssets && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-mono font-medium text-apple-gray-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        {latestRelease.tag_name}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ═══ DOWNLOAD DETAILS (Animated Expansion) ═══ */}
          <div className={`transition-all duration-700 ease-out ${selectedPlatform ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
            {selectedPlatformData && (
              <div className={`rounded-3xl border ${selectedPlatformData.border} ${selectedPlatformData.bg} p-8 md:p-10 backdrop-blur-xl`}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${selectedPlatformData.bg} ${selectedPlatformData.text}`}>
                      <selectedPlatformData.icon className="w-10 h-10" />
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-display font-bold text-white">{selectedPlatformData.title}</h2>
                      <p className="text-apple-gray-400 text-sm mt-1">{selectedPlatformData.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPlatform(null)}
                    className="p-2 rounded-xl hover:bg-white/10 transition-colors text-apple-gray-400 hover:text-white"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Warning for alpha */}
                {selectedPlatformData.warning && (
                  <div className="mb-6 p-4 rounded-xl bg-amber-500/[0.06] border border-amber-500/15 text-sm text-amber-300/80 font-medium flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                    {selectedPlatformData.warning}
                  </div>
                )}

                {/* Download options */}
                <div className="space-y-3">
                  {selectedPlatformData.assets.map((asset, idx) => {
                    const ext = asset.name.split('.').pop()?.toUpperCase() || 'FILE';
                    const isHovered = hoveredAsset === asset.id;
                    
                    return (
                      <a
                        key={asset.id}
                        href={asset.browser_download_url}
                        onMouseEnter={() => setHoveredAsset(asset.id)}
                        onMouseLeave={() => setHoveredAsset(null)}
                        className={`group/dl flex items-center justify-between w-full p-5 rounded-2xl ${selectedPlatformData.bg} hover:${selectedPlatformData.hoverBg} border ${isHovered ? selectedPlatformData.border : 'border-white/[0.06]'} transition-all duration-300 ${isHovered ? 'scale-[1.01]' : ''}`}
                        style={{ animationDelay: `${idx * 50}ms` }}
                      >
                        <div className="flex items-center gap-5">
                          <div className={`p-3 rounded-xl ${selectedPlatformData.bg} ${selectedPlatformData.text}`}>
                            <DownloadIcon className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                              <span className="text-base font-semibold text-white">
                                {ext} {t.downloads.installer_label.replace('{ext}', ext)}
                              </span>
                              <CheckCircle2 className={`w-4 h-4 ${selectedPlatformData.text} opacity-0 group-hover/dl:opacity-100 transition-opacity`} />
                            </div>
                            <span className="text-xs text-apple-gray-500 font-mono mt-0.5">
                              {formatSize(asset.size)} • {latestRelease.tag_name}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className={`w-5 h-5 ${selectedPlatformData.text} group-hover/dl:translate-x-1 transition-transform`} />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ═══ ALL PLATFORMS (Collapsed View) ═══ */}
          {!selectedPlatform && (
            <div className="mt-8 space-y-4">
              {platforms.map((p, i) => {
                const hasAssets = p.assets.length > 0;
                if (!hasAssets) return null;
                
                return (
                  <div
                    key={p.id}
                    className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] p-6 transition-all duration-300 hover:border-white/[0.1]"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${p.bg} ${p.text}`}>
                          <p.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">{p.title}</h3>
                          <p className="text-xs text-apple-gray-500 mt-0.5">{p.assets.length} {t.downloads.installer_label.replace('{ext}', '')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-mono font-medium text-apple-gray-400">
                          {latestRelease.tag_name}
                        </span>
                        <button
                          onClick={() => setSelectedPlatform(p.id)}
                          className={`px-4 py-2 rounded-xl ${p.bg} ${p.text} font-semibold text-sm hover:opacity-80 transition-opacity flex items-center gap-2`}
                        >
                          <DownloadIcon className="w-4 h-4" />
                          {t.downloads.cta_download}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ SOURCE CODE ═══ */}
          <div className="mt-16 md:mt-20 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-white/[0.02] p-8 md:p-10 group hover:border-white/[0.1] transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/[0.03] to-blue-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-start gap-5 w-full md:w-auto">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/15 to-blue-500/15 border border-white/[0.06] text-purple-300 shadow-lg flex-shrink-0">
                    <Box className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3 flex-wrap">
                      {t.downloads.source_title}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/[0.06] text-apple-gray-400">Developers</span>
                    </h3>
                    <p className="text-sm text-apple-gray-400 font-medium leading-relaxed">
                      {t.downloads.source_desc}
                    </p>
                  </div>
                </div>
                <a
                  href={latestRelease.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/src flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-black font-bold text-sm hover:bg-gray-100 transition-all duration-300 shadow-xl shadow-white/5 whitespace-nowrap hover:scale-[1.03] active:scale-[0.97] w-full md:w-auto justify-center"
                >
                  {t.releases.view_on_github}
                  <ExternalLink className="w-4 h-4 opacity-40 group-hover/src:opacity-100 transition-opacity" />
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Download;
