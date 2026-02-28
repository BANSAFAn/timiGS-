import React, { useEffect, useState, useRef } from 'react';
import { fetchReleases } from '../../services/githubService';
import { Language } from '../../i18n/types';
import type { GithubRelease, GithubAsset, Translation } from '../../i18n/types';
import { Monitor, Apple, Terminal, Smartphone, Box, Download as DownloadIcon, AlertCircle, ExternalLink, Sparkles, ArrowRight, Shield, Zap } from 'lucide-react';

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

  const platforms = [
    {
      id: "windows",
      title: t.downloads.windows,
      icon: <Monitor className="w-7 h-7" />,
      assets: windowsAssets,
      description: t.downloads.windows_desc,
      accent: "from-blue-500 to-cyan-500",
      iconBg: "from-blue-500/15 to-cyan-500/15",
      borderHover: "hover:border-blue-500/25",
      glow: "bg-blue-500/8",
    },
    {
      id: "mac",
      title: t.downloads.mac,
      icon: <Apple className="w-7 h-7" />,
      assets: macAssets,
      description: t.downloads.mac_desc,
      accent: "from-gray-300 to-gray-500",
      iconBg: "from-white/10 to-gray-500/10",
      borderHover: "hover:border-gray-400/25",
      glow: "bg-white/5",
    },
    {
      id: "linux",
      title: t.downloads.linux,
      icon: <Terminal className="w-7 h-7" />,
      assets: linuxAssets,
      description: t.downloads.linux_desc,
      accent: "from-orange-500 to-red-500",
      iconBg: "from-orange-500/15 to-red-500/15",
      borderHover: "hover:border-orange-500/25",
      glow: "bg-orange-500/8",
    },
    {
      id: "android",
      title: t.downloads.android,
      icon: <Smartphone className="w-7 h-7" />,
      assets: androidAssets,
      description: t.downloads.android_desc,
      accent: "from-green-500 to-emerald-500",
      iconBg: "from-green-500/15 to-emerald-500/15",
      borderHover: "hover:border-green-500/25",
      glow: "bg-green-500/8",
      badge: t.downloads.android_alpha_badge,
      warning: t.downloads.android_alpha_warning,
    },
  ];



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 relative overflow-hidden py-8 md:py-16">
      {/* Ambient background */}
      <div className="absolute top-[-100px] left-[20%] w-[700px] h-[500px] bg-apple-blue/8 blur-[180px] rounded-full pointer-events-none -z-10 animate-glow-pulse" />
      <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[400px] bg-purple-500/6 blur-[150px] rounded-full pointer-events-none -z-10 animate-glow-pulse" style={{ animationDelay: "1.5s" }} />

      {/* ═══ HERO ═══ */}
      <div className="text-center pt-8 md:pt-16 pb-16 md:pb-24 relative z-10">
        <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm text-xs font-semibold text-apple-gray-300 mb-8">
            <Sparkles className="w-3.5 h-3.5 text-apple-blue" />
            Ready for Production
          </div>
        </div>

        <h1 className="animate-fade-in-up text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white tracking-tight mb-6 leading-[1.1]" style={{ animationDelay: "0.2s" }}>
          {t.downloads.title}
        </h1>

        <p className="animate-fade-in-up text-lg md:text-xl text-apple-gray-400 max-w-2xl mx-auto leading-relaxed mb-8" style={{ animationDelay: "0.35s" }}>
          {t.downloads.subtitle}
        </p>

        {/* Trust badges */}
        <div className="animate-fade-in-up flex flex-wrap justify-center gap-4 text-xs text-apple-gray-500 font-medium" style={{ animationDelay: "0.5s" }}>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            No Telemetry
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Lightweight
          </div>
          <div className="flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
            Open Source
          </div>
        </div>

        {loading && (
          <div className="mt-12 flex items-center justify-center gap-3 text-apple-blue font-semibold bg-apple-blue/10 px-6 py-3 rounded-full w-fit mx-auto border border-apple-blue/20">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>
            <span className="tracking-wide text-xs uppercase">{t.downloads.loading}</span>
          </div>
        )}
      </div>

      {/* ═══ ERROR ═══ */}
      {!loading && !latestRelease && (
        <div className="text-center p-12 rounded-3xl border border-red-500/15 max-w-lg mx-auto bg-red-500/[0.03] backdrop-blur-xl">
          <AlertCircle className="w-14 h-14 text-red-400/60 mx-auto mb-6" />
          <h3 className="text-2xl font-bold text-red-400 mb-3">{t.downloads.error}</h3>
          <p className="text-apple-gray-400 font-medium">Could not fetch release information from GitHub.</p>
        </div>
      )}

      {/* ═══ DOWNLOAD CARDS ═══ */}
      {!loading && latestRelease && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 animate-fade-in-up">
            {platforms.map((p, i) => {
              const hasAssets = p.assets.length > 0;
              return (
                <div
                  key={p.id}
                  className={`group relative rounded-2xl border border-white/[0.06] ${p.borderHover} bg-white/[0.02] hover:bg-white/[0.04] p-7 sm:p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  {/* Subtle glow on hover */}
                  <div className={`absolute inset-0 ${p.glow} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none`} />

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className={`p-4 rounded-xl bg-gradient-to-br ${p.iconBg} border border-white/[0.06] text-white shadow-lg`}>
                        {p.icon}
                      </div>
                      <div className="flex items-center gap-2">
                        {p.badge && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/25">
                            {p.badge}
                          </span>
                        )}
                        {hasAssets && (
                          <div className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-mono font-medium text-apple-gray-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            {latestRelease.tag_name}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title & desc */}
                    <h3 className="text-2xl font-display font-bold text-white mb-2 tracking-tight">{p.title}</h3>
                    <p className="text-sm text-apple-gray-400 mb-6 leading-relaxed font-medium">{p.description}</p>

                    {/* Warning */}
                    {p.warning && (
                      <div className="mb-5 p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/15 text-xs text-amber-300/80 font-medium leading-relaxed flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                        {p.warning}
                      </div>
                    )}

                    {/* Assets */}
                    <div className="space-y-2.5">
                      {hasAssets ? (
                        p.assets.map(asset => {
                          const ext = asset.name.split('.').pop()?.toUpperCase() || 'FILE';
                          return (
                            <a
                              key={asset.id}
                              href={asset.browser_download_url}
                              className="group/btn flex items-center justify-between w-full p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/[0.12] transition-all duration-300 active:scale-[0.98]"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`p-2.5 rounded-lg bg-gradient-to-br ${p.iconBg} text-white/70`}>
                                  <DownloadIcon className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-white">
                                    {t.downloads.installer_label.replace('{ext}', ext)} {ext}
                                  </span>
                                  <span className="text-xs text-apple-gray-500 font-mono">
                                    {formatSize(asset.size)}
                                  </span>
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-apple-gray-600 group-hover/btn:text-white group-hover/btn:translate-x-0.5 transition-all" />
                            </a>
                          );
                        })
                      ) : (
                        <div className="p-8 rounded-xl bg-white/[0.02] border border-dashed border-white/[0.08] text-center flex flex-col items-center gap-3">
                          <AlertCircle className="w-7 h-7 text-apple-gray-600" />
                          <p className="text-sm text-apple-gray-500 font-medium">{t.downloads.no_assets_platform}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ SOURCE CODE ═══ */}
      {!loading && latestRelease && (
        <div className="mt-20 md:mt-28 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
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
      )}
    </div>
  );
};

export default Download;