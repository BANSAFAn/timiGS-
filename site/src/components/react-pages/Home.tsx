import React, { useEffect, useState } from "react";
import { Download, Github, Star, Globe, Lock, Check, X, ArrowRight } from "lucide-react";
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

// Intersection Observer hook for scroll animations
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

// Animated Counter Component
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
function FeatureCard({ feature, index }: { feature: { badge: React.ReactNode; title: string; description: string; gradient: string }; index: number }) {
  const { ref, visible } = useInView(0.15);
  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 transition-all duration-700 hover:border-white/[0.12] hover:bg-white/[0.05] hover:shadow-2xl hover:-translate-y-2 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none"
        style={{ background: `radial-gradient(500px circle at 50% 50%, ${feature.gradient}, transparent 40%)` }} />
      <div className="relative z-10">
        <div className="text-apple-blue-400 mb-6 transform group-hover:scale-110 transition-transform duration-500">{feature.badge}</div>
        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-all duration-300">{feature.title}</h3>
        <p className="text-apple-gray-400 leading-relaxed">{feature.description}</p>
      </div>
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
    { badge: <PrivacyIcon />, title: t.whyTimiGS.features.privacy.title, description: t.whyTimiGS.features.privacy.description, gradient: "rgba(139,92,246,0.15)" },
    { badge: <FocusIcon />, title: t.whyTimiGS.features.focus.title, description: t.whyTimiGS.features.focus.description, gradient: "rgba(244,63,94,0.15)" },
    { badge: <BreakIcon />, title: t.whyTimiGS.features.timeout.title, description: t.whyTimiGS.features.timeout.description, gradient: "rgba(245,158,11,0.15)" },
    { badge: <AnalyticsIcon />, title: t.whyTimiGS.features.analytics.title, description: t.whyTimiGS.features.analytics.description, gradient: "rgba(59,130,246,0.15)" },
    { badge: <CrossPlatformIcon />, title: t.whyTimiGS.features.crossplatform.title, description: t.whyTimiGS.features.crossplatform.description, gradient: "rgba(14,165,233,0.15)" },
    { badge: <OpenSourceIcon />, title: t.whyTimiGS.features.opensource.title, description: t.whyTimiGS.features.opensource.description, gradient: "rgba(168,85,247,0.15)" },
  ];

  const featureSections = [
    { icon: <TrackingIcon />, title: t.features.sections.tracking.title, description: t.features.sections.tracking.description, highlights: t.features.sections.tracking.highlights, gradient: "from-indigo-500/20 to-purple-500/20" },
    { icon: <TimelineIcon />, title: t.features.sections.timeline.title, description: t.features.sections.timeline.description, highlights: t.features.sections.timeline.highlights, gradient: "from-purple-500/20 to-pink-500/20" },
    { icon: <FocusIcon />, title: t.features.sections.focus.title, description: t.features.sections.focus.description, highlights: t.features.sections.focus.highlights, gradient: "from-rose-500/20 to-orange-500/20" },
    { icon: <WeatherIcon />, title: t.features.sections.weather.title, description: t.features.sections.weather.description, highlights: t.features.sections.weather.highlights, gradient: "from-sky-500/20 to-cyan-500/20" },
  ];

  const comparison = [
    { feature: t.comparison.features.free, timigs: true, rescuetime: false, toggl: "partial", wakatime: "partial" },
    { feature: t.comparison.features.opensource, timigs: true, rescuetime: false, toggl: false, wakatime: false },
    { feature: t.comparison.features.focus, timigs: true, rescuetime: false, toggl: false, wakatime: false },
    { feature: t.comparison.features.local, timigs: true, rescuetime: false, toggl: false, wakatime: false },
    { feature: t.comparison.features.telemetry, timigs: true, rescuetime: false, toggl: false, wakatime: false },
    { feature: t.comparison.features.desktop, timigs: true, rescuetime: true, toggl: true, wakatime: true },
    { feature: t.comparison.features.android, timigs: "alpha", rescuetime: true, toggl: true, wakatime: false },
    { feature: t.comparison.features.breaks, timigs: true, rescuetime: false, toggl: false, wakatime: false },
    { feature: t.comparison.features.weather, timigs: true, rescuetime: false, toggl: false, wakatime: false },
  ];

  const getLabel = (value: boolean | string) => {
    if (value === true) return <Check className="w-5 h-5 text-emerald-400" />;
    if (value === false) return <X className="w-5 h-5 text-red-400/50" />;
    return <span className="text-xs font-semibold text-amber-400">{t.comparison.labels[value as keyof typeof t.comparison.labels]}</span>;
  };

  return (
    <div className="space-y-32">
      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative pt-16 md:pt-32 pb-20 md:pb-32 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-apple-blue/10 rounded-full blur-[150px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[140px] animate-pulse-slow" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-[30%] left-[50%] w-[400px] h-[400px] bg-pink-500/8 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: "3s" }} />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute w-1 h-1 bg-white/20 rounded-full animate-float-particle"
              style={{ left: `${10 + i * 12}%`, top: `${15 + (i % 4) * 20}%`, animationDelay: `${i * 0.6}s`, animationDuration: `${5 + i * 0.3}s` }} />
          ))}
        </div>

        <div className="relative z-10">
          {/* Badge */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="group inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm text-sm font-semibold text-apple-gray-300 mb-10 hover:border-white/[0.15] hover:bg-white/[0.06] transition-all duration-300">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              <span>{t.hero.badge}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">{t.hero.badge_new}</span>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
            <span className="block text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-display font-bold tracking-tight text-white leading-[1.05] mb-3">{t.hero.tagline1}</span>
            <span className="block text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-display font-bold tracking-tight leading-[1.05]">
              <span className="text-transparent bg-clip-text bg-[length:200%_auto] animate-text-shimmer bg-gradient-to-r from-apple-blue via-purple-400 to-apple-blue">{t.hero.tagline2}</span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in-up text-lg sm:text-xl md:text-2xl text-apple-gray-400 font-medium max-w-3xl mt-10 mb-14 leading-relaxed" style={{ animationDelay: "0.4s" }}>
            {t.hero.subtext}
          </p>

          {/* CTAs */}
          <div className="animate-fade-in-up flex flex-col sm:flex-row items-center gap-4 sm:gap-5 mt-8" style={{ animationDelay: "0.55s" }}>
            <a href={`/${lang}/download`} className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-white via-white to-white text-black font-semibold text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] flex items-center justify-center gap-3 overflow-hidden min-w-[200px]">
              <div className="absolute inset-0 bg-gradient-to-r from-apple-blue via-purple-500 to-apple-blue opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
              <Download className="w-5 h-5 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
              <span className="relative">{t.hero.cta_download}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-all duration-300" />
            </a>
            <a href="https://github.com/BANSAFAn/timiGS-" target="_blank" rel="noopener noreferrer" className="group px-8 py-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white font-semibold text-base hover:bg-white/[0.06] hover:border-white/[0.15] transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm min-w-[200px] hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)]">
              <Github className="w-5 h-5 group-hover:rotate-6 transition-all duration-300" />
              {t.hero.cta_github}
            </a>
          </div>

          {/* Stats */}
          <div className="animate-fade-in-up flex flex-wrap gap-10 mt-20 pt-10 border-t border-white/5" style={{ animationDelay: "0.7s" }}>
            {[
              { label: t.hero.stats_downloads, value: ghStats.downloads, suffix: "+", icon: Download },
              { label: t.hero.stats_stars, value: ghStats.stars, suffix: "", icon: Star },
              { label: t.hero.stats_platforms, value: 4, suffix: "", icon: Globe },
              { label: t.hero.stats_privacy, value: 0, suffix: "", display: "Zero", icon: Lock },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="group text-left px-2 py-2 rounded-xl hover:bg-white/[0.03] transition-all duration-300">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    {isLoadingStats ? (<div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />) : (
                      <>
                        <Icon className="w-4 h-4 text-apple-gray-500 group-hover:text-apple-blue transition-colors" />
                        <div className="text-3xl font-bold text-white group-hover:scale-105 transition-transform">
                          {stat.display || <Counter end={stat.value} suffix={stat.suffix} />}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="text-sm text-apple-gray-500 group-hover:text-apple-gray-400 transition-colors">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ WHY TIMIGS SECTION ═══════════ */}
      <section className="relative py-20 md:py-28">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] left-[5%] w-[300px] h-[300px] bg-apple-blue/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[20%] right-[5%] w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-5">{t.whyTimiGS.title}</h2>
            <p className="text-lg md:text-xl text-apple-gray-400 max-w-3xl mx-auto">{t.whyTimiGS.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {whyFeatures.map((feature, index) => <FeatureCard key={index} feature={feature} index={index} />)}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES SECTION ═══════════ */}
      <section className="relative py-20 md:py-28 bg-white/[0.02] rounded-[3rem] border border-white/[0.05]">
        <div className="px-6 md:px-12">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-5">{t.features.title}</h2>
            <p className="text-lg md:text-xl text-apple-gray-400 max-w-3xl mx-auto">{t.features.subtitle}</p>
          </div>
          <div className="space-y-6">
            {featureSections.map((section, index) => {
              const { ref, visible } = useInView(0.15);
              return (
                <div key={index} ref={ref} className={`group relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-r ${section.gradient} p-8 md:p-10 transition-all duration-700 hover:border-white/[0.12] hover:shadow-2xl ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ transitionDelay: `${index * 100}ms` }}>
                  <div className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
                    <div className="text-white transform group-hover:scale-110 transition-transform duration-500">{section.icon}</div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">{section.title}</h3>
                      <p className="text-apple-gray-400 text-base md:text-lg mb-5 leading-relaxed">{section.description}</p>
                      <div className="flex flex-wrap gap-3">
                        {section.highlights.map((highlight, i) => (
                          <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.08] border border-white/[0.1] text-sm text-apple-gray-300 backdrop-blur-sm">
                            <Check className="w-4 h-4 text-emerald-400" />{highlight}
                          </span>
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

      {/* ═══════════ ANIMATIONS SECTION ═══════════ */}
      <section className="relative py-20 md:py-28">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-5">{t.animations.title}</h2>
          <p className="text-lg md:text-xl text-apple-gray-400 max-w-3xl mx-auto">{t.animations.subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[t.animations.cards.live, t.animations.cards.transitions, t.animations.cards.visual].map((card, index) => {
            const { ref, visible } = useInView(0.2);
            return (
              <div key={index} ref={ref} className={`group relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] p-10 text-center transition-all duration-700 hover:border-white/[0.12] hover:bg-white/[0.05] hover:-translate-y-2 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{ transitionDelay: `${index * 150}ms` }}>
                <div className="h-32 mb-8 flex items-center justify-center">
                  {index === 0 && (
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-apple-blue to-purple-500 animate-bounce-slow" />
                      <div className="absolute inset-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-apple-blue to-purple-500 blur-xl opacity-50 animate-pulse" />
                    </div>
                  )}
                  {index === 1 && (
                    <div className="flex gap-2 items-end h-20">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-4 bg-gradient-to-t from-apple-blue to-purple-500 rounded-full animate-wave" style={{ height: `${40 + i * 15}%`, animationDelay: `${i * 0.1}s` }} />
                      ))}
                    </div>
                  )}
                  {index === 2 && (
                    <div className="relative w-20 h-20">
                      <div className="absolute inset-0 rounded-full border-2 border-apple-blue/50 animate-ripple" style={{ animationDelay: "0s" }} />
                      <div className="absolute inset-0 rounded-full border-2 border-purple-500/50 animate-ripple" style={{ animationDelay: "0.3s" }} />
                      <div className="absolute inset-0 rounded-full border-2 border-pink-500/50 animate-ripple" style={{ animationDelay: "0.6s" }} />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
                <p className="text-apple-gray-400">{card.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════ COMPARISON SECTION ═══════════ */}
      <section className="relative py-20 md:py-28 bg-white/[0.02] rounded-[3rem] border border-white/[0.05]">
        <div className="px-6 md:px-12">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-5">{t.comparison.title}</h2>
            <p className="text-lg md:text-xl text-apple-gray-400 max-w-3xl mx-auto">{t.comparison.subtitle}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-white/[0.08]">
                  <th className="text-left py-5 px-4 text-apple-gray-400 font-medium">{t.comparison.features.free.split(" ")[0]}</th>
                  {[t.comparison.products.timigs, t.comparison.products.rescuetime, t.comparison.products.toggl, t.comparison.products.wakatime].map((name, i) => (
                    <th key={i} className={`text-center py-5 px-4 font-bold ${i === 0 ? "text-2xl text-white" : "text-apple-gray-500"}`}>{name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((row, index) => (
                  <tr key={index} className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${index % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                    <td className="py-5 px-4 text-apple-gray-300">{row.feature}</td>
                    <td className="text-center py-5 px-4">{getLabel(row.timigs)}</td>
                    <td className="text-center py-5 px-4">{getLabel(row.rescuetime)}</td>
                    <td className="text-center py-5 px-4">{getLabel(row.toggl)}</td>
                    <td className="text-center py-5 px-4">{getLabel(row.wakatime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═══════════ CTA SECTION ═══════════ */}
      <section className="relative py-24 md:py-32 overflow-hidden rounded-[3rem] border border-white/[0.08]">
        <div className="absolute inset-0 bg-gradient-to-br from-apple-blue/10 via-purple-500/10 to-pink-500/10" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-apple-blue/15 rounded-full blur-[150px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/15 rounded-full blur-[150px]" />
        </div>
        <div className="relative z-10 text-center px-6">
          <h2 className="animate-fade-in-up text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6">{t.cta.title}</h2>
          <p className="animate-fade-in-up text-lg md:text-xl text-apple-gray-400 max-w-2xl mx-auto mb-12" style={{ animationDelay: "0.15s" }}>{t.cta.subtitle}</p>
          <div className="animate-fade-in-up flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5" style={{ animationDelay: "0.3s" }}>
            <a href={`/${lang}/download`} className="group relative px-10 py-4.5 rounded-xl bg-gradient-to-r from-white via-white to-white text-black font-semibold text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] flex items-center justify-center gap-3 overflow-hidden min-w-[220px]">
              <div className="absolute inset-0 bg-gradient-to-r from-apple-blue via-purple-500 to-apple-blue opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
              <Download className="w-6 h-6 group-hover:rotate-12 transition-all duration-300" />
              {t.cta.primary}
            </a>
            <a href="https://github.com/BANSAFAn/timiGS-" target="_blank" rel="noopener noreferrer" className="group px-10 py-4.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-white font-semibold text-lg hover:bg-white/[0.06] hover:border-white/[0.15] transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm min-w-[220px] hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)]">
              <Github className="w-6 h-6 group-hover:rotate-6 transition-all duration-300" />
              {t.cta.secondary}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
