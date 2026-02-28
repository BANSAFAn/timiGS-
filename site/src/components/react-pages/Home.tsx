import React, { useEffect, useRef, useState } from "react";
import {
  Shield,
  BarChart3,
  Clock,
  Globe2,
  Activity,
  Download,
  ChevronRight,
  Sparkles,
  Focus,
  Timer,
  CloudSun,
  HardDrive,
  Smartphone,
  Monitor,
  Laptop,
  Check,
  X as XIcon,
  Lock,
  Zap,
  Eye,
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

/* ── Animated counter ── */
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

/* ── Feature Card with its own scroll reveal ── */
function FeatureCard({ feature, index }: { feature: { icon: React.ReactNode; title: string; desc: string; accent: string; glow: string; badge: string }; index: number }) {
  const { ref, visible } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.04] hover:shadow-2xl hover:-translate-y-1 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"
        style={{ background: `radial-gradient(600px circle at 50% 50%, ${feature.glow}, transparent 60%)` }}
      />
      <div className="relative z-10">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.accent} mb-5 shadow-lg`}>
          <span className="text-white">{feature.icon}</span>
        </div>
        <h3 className="text-lg font-display font-bold text-white mb-2.5 flex items-center gap-2">
          <span className="text-xl">{feature.badge}</span> {feature.title}
        </h3>
        <p className="text-sm text-apple-gray-400 leading-relaxed">{feature.desc}</p>
      </div>
    </div>
  );
}

const Home: React.FC<HomeProps> = ({ lang, t }) => {
  const features = [
    {
      icon: <Focus className="w-6 h-6" />,
      title: "Focus Mode",
      desc: "Lock yourself into productive work. Block app switching with a password-protected Focus Mode that keeps you on task.",
      accent: "from-rose-500 to-pink-600",
      glow: "rgba(244,63,94,0.15)",
      badge: "🎯",
    },
    {
      icon: <Timer className="w-6 h-6" />,
      title: "Time OUT",
      desc: "Smart break reminders that protect your health. Set custom intervals and get notified when it's time to rest.",
      accent: "from-amber-500 to-orange-600",
      glow: "rgba(245,158,11,0.15)",
      badge: "⏰",
    },
    {
      icon: <CloudSun className="w-6 h-6" />,
      title: "Built-in Weather",
      desc: "Weather widget right in your tracker. Auto-detect location or set manually — plan your day without leaving the app.",
      accent: "from-sky-500 to-cyan-600",
      glow: "rgba(14,165,233,0.15)",
      badge: "🌦️",
    },
    {
      icon: <HardDrive className="w-6 h-6" />,
      title: "Google Drive Sync",
      desc: "Back up and sync your activity data across devices via Google Drive. Your data, your cloud, your control.",
      accent: "from-emerald-500 to-teal-600",
      glow: "rgba(16,185,129,0.15)",
      badge: "☁️",
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "100% Privacy",
      desc: "All data stored locally in SQLite. Zero telemetry, zero cloud uploads. You own every byte of your data.",
      accent: "from-purple-500 to-violet-600",
      glow: "rgba(139,92,246,0.15)",
      badge: "🔒",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Rich Analytics",
      desc: "Beautiful Donut, Pie, and Bar charts. Day-by-day timeline view. Understand exactly where your time goes.",
      accent: "from-blue-500 to-indigo-600",
      glow: "rgba(59,130,246,0.15)",
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
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-24 md:space-y-36">

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative pt-12 md:pt-24 pb-16 md:pb-28 overflow-hidden">
        {/* Ambient glow blobs */}
        <div className="absolute top-[-120px] left-[10%] w-[600px] h-[600px] bg-apple-blue/15 rounded-full blur-[180px] animate-glow-pulse pointer-events-none" />
        <div className="absolute bottom-[-80px] right-[5%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[160px] animate-glow-pulse pointer-events-none" style={{ animationDelay: "1.5s" }} />

        <div className="relative z-10">
          {/* Badge */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm text-xs font-semibold text-apple-gray-300 tracking-wide mb-8">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              Open Source • Free Forever
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">v2</span>
            </div>
          </div>

          {/* Main heading */}
          <h1 className="animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
            <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight text-white leading-[1.05] mb-2">
              Track Time.
            </span>
            <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight leading-[1.05]">
              <span className="text-transparent bg-clip-text bg-[length:200%_auto] animate-text-shimmer bg-gradient-to-r from-apple-blue via-purple-400 to-apple-blue">
                Master Focus.
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-in-up text-lg sm:text-xl md:text-2xl text-apple-gray-400 font-medium max-w-2xl mt-8 mb-12 leading-relaxed" style={{ animationDelay: "0.4s" }}>
            {t.hero.subtext}
          </p>

          {/* CTAs */}
          <div className="animate-fade-in-up flex flex-col sm:flex-row items-start gap-4" style={{ animationDelay: "0.55s" }}>
            <a
              href={`/${lang}/download`}
              className="group relative px-8 py-4 rounded-2xl bg-white text-black font-semibold text-base transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-2xl shadow-white/10 hover:shadow-white/20 flex items-center gap-2.5"
            >
              <Download className="w-5 h-5" />
              {t.hero.cta_download}
              <ChevronRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </a>
            <a
              href="https://github.com/BANSAFAn/timiGS-"
              target="_blank"
              rel="noopener noreferrer"
              className="group px-8 py-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-white font-semibold text-base hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-300 flex items-center gap-2.5 backdrop-blur-sm"
            >
              <Github className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
              {t.hero.cta_github}
            </a>
          </div>

          {/* Stats row */}
          <div className="animate-fade-in-up flex flex-wrap gap-8 mt-16 pt-8 border-t border-white/5" style={{ animationDelay: "0.7s" }}>
            {[
              { label: "Downloads", value: ghStats.downloads, suffix: "+" },
              { label: "GitHub Stars", value: ghStats.stars, suffix: "" },
              { label: "Platforms", value: 4, suffix: "" },
              { label: "Data Collected", value: 0, suffix: "", display: "Zero" },
            ].map((stat, i) => (
              <div key={i} className="text-center sm:text-left">
                <div className="text-2xl md:text-3xl font-display font-bold text-white">
                  {stat.display || <Counter end={stat.value} suffix={stat.suffix} />}
                </div>
                <div className="text-xs text-apple-gray-500 font-medium mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section ref={s1.ref}>
        <div className={`transition-all duration-700 ${s1.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs font-bold text-apple-blue uppercase tracking-[0.2em] mb-3">Features</p>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-white">
                What makes TimiGS <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-apple-blue to-purple-400">unique</span>
              </h2>
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
        <div className={`transition-all duration-700 ${s2.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-[0.2em] mb-3">Comparison</p>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
            How TimiGS <span className="text-emerald-400">compares</span>
          </h2>
          <p className="text-base text-apple-gray-400 mb-10 max-w-xl">See why developers choose TimiGS over alternatives.</p>
        </div>

        <div className={`transition-all duration-700 delay-200 ${s2.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.015]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left p-4 sm:p-5 text-apple-gray-500 font-medium text-xs uppercase tracking-wider">Feature</th>
                    <th className="p-4 sm:p-5 text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-apple-blue/10 border border-apple-blue/20">
                        <Sparkles className="w-3.5 h-3.5 text-apple-blue" />
                        <span className="text-apple-blue font-bold text-sm">TimiGS</span>
                      </div>
                    </th>
                    <th className="p-4 sm:p-5 text-center text-apple-gray-500 text-xs font-medium">RescueTime</th>
                    <th className="p-4 sm:p-5 text-center text-apple-gray-500 text-xs font-medium">Toggl</th>
                    <th className="p-4 sm:p-5 text-center text-apple-gray-500 text-xs font-medium">WakaTime</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((row, i) => (
                    <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 sm:p-5 text-white font-medium text-sm">{row.feature}</td>
                      {[row.timigs, row.rescue, row.toggl, row.waka].map((val, j) => (
                        <td key={j} className="p-4 sm:p-5 text-center">
                          {val === true ? (
                            <div className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${j === 0 ? "bg-emerald-500/15" : "bg-white/5"}`}>
                              <Check className={`w-4 h-4 ${j === 0 ? "text-emerald-400" : "text-apple-gray-600"}`} />
                            </div>
                          ) : val === false ? (
                            <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/[0.03]">
                              <XIcon className="w-4 h-4 text-apple-gray-700" />
                            </div>
                          ) : val === "alpha" ? (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">ALPHA</span>
                          ) : (
                            <span className="text-[10px] font-bold text-apple-gray-500 bg-white/5 px-2.5 py-1 rounded-full">PARTIAL</span>
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
        <div className={`relative rounded-3xl overflow-hidden border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-8 sm:p-12 md:p-16 transition-all duration-700 ${s3.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:40px_40px] opacity-50 pointer-events-none" />

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
                  { name: "Windows", icon: <Monitor className="w-4 h-4" />, color: "from-blue-500/10 to-blue-500/5 border-blue-500/15 hover:border-blue-500/30" },
                  { name: "macOS", icon: <Laptop className="w-4 h-4" />, color: "from-gray-500/10 to-gray-500/5 border-gray-500/15 hover:border-gray-500/30" },
                  { name: "Linux", icon: <Activity className="w-4 h-4" />, color: "from-amber-500/10 to-amber-500/5 border-amber-500/15 hover:border-amber-500/30" },
                  { name: "Android", icon: <Smartphone className="w-4 h-4" />, badge: "Alpha", color: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/15 hover:border-emerald-500/30" },
                ].map(os => (
                  <div key={os.name} className={`flex items-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-br ${os.color} border text-white text-sm font-medium transition-all duration-300 hover:scale-[1.03] cursor-default`}>
                    {os.icon}
                    {os.name}
                    {os.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        {os.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Visual side */}
            <div className="md:w-1/2 w-full">
              <div className="relative h-[260px] md:h-[320px] rounded-2xl overflow-hidden bg-gradient-to-br from-apple-blue/5 to-purple-500/5 border border-white/[0.06] flex items-center justify-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,113,227,0.08),transparent_70%)]" />
                <div className="relative text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-apple-blue/20 to-purple-500/20 border border-white/10 animate-float">
                    <Zap className="w-10 h-10 text-white/30" />
                  </div>
                  <div>
                    <p className="text-sm text-apple-gray-500 font-semibold">Built with</p>
                    <p className="text-lg text-white/60 font-display font-bold">Tauri v2 + Flutter</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ OPEN SOURCE ═══════════ */}
      <section ref={s4.ref}>
        <div className={`text-center transition-all duration-700 ${s4.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-apple-gray-400 mb-6">
            <Github className="w-3.5 h-3.5" />
            Open Source Project
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">
            Built in the open.
          </h2>
          <p className="text-base text-apple-gray-400 max-w-xl mx-auto mb-10">
            TimiGS is fully open source. Inspect the code, contribute features, or fork it for your own needs. Transparency is at the core of what we build.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com/BANSAFAn/timiGS-"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-6 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.15] transition-all duration-300 text-white font-medium text-sm"
            >
              <Star className="w-4 h-4 text-yellow-400" />
              Star on GitHub
              <ArrowRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </a>
            <a
              href="https://github.com/BANSAFAn/timiGS-/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.15] transition-all duration-300 text-apple-gray-400 font-medium text-sm"
            >
              Report an Issue
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section ref={s5.ref} className="relative">
        <div className={`relative rounded-3xl overflow-hidden p-12 sm:p-16 md:p-20 text-center transition-all duration-700 ${s5.visible ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]"}`}>
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-apple-blue/10 via-purple-500/10 to-pink-500/10 rounded-3xl" />
          <div className="absolute inset-0 border border-white/[0.06] rounded-3xl" />
          <div className="absolute top-[-50%] left-[20%] w-[600px] h-[600px] bg-apple-blue/10 rounded-full blur-[150px] animate-glow-pulse pointer-events-none" />

          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-6 tracking-tight leading-[1.1]">
              Ready to take<br />control?
            </h2>
            <p className="text-apple-gray-400 text-lg mb-10 max-w-md mx-auto">
              Open Source • Free Forever • No Data Collection
            </p>
            <a
              href={`/${lang}/download`}
              className="group inline-flex items-center gap-3 px-12 py-5 rounded-2xl bg-white text-black font-bold text-lg shadow-2xl shadow-white/10 hover:shadow-white/25 hover:scale-[1.03] active:scale-[0.97] transition-all duration-300"
            >
              <Download className="w-6 h-6" />
              {t.hero.cta_download}
              <ArrowRight className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
