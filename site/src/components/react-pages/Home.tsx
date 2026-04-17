import React, { useEffect, useState } from "react";
import { DownloadSimple as Download, GithubLogo as Github, Star, GlobeHemisphereWest as Globe, LockKey as Lock, Check, X, ArrowRight, Cpu, HardDrives, Scan, Fingerprint, Pulse } from '@phosphor-icons/react';
import { Language } from "../../i18n/types";
import type { Translation } from "../../i18n/types";
import {
  PrivacyIcon,
  FocusIcon,
  BreakIcon,
  AnalyticsIcon,
  CrossPlatformIcon,
  OpenSourceIcon,
  TrackingIcon,
  TimelineIcon,
  WeatherIcon,
  WarningIcon,
} from "../icons/FeatureIcons";

interface HomeProps {
  lang: Language;
  t: Translation;
}

// Intersection Observer
function useInView(threshold = 0.1) {
  const ref = React.useRef<HTMLDivElement>(null);
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

// Animated Counter
function Counter({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useInView();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [visible, end, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// Feature Card Component
function FeatureCard({ feature, index }: { feature: { badge: React.ReactNode; title: string; description: string; color: string }; index: number }) {
  const { ref, visible } = useInView(0.15);
  return (
    <div
      ref={ref}
      className={`group cyber-card p-8 min-h-[220px] flex flex-col justify-between ${visible ? "animate-fade-in-up" : "opacity-0"}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="corner-brackets absolute inset-0 pointer-events-none" />
      <div className="absolute top-0 right-0 p-4 opacity-10 blur-[2px] pointer-events-none">
         <span className="font-mono text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-transparent">
            {(index + 1).toString().padStart(2, '0')}
         </span>
      </div>
      
      <div>
        <div className={`w-12 h-12 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_15px_rgba(255,255,255,0.02)]`} style={{ color: feature.color }}>
           {feature.badge}
        </div>
        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyber-cyan transition-colors">{feature.title}</h3>
      </div>
      <p className="text-sm font-mono text-gray-400 leading-relaxed font-medium">{feature.description}</p>
    </div>
  );
}

// Home Component
const Home: React.FC<HomeProps> = ({ lang, t }) => {
  const [ghStats, setGhStats] = useState({ stars: 0, downloads: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const repoRes = await fetch('https://api.github.com/repos/BANSAFAn/timiGS-');
        const repoData = await repoRes.json();
        const stars = repoData.stargazers_count || 0;
        const releasesRes = await fetch('https://api.github.com/repos/BANSAFAn/timiGS-/releases?per_page=100');
        const releasesData = await releasesRes.json();
        let downloads = 0;
        if (Array.isArray(releasesData)) {
          for (const release of releasesData) {
            for (const asset of release.assets || []) {
              downloads += asset.download_count || 0;
            }
          }
        }
        setGhStats({ stars, downloads });
      } catch { /* keep defaults */ } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const whyFeatures = [
    { badge: <PrivacyIcon className="w-6 h-6" />, title: t.whyTimiGS.features.privacy.title, description: t.whyTimiGS.features.privacy.description, color: "var(--cyber-green)" },
    { badge: <FocusIcon className="w-6 h-6" />, title: t.whyTimiGS.features.focus.title, description: t.whyTimiGS.features.focus.description, color: "var(--cyber-cyan)" },
    { badge: <BreakIcon className="w-6 h-6" />, title: t.whyTimiGS.features.timeout.title, description: t.whyTimiGS.features.timeout.description, color: "var(--cyber-amber)" },
    { badge: <AnalyticsIcon className="w-6 h-6" />, title: t.whyTimiGS.features.analytics.title, description: t.whyTimiGS.features.analytics.description, color: "var(--cyber-blue)" },
    { badge: <CrossPlatformIcon className="w-6 h-6" />, title: t.whyTimiGS.features.crossplatform.title, description: t.whyTimiGS.features.crossplatform.description, color: "var(--cyber-pink)" },
    { badge: <OpenSourceIcon className="w-6 h-6" />, title: t.whyTimiGS.features.opensource.title, description: t.whyTimiGS.features.opensource.description, color: "var(--cyber-purple)" },
  ];

  const featureSections = [
    { icon: <TrackingIcon className="w-6 h-6" />, title: t.features.sections.tracking.title, description: t.features.sections.tracking.description, highlights: t.features.sections.tracking.highlights, color: "var(--cyber-cyan)" },
    { icon: <TimelineIcon className="w-6 h-6" />, title: t.features.sections.timeline.title, description: t.features.sections.timeline.description, highlights: t.features.sections.timeline.highlights, color: "var(--cyber-purple)" },
    { icon: <FocusIcon className="w-6 h-6" />, title: t.features.sections.focus.title, description: t.features.sections.focus.description, highlights: t.features.sections.focus.highlights, color: "var(--cyber-pink)" },
    { icon: <WeatherIcon className="w-6 h-6" />, title: t.features.sections.weather.title, description: t.features.sections.weather.description, highlights: t.features.sections.weather.highlights, color: "var(--cyber-blue)" },
  ];

  const comparison = [
    { feature: t.comparison.features.free, timigs: true, rescuetime: false, toggl: "partial", wakatime: "partial" },
    { feature: t.comparison.features.opensource, timigs: true, rescuetime: false, toggl: false, wakatime: false },
    { feature: t.comparison.features.focus, timigs: true, rescuetime: false, toggl: false, wakatime: false },
    { feature: t.comparison.features.local, timigs: true, rescuetime: false, toggl: false, wakatime: false },
    { feature: t.comparison.features.telemetry, timigs: true, rescuetime: false, toggl: false, wakatime: false },
    { feature: t.comparison.features.desktop, timigs: true, rescuetime: true, toggl: true, wakatime: true },
    { feature: t.comparison.features.breaks, timigs: true, rescuetime: false, toggl: false, wakatime: false },
    { feature: t.comparison.features.weather, timigs: true, rescuetime: false, toggl: false, wakatime: false },
  ];

  const getLabel = (value: boolean | string) => {
    if (value === true) return <Check className="w-5 h-5 text-cyber-green mx-auto" />;
    if (value === false) return <X className="w-5 h-5 text-cyber-red mx-auto opacity-50" />;
    return <span className="text-[10px] font-mono font-bold text-cyber-amber px-2 py-1 bg-cyber-amber/10 rounded border border-cyber-amber/20">{t.comparison.labels[value as keyof typeof t.comparison.labels]}</span>;
  };

  return (
    <div className="space-y-32 md:space-y-48">
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative pt-16 md:pt-32 pb-10 min-h-[90vh] flex flex-col justify-center">
        {/* Decorative Lines */}
        <div className="absolute top-0 right-10 w-[1px] h-full bg-gradient-to-b from-transparent via-[rgba(6,245,214,0.15)] to-transparent pointer-events-none hidden md:block" />
        <div className="absolute top-1/2 right-10 w-4 h-[2px] bg-cyber-cyan shadow-[0_0_10px_rgba(6,245,214,0.8)] hidden md:block" />
        
        <div className="absolute bottom-10 left-0 right-0 flex justify-between px-8 pointer-events-none opacity-30 hud-label text-[8px] hidden sm:flex">
          <span>LAT: 47.6062</span>
          <span>LONG: -122.3321</span>
          <span>SYS.TRACKER_ACTIVE</span>
        </div>

        <div className="relative z-10 w-full max-w-5xl mx-auto">
          {/* Badge */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-sm border-l-2 border-cyber-cyan bg-[rgba(6,245,214,0.05)] text-[10px] font-mono font-bold tracking-[2px] text-cyber-cyan mb-8 uppercase backdrop-blur-md">
              <span className="w-1.5 h-1.5 bg-cyber-cyan shadow-[0_0_5px_rgba(6,245,214,1)] animate-pulse" />
              {t.hero.badge} // {t.hero.badge_new}
            </div>
          </div>

          {/* Heading */}
          <h1 className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <span className="block text-5xl sm:text-6xl md:text-8xl lg:text-[100px] font-display font-black tracking-tight text-white leading-[1.05] mb-2 uppercase">
              {t.hero.tagline1}
            </span>
            <span className="block text-5xl sm:text-6xl md:text-8xl lg:text-[100px] font-display font-black tracking-tight leading-[1.05] uppercase">
              <span className="gradient-text">{t.hero.tagline2}</span>
            </span>
          </h1>

          <p className="animate-fade-in-up text-base md:text-lg text-gray-400 font-mono max-w-2xl mt-8 mb-12 leading-relaxed border-l-[3px] border-[rgba(255,255,255,0.1)] pl-5" style={{ animationDelay: "0.35s" }}>
            {t.hero.subtext}
          </p>

          {/* CTAs */}
          <div className="animate-fade-in-up flex flex-col sm:flex-row items-center gap-5" style={{ animationDelay: "0.5s" }}>
            <a href={`/${lang}/download`} className="cyber-btn-primary w-full sm:w-auto h-[54px] justify-center">
              <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
              <span className="tracking-widest">{t.hero.cta_download}</span>
              <Scan className="w-4 h-4 ml-2 opacity-50" />
            </a>
            <a href="https://github.com/BANSAFAn/timiGS-" target="_blank" rel="noopener noreferrer" className="cyber-btn-ghost w-full sm:w-auto h-[54px] justify-center">
              <Github className="w-5 h-5" />
              <span className="font-mono tracking-widest text-[13px] uppercase">{t.hero.cta_github}</span>
            </a>
          </div>

          {/* HUD Stats Row */}
          <div className="animate-fade-in-up grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 pt-8 border-t border-[rgba(255,255,255,0.05)] relative" style={{ animationDelay: "0.65s" }}>
            {/* Minimal top border accent */}
            <div className="absolute top-[-1px] left-0 w-20 h-[2px] bg-cyber-purple shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
            
            {[
              { label: t.hero.stats_downloads, value: ghStats.downloads, suffix: "+", icon: Download, color: "text-cyber-cyan" },
              { label: t.hero.stats_stars, value: ghStats.stars, suffix: "", icon: Star, color: "text-cyber-purple" },
              { label: t.hero.stats_platforms, value: 4, suffix: "", icon: Cpu, color: "text-cyber-blue" },
              { label: t.hero.stats_privacy, value: 0, suffix: "", display: "100%", icon: Fingerprint, color: "text-cyber-green" },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="flex flex-col p-4 rounded bg-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.03)] transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                    <span className="hud-label text-[9px]">{stat.label}</span>
                  </div>
                  {isLoadingStats ? (
                     <div className="h-8 w-16 bg-[rgba(255,255,255,0.05)] rounded animate-pulse" />
                  ) : (
                     <div className="text-3xl font-display font-bold text-white tracking-tight">
                       {stat.display || <Counter end={stat.value} suffix={stat.suffix} />}
                     </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ CORE SUBSYSTEMS ═══════════ */}
      <section className="relative">
        <div className="text-center mb-16 px-4">
          <div className="hud-label mb-4 text-cyber-purple flex justify-center items-center gap-2">
             <Pulse className="w-4 h-4" /> [SYS.CORE_MODULES]
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-white uppercase tracking-tight">{t.whyTimiGS.title}</h2>
          <p className="mt-4 text-sm font-mono text-gray-400 max-w-2xl mx-auto">{t.whyTimiGS.subtitle}</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {whyFeatures.map((feature, index) => <FeatureCard key={index} feature={feature} index={index} />)}
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section className="relative py-24 cyber-card rounded-none border-x-0 !border-y border-cyber-border bg-[rgba(6,6,9,0.5)]">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none" />
        <div className="scan-line" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
             <div>
                <div className="hud-label mb-4 text-cyber-cyan flex items-center gap-2">
                  <HardDrives className="w-4 h-4" /> [SYS.CAPABILITIES]
                </div>
                <h2 className="text-4xl md:text-6xl font-display font-black text-white uppercase tracking-tight max-w-2xl">{t.features.title}</h2>
             </div>
             <p className="text-sm font-mono text-gray-400 text-left md:text-right max-w-md">{t.features.subtitle}</p>
          </div>

          <div className="space-y-4">
            {featureSections.map((section, index) => {
              const { ref, visible } = useInView(0.15);
              return (
                <div 
                  key={index} 
                  ref={ref} 
                  className={`group relative p-8 md:p-10 border-l-[3px] border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(255,255,255,0.03)] hover:border-white transition-all duration-500 overflow-hidden ${visible ? "animate-slide-in-right" : "opacity-0"}`} 
                  style={{ borderLeftColor: section.color, animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 hud-label text-[100px] leading-none pointer-events-none select-none">
                     {index + 1}
                  </div>
                  
                  <div className="grid md:grid-cols-[200px_1fr] gap-8 items-start relative z-10">
                    <div className="flex flex-col gap-4">
                       <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] shadow-lg" style={{ color: section.color }}>
                          {section.icon}
                       </div>
                       <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight">{section.title}</h3>
                    </div>
                    
                    <div>
                      <p className="text-sm font-mono text-gray-400 mb-8 leading-relaxed max-w-3xl border-l border-[rgba(255,255,255,0.1)] pl-4">{section.description}</p>
                      <div className="flex flex-wrap gap-3">
                        {section.highlights.map((highlight, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.05)] text-xs font-mono text-gray-300">
                            <div className="w-1 h-1 rounded-full animate-pulse" style={{ background: section.color }} />
                            {highlight}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ COMPARISON ═══════════ */}
      <section className="relative px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="hud-label mb-4 text-cyber-blue flex justify-center items-center gap-2">
             <Pulse className="w-4 h-4" /> [SYS.BENCHMARK]
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-black text-white uppercase tracking-tight mb-4">{t.comparison.title}</h2>
          <p className="text-sm font-mono text-gray-400 max-w-2xl mx-auto">{t.comparison.subtitle}</p>
        </div>
        
        <div className="w-full overflow-hidden rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(10,10,18,0.6)] backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.1)]">
                  <th className="text-left py-6 px-6 font-mono text-xs text-gray-500 uppercase tracking-widest">{t.comparison.features.free.split(" ")[0]}</th>
                  {[t.comparison.products.timigs, t.comparison.products.rescuetime, t.comparison.products.toggl, t.comparison.products.wakatime].map((name, i) => (
                    <th key={i} className={`text-center py-6 px-6 font-display font-black uppercase tracking-widest ${i === 0 ? "text-xl text-cyber-cyan border-b-2 border-cyber-cyan" : "text-base text-gray-500"}`}>
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                {comparison.map((row, index) => (
                  <tr key={index} className="hover:bg-[rgba(255,255,255,0.01)] transition-colors">
                    <td className="py-5 px-6 font-mono text-gray-300 border-r border-[rgba(255,255,255,0.02)]">{row.feature}</td>
                    <td className="text-center py-5 px-6 bg-[rgba(6,245,214,0.02)] border-x border-[rgba(6,245,214,0.1)]">{getLabel(row.timigs)}</td>
                    <td className="text-center py-5 px-6 border-r border-[rgba(255,255,255,0.02)]">{getLabel(row.rescuetime)}</td>
                    <td className="text-center py-5 px-6 border-r border-[rgba(255,255,255,0.02)]">{getLabel(row.toggl)}</td>
                    <td className="text-center py-5 px-6">{getLabel(row.wakatime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="relative px-4 sm:px-6 md:px-8 max-w-6xl mx-auto pb-32">
        <div className="relative overflow-hidden rounded-3xl border border-cyber-cyan bg-[rgba(10,10,20,0.8)] p-12 md:p-20 text-center glass-panel shadow-[0_0_50px_rgba(6,245,214,0.1)]">
           <div className="absolute inset-0 bg-gradient-to-t from-[rgba(6,245,214,0.1)] to-transparent pointer-events-none" />
           <div className="corner-brackets absolute inset-0 pointer-events-none" />
           
           <div className="relative z-10">
             <div className="hud-label tracking-[3px] text-cyber-cyan animate-pulse mb-6">/// DEPLOYMENT_READY</div>
             <h2 className="animate-fade-in-up text-4xl md:text-5xl lg:text-6xl font-display font-black text-white uppercase tracking-tight mb-6">
                {t.cta.title}
             </h2>
             <p className="animate-fade-in-up text-sm md:text-base font-mono text-gray-400 max-w-2xl mx-auto mb-10 border-b border-[rgba(255,255,255,0.1)] pb-8" style={{ animationDelay: "0.1s" }}>
                {t.cta.subtitle}
             </p>
             
             <div className="animate-fade-in-up flex flex-col sm:flex-row items-center justify-center gap-5 focus:outline-none" style={{ animationDelay: "0.2s" }}>
               <a href={`/${lang}/download`} className="cyber-btn-primary h-[54px] w-full sm:w-auto justify-center px-10">
                 <Download className="w-5 h-5 -mt-0.5" />
                 <span className="font-mono tracking-widest text-[13px] uppercase">{t.cta.primary}</span>
               </a>
               <a href="https://github.com/BANSAFAn/timiGS-" target="_blank" rel="noopener noreferrer" className="cyber-btn-ghost h-[54px] w-full sm:w-auto justify-center px-8 border-[rgba(255,255,255,0.15)] bg-transparent">
                 <Github className="w-5 h-5 -mt-0.5" />
                 <span className="font-mono tracking-widest text-[13px] uppercase">{t.cta.secondary}</span>
               </a>
             </div>
           </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
