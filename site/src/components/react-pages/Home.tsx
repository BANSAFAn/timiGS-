import React, { useEffect, useRef, useState } from "react";
import {
  Clock,
  Download,
  ChevronRight,
  Sparkles,
  Globe2,
  Check,
  X as XIcon,
  Lock,
  Zap,
  ArrowRight,
  Star,
  Github,
} from "lucide-react";
import { Language } from "../../i18n/types";
import type { Translation } from "../../i18n/types";

interface HomeProps {
  lang: Language;
  t: Translation;
}

/* ── Modern Clock-Style SVG Icons ── */
const FocusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" opacity="0.3" />
    <circle cx="24" cy="24" r="20" stroke="url(#focusGradient)" strokeWidth="2" strokeDasharray="30 90" strokeLinecap="round" />
    <circle cx="24" cy="24" r="12" fill="currentColor" opacity="0.2" />
    <circle cx="24" cy="24" r="8" fill="currentColor" />
    <path d="M24 8v4M24 36v4M8 24h4M36 24h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <defs>
      <linearGradient id="focusGradient" x1="24" y1="4" x2="24" y2="44">
        <stop stopColor="#f43f5e" />
        <stop offset="1" stopColor="#ec4899" />
      </linearGradient>
    </defs>
  </svg>
);

const TimerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="26" r="18" stroke="currentColor" strokeWidth="2" opacity="0.3" />
    <circle cx="24" cy="26" r="18" stroke="url(#timerGradient)" strokeWidth="2" strokeDasharray="40 80" strokeLinecap="round" />
    <rect x="20" y="4" width="8" height="6" rx="2" fill="currentColor" opacity="0.6" />
    <circle cx="24" cy="4" r="2" fill="currentColor" />
    <path d="M24 26V16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M24 26L30 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    <circle cx="24" cy="26" r="2" fill="currentColor" />
    <defs>
      <linearGradient id="timerGradient" x1="24" y1="8" x2="24" y2="44">
        <stop stopColor="#f59e0b" />
        <stop offset="1" stopColor="#f97316" />
      </linearGradient>
    </defs>
  </svg>
);

const WeatherIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="2" opacity="0.3" />
    <circle cx="24" cy="24" r="14" stroke="url(#weatherGradient)" strokeWidth="2" strokeDasharray="35 85" strokeLinecap="round" />
    <path d="M24 6v3M24 39v3M6 24h3M39 24h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    <path d="M10.5 10.5l2 2M35.5 35.5l2 2M10.5 37.5l2-2M35.5 12.5l2-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    <circle cx="24" cy="24" r="8" fill="url(#weatherGradient)" opacity="0.3" />
    <circle cx="24" cy="24" r="5" fill="currentColor" />
    <defs>
      <linearGradient id="weatherGradient" x1="24" y1="10" x2="24" y2="38">
        <stop stopColor="#0ea5e9" />
        <stop offset="1" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
  </svg>
);

const PrivacyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <path d="M24 4L8 10v14c0 10 7.5 18 16 20 8.5-2 16-10 16-20V10L24 4z" stroke="currentColor" strokeWidth="2" opacity="0.3" />
    <path d="M24 4L8 10v14c0 10 7.5 18 16 20 8.5-2 16-10 16-20V10L24 4z" stroke="url(#privacyGradient)" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
    <rect x="18" y="20" width="12" height="10" rx="2" fill="currentColor" opacity="0.3" />
    <rect x="19" y="21" width="10" height="8" rx="1.5" fill="currentColor" />
    <path d="M20 21v-2a4 4 0 018 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <circle cx="24" cy="25" r="1.5" fill="#030712" />
    <defs>
      <linearGradient id="privacyGradient" x1="24" y1="4" x2="24" y2="44">
        <stop stopColor="#8b5cf6" />
        <stop offset="1" stopColor="#7c3aed" />
      </linearGradient>
    </defs>
  </svg>
);

const AnalyticsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" opacity="0.3" />
    <circle cx="24" cy="24" r="20" stroke="url(#analyticsGradient)" strokeWidth="2" strokeDasharray="45 75" strokeLinecap="round" />
    <rect x="14" y="26" width="5" height="10" rx="1" fill="currentColor" opacity="0.4" />
    <rect x="21.5" y="20" width="5" height="16" rx="1" fill="currentColor" opacity="0.7" />
    <rect x="29" y="16" width="5" height="20" rx="1" fill="url(#analyticsGradient)" />
    <circle cx="24" cy="24" r="3" fill="currentColor" />
    <defs>
      <linearGradient id="analyticsGradient" x1="24" y1="4" x2="24" y2="44">
        <stop stopColor="#3b82f6" />
        <stop offset="1" stopColor="#6366f1" />
      </linearGradient>
    </defs>
  </svg>
);

/* ── Platform SVG Icons ── */
const WindowsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 5.5L10.5 4.5V11.5H3V5.5ZM10.5 12.5V19.5L3 18.5V12.5H10.5ZM11.5 4.35L21 3V11.5H11.5V4.35ZM21 12.5V21L11.5 19.65V12.5H21Z" />
  </svg>
);

const MacOSIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5C17.33 21.59 15.97 23.49 13.5 23.5C11.06 23.51 10.25 22.01 7.6 22.01C4.97 22.01 4.08 23.47 1.66 23.5C-0.71 23.53-2.41 20.73 0.38 16.84C3.17 12.95 5.9 9.03 8.5 9.06C11.07 9.09 11.97 11.5 14.5 11.5C17.06 11.5 17.77 9.06 20.5 9.03C23.25 9 25.39 11.79 25.39 11.82C25.36 11.91 22.19 13.74 22.23 17.5C22.27 21.25 25.63 22.59 25.66 22.62C25.63 22.69 24.78 25.39 21.97 26.5C19.2 27.59 17.5 25.71 14.5 25.71C11.53 25.71 9.71 27.59 7.03 26.5C4.35 25.41 3.47 22.79 3.44 22.72C3.47 22.69 6.81 21.35 6.84 17.59C6.88 13.84 3.75 12.01 3.72 11.92C3.72 11.89 5.86 9.09 8.61 9.12C10.89 9.15 12.5 10.5 13.5 10.5C14.5 10.5 16.39 9.09 18.5 9.12C19.44 9.13 21.39 9.5 22.66 11.31C22.73 11.36 21.03 12.31 18.71 19.5ZM15.5 6.5C16.39 5.41 16.97 3.91 16.81 2.41C15.53 2.5 13.97 3.31 13.06 4.38C12.22 5.34 11.66 6.88 11.81 8.36C13.13 8.47 14.61 7.59 15.5 6.5Z" />
  </svg>
);

const LinuxIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C12.5 2 13 2.5 13 3.5C13 4.5 12.5 5 12 5C11.5 5 11 4.5 11 3.5C11 2.5 11.5 2 12 2ZM7 5C7.5 5 8 5.5 8 6.5C8 7.5 7.5 8 7 8C6.5 8 6 7.5 6 6.5C6 5.5 6.5 5 7 5ZM17 5C17.5 5 18 5.5 18 6.5C18 7.5 17.5 8 17 8C16.5 8 16 7.5 16 6.5C16 5.5 16.5 5 17 5ZM12 7C14.5 7 16.5 9 16.5 12C16.5 13.5 15.5 14.5 14.5 15C14.5 15 15 16 15 17C15 18 14 19 12 19C10 19 9 18 9 17C9 16 9.5 15 9.5 15C8.5 14.5 7.5 13.5 7.5 12C7.5 9 9.5 7 12 7Z" />
  </svg>
);

const AndroidIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.523 15.3414C17.523 16.7145 16.4103 17.8272 15.0372 17.8272C13.6641 17.8272 12.5514 16.7145 12.5514 15.3414C12.5514 13.9683 13.6641 12.8556 15.0372 12.8556C16.4103 12.8556 17.523 13.9683 17.523 15.3414ZM8.96283 12.8556C7.58974 12.8556 6.47705 13.9683 6.47705 15.3414C6.47705 16.7145 7.58974 17.8272 8.96283 17.8272C10.3359 17.8272 11.4486 16.7145 11.4486 15.3414C11.4486 13.9683 10.3359 12.8556 8.96283 12.8556ZM20.7128 10.2852L22.4253 7.31802C22.558 7.08785 22.4789 6.79339 22.2487 6.66068C22.0186 6.52798 21.7241 6.60708 21.5914 6.83725L19.8589 9.83988C18.2892 9.00802 16.4792 8.47705 14.5372 8.34138V5.5H17.2414C17.5103 5.5 17.7276 5.28276 17.7276 5.01379C17.7276 4.74483 17.5103 4.52759 17.2414 4.52759H14.5372V2.5C14.5372 2.23103 14.32 2.01379 14.051 2.01379C13.7821 2.01379 13.5648 2.23103 13.5648 2.5V4.52759H10.4352V2.5C10.4352 2.23103 10.2179 2.01379 9.94897 2.01379C9.68001 2.01379 9.46276 2.23103 9.46276 2.5V4.52759H6.75862C6.48966 4.52759 6.27241 4.74483 6.27241 5.01379C6.27241 5.28276 6.48966 5.5 6.75862 5.5H9.46276V8.34138C7.52075 8.47705 5.71075 9.00802 4.14108 9.83988L2.40862 6.83725C2.27592 6.60708 1.98145 6.52798 1.75128 6.66068C1.52112 6.79339 1.44203 7.08785 1.57473 7.31802L3.28724 10.2852C1.37608 12.069 0.165517 14.5924 0.165517 17.3966H24.8345C24.8345 14.5924 23.6239 12.069 21.7128 10.2852H20.7128Z" />
  </svg>
);

const ClockFace: React.FC<{ className?: string; animated?: boolean }> = ({ className, animated = false }) => (
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

/* ── Intersection Observer hook for scroll animations ── */
function useInView(threshold = 0.15) {
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

/* ── Animated counter with easing ── */
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

/* ── Modern Feature Card ── */
function FeatureCard({ feature, index }: { feature: { icon: React.ReactNode; title: string; desc: string; accent: string; glow: string; badge: string }; index: number }) {
  const { ref, visible } = useInView(0.1);

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 transition-all duration-700 hover:border-white/[0.12] hover:bg-white/[0.05] hover:shadow-2xl hover:-translate-y-1 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none"
        style={{ background: `radial-gradient(400px circle at 50% 50%, ${feature.glow}, transparent 40%)` }}
      />

      {/* Icon container */}
      <div className="relative mb-6">
        {/* Pulsing background */}
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.accent} blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 animate-pulse-slow`} />

        {/* Icon background */}
        <div className={`relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.accent} shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-500`}>
          <div className="w-10 h-10 text-white">
            {feature.icon}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 relative z-10">
        <h3 className="text-xl font-display font-bold text-white flex items-center gap-2.5">
          <span className="text-2xl">{feature.badge}</span>
          <span>{feature.title}</span>
        </h3>
        <p className="text-sm text-apple-gray-400 leading-relaxed">{feature.desc}</p>
      </div>

      {/* Bottom accent line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.accent} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out origin-left rounded-b-3xl`} />
    </div>
  );
}

const Home: React.FC<HomeProps> = ({ lang, t }) => {
  const features = [
    {
      icon: <FocusIcon className="w-full h-full" />,
      title: "Focus Mode",
      desc: "Lock yourself into productive work. Block app switching with a password-protected Focus Mode that keeps you on task.",
      accent: "from-rose-500 to-pink-600",
      glow: "rgba(244,63,94,0.2)",
      badge: "🎯",
    },
    {
      icon: <TimerIcon className="w-full h-full" />,
      title: "Time OUT",
      desc: "Smart break reminders that protect your health. Set custom intervals and get notified when it's time to rest.",
      accent: "from-amber-500 to-orange-600",
      glow: "rgba(245,158,11,0.2)",
      badge: "⏰",
    },
    {
      icon: <WeatherIcon className="w-full h-full" />,
      title: "Built-in Weather",
      desc: "Weather widget right in your tracker. Auto-detect location or set manually — plan your day without leaving the app.",
      accent: "from-sky-500 to-cyan-600",
      glow: "rgba(14,165,233,0.2)",
      badge: "🌦️",
    },
    {
      icon: <PrivacyIcon className="w-full h-full" />,
      title: "100% Privacy",
      desc: "All data stored locally in SQLite. Zero telemetry, zero cloud uploads. You own every byte of your data.",
      accent: "from-purple-500 to-violet-600",
      glow: "rgba(139,92,246,0.2)",
      badge: "🔒",
    },
    {
      icon: <AnalyticsIcon className="w-full h-full" />,
      title: "Rich Analytics",
      desc: "Beautiful Donut, Pie, and Bar charts. Day-by-day timeline view. Understand exactly where your time goes.",
      accent: "from-blue-500 to-indigo-600",
      glow: "rgba(59,130,246,0.2)",
      badge: "📊",
    },
  ];

  const comparison = [
    { feature: "Free Forever", timigs: true, rescue: false, toggl: "partial", waka: "partial" },
    { feature: "Open Source", timigs: true, rescue: false, toggl: false, waka: false },
    { feature: "Focus Mode", timigs: true, rescue: false, toggl: false, waka: false },
    { feature: "Local Data", timigs: true, rescue: false, toggl: false, waka: false },
    { feature: "No Telemetry", timigs: true, rescue: false, toggl: false, waka: false },
    { feature: "Desktop App", timigs: true, rescue: true, toggl: true, waka: true },
    { feature: "Android", timigs: "alpha", rescue: true, toggl: true, waka: false },
    { feature: "Break Reminders", timigs: true, rescue: false, toggl: false, waka: false },
    { feature: "Weather Widget", timigs: true, rescue: false, toggl: false, waka: false },
    { feature: "Cloud Sync", timigs: true, rescue: false, toggl: false, waka: false },
  ];

  const s1 = useInView();
  const s2 = useInView();
  const s3 = useInView();
  const s4 = useInView();
  const s5 = useInView();

  /* ── Fetch real GitHub stats ── */
  const [ghStats, setGhStats] = useState({ stars: 0, downloads: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch stars
        const repoRes = await fetch('https://api.github.com/repos/BANSAFAn/timiGS-');
        const repoData = await repoRes.json();
        const stars = repoData.stargazers_count || 0;

        // Fetch total downloads (sum of all release asset download_count)
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
      } catch {
        // keep defaults
      } finally {
        setIsLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-24 md:space-y-36">

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative pt-12 md:pt-24 pb-16 md:pb-28 overflow-hidden">
        {/* Animated clock background with parallax */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.02] pointer-events-none parallax-bg" data-speed="0.5">
          <ClockFace className="w-full h-full text-white animate-clock-rotate" animated />
        </div>

        {/* Ambient glow blobs with animation */}
        <div className="absolute top-[-120px] left-[10%] w-[600px] h-[600px] bg-apple-blue/15 rounded-full blur-[180px] animate-glow-pulse pointer-events-none" />
        <div className="absolute bottom-[-80px] right-[5%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[160px] animate-glow-pulse pointer-events-none" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-[20%] right-[15%] w-[400px] h-[400px] bg-pink-500/8 rounded-full blur-[140px] animate-glow-pulse pointer-events-none" style={{ animationDelay: "3s" }} />

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-float-particle"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${4 + i * 0.5}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          {/* Badge with shine effect */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="group inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm text-xs font-semibold text-apple-gray-300 tracking-wide mb-8 hover:border-white/[0.15] hover:bg-white/[0.06] transition-all duration-300 cursor-default overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer-sweep opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="flex h-2 w-2 relative z-10">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="relative z-10">Open Source • Free Forever</span>
              <span className="relative z-10 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 group-hover:scale-110 transition-transform">v2</span>
            </div>
          </div>

          {/* Main heading with stagger animation */}
          <h1 className="animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
            <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight text-white leading-[1.05] mb-2 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-white hover:via-apple-blue hover:to-white hover:bg-[length:200%_auto] transition-all duration-700">
              Track Time.
            </span>
            <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight leading-[1.05]">
              <span className="text-transparent bg-clip-text bg-[length:200%_auto] animate-text-shimmer bg-gradient-to-r from-apple-blue via-purple-400 to-apple-blue">
                Master Focus.
              </span>
            </span>
          </h1>

          {/* Subtitle with glow */}
          <p className="animate-fade-in-up text-lg sm:text-xl md:text-2xl text-apple-gray-400 font-medium max-w-2xl mt-8 mb-12 leading-relaxed relative" style={{ animationDelay: "0.4s" }}>
            <span className="relative z-10">{t.hero.subtext}</span>
            <span className="absolute inset-0 bg-apple-blue/5 blur-2xl -z-10 opacity-0 hover:opacity-100 transition-opacity duration-500" />
          </p>

          {/* CTAs with stagger and hover effects */}
          <div className="animate-fade-in-up flex flex-col sm:flex-row items-start gap-4" style={{ animationDelay: "0.55s" }}>
            <a
              href={`/${lang}/download`}
              className="group relative px-8 py-4 rounded-2xl bg-white text-black font-semibold text-base transition-all duration-500 hover:scale-[1.05] active:scale-[0.95] shadow-2xl shadow-white/10 hover:shadow-white/30 hover:shadow-apple-blue/20 flex items-center gap-2.5 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-apple-blue/20 via-purple-500/20 to-apple-blue/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-x" />
              <Download className="w-5 h-5 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 relative z-10" />
              <span className="relative z-10">{t.hero.cta_download}</span>
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 relative z-10" />
            </a>
            <a
              href="https://github.com/BANSAFAn/timiGS-"
              target="_blank"
              rel="noopener noreferrer"
              className="group px-8 py-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white font-semibold text-base hover:bg-white/[0.08] hover:border-white/[0.15] hover:border-apple-blue/30 transition-all duration-500 flex items-center gap-2.5 backdrop-blur-sm hover:shadow-lg hover:shadow-apple-blue/10"
            >
              <Github className="w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:rotate-6 transition-all duration-300" />
              {t.hero.cta_github}
            </a>
          </div>

          {/* Stats row with individual animations */}
          <div className="animate-fade-in-up flex flex-wrap gap-8 mt-16 pt-8 border-t border-white/5" style={{ animationDelay: "0.7s" }}>
            {[
              { label: "Downloads", value: ghStats.downloads, suffix: "+", icon: Download },
              { label: "GitHub Stars", value: ghStats.stars, suffix: "", icon: Star },
              { label: "Platforms", value: 4, suffix: "", icon: Globe2 },
              { label: "Data Collected", value: 0, suffix: "", display: "Zero", icon: Lock },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={i} 
                  className="group text-center sm:text-left px-4 py-3 rounded-xl hover:bg-white/[0.03] transition-all duration-300 hover:scale-105 cursor-default"
                  style={{ animationDelay: `${0.7 + i * 0.1}s` }}
                >
                  <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                    {isLoadingStats ? (
                      <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
                    ) : (
                      <>
                        <Icon className="w-4 h-4 text-apple-gray-500 group-hover:text-apple-blue transition-colors" />
                        <div className="text-2xl md:text-3xl font-display font-bold text-white">
                          {stat.display || <Counter end={stat.value} suffix={stat.suffix} />}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-apple-gray-500 font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section ref={s1.ref}>
        <div className={`transition-all duration-1000 ${s1.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs font-bold text-apple-blue uppercase tracking-[0.2em] mb-3 animate-fade-in">Features</p>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-white leading-tight">
                What makes TimiGS <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-apple-blue via-purple-400 to-apple-blue bg-[length:200%_auto] animate-text-shimmer">unique</span>
              </h2>
            </div>
            {/* Decorative element */}
            <div className="hidden lg:block relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-apple-blue/10 to-purple-500/10 border border-white/5 animate-spin-slow" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-br from-apple-blue/20 to-purple-500/20 border border-white/10 animate-spin-slow-reverse" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <FeatureCard key={i} feature={f} index={i} />
          ))}
        </div>
      </section>

      {/* ═══════════ COMPARISON ═══════════ */}
      <section ref={s2.ref}>
        <div className={`transition-all duration-1000 ${s2.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-[0.2em] mb-3">Comparison</p>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
            How TimiGS <span className="text-emerald-400">compares</span>
          </h2>
          <p className="text-base text-apple-gray-400 mb-10 max-w-xl">See why developers choose TimiGS over alternatives.</p>
        </div>

        <div className={`transition-all duration-1000 delay-200 ${s2.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left p-4 sm:p-5 text-apple-gray-400 font-medium text-xs uppercase tracking-wider">Feature</th>
                    <th className="p-4 sm:p-5 text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold text-sm">TimiGS</span>
                      </div>
                    </th>
                    <th className="p-4 sm:p-5 text-center text-apple-gray-500 text-xs font-medium">RescueTime</th>
                    <th className="p-4 sm:p-5 text-center text-apple-gray-500 text-xs font-medium">Toggl</th>
                    <th className="p-4 sm:p-5 text-center text-apple-gray-500 text-xs font-medium">WakaTime</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors duration-200"
                    >
                      <td className="p-4 sm:p-5 text-apple-gray-300 font-medium text-sm">{row.feature}</td>
                      {[row.timigs, row.rescue, row.toggl, row.waka].map((val, j) => (
                        <td key={j} className="p-4 sm:p-5 text-center">
                          {val === true ? (
                            <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${j === 0 ? "bg-emerald-500/15" : "bg-white/5"}`}>
                              <Check className={`w-3.5 h-3.5 ${j === 0 ? "text-emerald-400" : "text-apple-gray-600"}`} />
                            </div>
                          ) : val === false ? (
                            <div className="inline-flex items-center justify-center w-6 h-6 rounded-full">
                              <XIcon className="w-3.5 h-3.5 text-apple-gray-700" />
                            </div>
                          ) : val === "alpha" ? (
                            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">ALPHA</span>
                          ) : (
                            <span className="text-[9px] font-bold text-apple-gray-500 bg-white/5 px-2 py-0.5 rounded">PARTIAL</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ PLATFORMS ═══════════ */}
      <section ref={s3.ref} className="relative">
        <div className={`relative rounded-3xl overflow-hidden border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-8 sm:p-12 md:p-16 transition-all duration-1000 ${s3.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          {/* Animated background pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:40px_40px] opacity-50 pointer-events-none animate-grid-move" />
          <div className="absolute inset-0 bg-gradient-to-br from-apple-blue/5 via-transparent to-purple-500/5 opacity-50 animate-gradient-shift pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12 md:gap-16">
            <div className="md:w-1/2">
              <p className="text-xs font-bold text-purple-400 uppercase tracking-[0.2em] mb-3">Cross Platform</p>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-5 leading-[1.1]">
                Everywhere<br />you work.
              </h2>
              <p className="text-base text-apple-gray-400 leading-relaxed mb-8">
                Whether you're on Windows, macOS, Linux, or Android — TimiGS provides a seamless, native experience with consistent tracking across all your devices.
              </p>

              <div className="flex flex-wrap gap-3">
                {[
                  { name: "Windows", icon: <WindowsIcon className="w-5 h-5" />, color: "from-blue-500/10 to-blue-500/5 border-blue-500/15 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/10" },
                  { name: "macOS", icon: <MacOSIcon className="w-5 h-5" />, color: "from-gray-500/10 to-gray-500/5 border-gray-500/15 hover:border-gray-500/30 hover:shadow-lg hover:shadow-gray-500/10" },
                  { name: "Linux", icon: <LinuxIcon className="w-5 h-5" />, color: "from-amber-500/10 to-amber-500/5 border-amber-500/15 hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/10" },
                  { name: "Android", icon: <AndroidIcon className="w-5 h-5" />, badge: "Alpha", color: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/15 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/10" },
                ].map(os => (
                  <div 
                    key={os.name} 
                    className={`group flex items-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-br ${os.color} border text-white text-sm font-medium transition-all duration-500 hover:scale-105 hover:-translate-y-0.5 cursor-default overflow-hidden relative`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer-sweep" />
                    <span className="relative z-10 flex items-center gap-2">
                      <span className="group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">{os.icon}</span>
                      {os.name}
                    </span>
                    {os.badge && (
                      <span className="relative z-10 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 group-hover:scale-110 transition-transform">
                        {os.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Visual side with floating animation */}
            <div className="md:w-1/2 w-full">
              <div className="relative h-[260px] md:h-[320px] rounded-2xl overflow-hidden bg-gradient-to-br from-apple-blue/5 to-purple-500/5 border border-white/[0.06] flex items-center justify-center group hover:border-white/10 transition-all duration-500 hover:shadow-2xl hover:shadow-apple-blue/5">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,113,227,0.08),transparent_70%)] group-hover:opacity-150 transition-opacity duration-500" />
                
                {/* Floating icons */}
                <div className="absolute top-4 left-4 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center animate-float">
                  <WindowsIcon className="w-6 h-6 text-white/40" />
                </div>
                <div className="absolute bottom-4 right-4 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center animate-float-delayed">
                  <AndroidIcon className="w-6 h-6 text-white/40" />
                </div>
                
                <div className="relative text-center space-y-4 z-10">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-apple-blue/20 to-purple-500/20 border border-white/10 animate-float group-hover:scale-110 transition-transform duration-500">
                    <Zap className="w-10 h-10 text-white/30 group-hover:text-white/50 transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm text-apple-gray-500 font-semibold">Built with</p>
                    <p className="text-lg text-white/60 font-display font-bold group-hover:text-white/80 transition-colors">Tauri v2 + Flutter</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ OPEN SOURCE ═══════════ */}
      <section ref={s4.ref}>
        <div className={`text-center transition-all duration-1000 ${s4.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-apple-gray-400 mb-6 hover:border-white/15 hover:bg-white/06 transition-all duration-300">
            <Github className="w-3.5 h-3.5 animate-pulse-slow" />
            Open Source Project
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
            Built in the open.
          </h2>
          <p className="text-base text-apple-gray-400 max-w-xl mx-auto mb-10">
            TimiGS is fully open source. Inspect the code, contribute features, or fork it for your own needs. Transparency is at the core of everything we build.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com/BANSAFAn/timiGS-"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-6 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.15] hover:border-apple-blue/30 transition-all duration-500 text-white font-medium text-sm hover:shadow-lg hover:shadow-apple-blue/10"
            >
              <Star className="w-4 h-4 text-yellow-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
              Star on GitHub
              <ArrowRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
            </a>
            <a
              href="https://github.com/BANSAFAn/timiGS-/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.15] transition-all duration-500 text-apple-gray-400 font-medium text-sm hover:text-white hover:shadow-lg"
            >
              Report an Issue
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section ref={s5.ref} className="relative">
        <div className={`relative rounded-3xl overflow-hidden p-12 sm:p-16 md:p-20 text-center transition-all duration-1000 ${s5.visible ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]"}`}>
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-apple-blue/10 via-purple-500/10 to-pink-500/10 rounded-3xl animate-gradient-shift" />
          <div className="absolute inset-0 border border-white/[0.06] rounded-3xl" />
          
          {/* Floating orbs */}
          <div className="absolute top-[-50%] left-[20%] w-[600px] h-[600px] bg-apple-blue/10 rounded-full blur-[150px] animate-glow-pulse pointer-events-none" />
          <div className="absolute bottom-[-30%] right-[10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[140px] animate-glow-pulse pointer-events-none" style={{ animationDelay: "2s" }} />
          
          {/* Particle effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1.5 h-1.5 bg-white/30 rounded-full animate-float-particle"
                style={{
                  left: `${10 + i * 12}%`,
                  top: `${30 + (i % 4) * 15}%`,
                  animationDelay: `${i * 0.6}s`,
                  animationDuration: `${3 + i * 0.3}s`
                }}
              />
            ))}
          </div>

          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 tracking-tight leading-[1.1] animate-fade-in-up">
              Ready to take<br />control?
            </h2>
            <p className="text-apple-gray-400 text-lg mb-10 max-w-md mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              Open Source • Free Forever • No Data Collection
            </p>
            <a
              href={`/${lang}/download`}
              className="group inline-flex items-center gap-3 px-12 py-5 rounded-2xl bg-white text-black font-bold text-lg shadow-2xl shadow-white/10 hover:shadow-white/40 hover:shadow-apple-blue/20 hover:scale-[1.05] active:scale-[0.95] transition-all duration-500 overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-apple-blue/30 via-purple-500/30 to-apple-blue/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-x" />
              <Download className="w-6 h-6 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 relative z-10" />
              <span className="relative z-10">{t.hero.cta_download}</span>
              <ArrowRight className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300 relative z-10" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
