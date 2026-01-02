import React, { useEffect, useState, useRef } from "react";
import {
  Shield,
  BarChart3,
  Clock,
  Layout,
  Globe2,
  Activity,
  Star,
  Download,
  Sparkles,
  Zap,
  TrendingUp,
  Users,
  ArrowRight,
  Play,
  ChevronDown,
} from "lucide-react";
import { Language } from "../../i18n/types";
import type { Translation } from "../../i18n/types";
import GitHubStats from "../GitHubStats";

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay?: number;
}> = ({ icon, title, desc, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`p-6 rounded-2xl glass-panel hover:bg-slate-800/60 transition-all duration-500 border border-slate-800/50 group hover:border-sky-500/30 relative overflow-hidden ${
        isVisible ? 'animate-scale-in opacity-100' : 'opacity-0'
      }`}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Animated border gradient */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-[-1px] bg-gradient-to-r from-sky-500/20 via-purple-500/20 to-sky-500/20 rounded-2xl animate-gradient-x bg-300%" />
      </div>

      <div className="relative z-10">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500/20 to-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-sky-500/10">
          <div className="text-sky-400 group-hover:text-sky-300 transition-colors">{icon}</div>
        </div>
        <h3 className="text-xl font-bold mb-3 text-white group-hover:text-sky-100 transition-colors">
          {title}
        </h3>
        <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">{desc}</p>
      </div>
    </div>
  );
};

interface HomeProps {
  lang: Language;
  t: Translation;
}

const Home: React.FC<HomeProps> = ({ lang, t }) => {
  const [stars, setStars] = useState<number | null>(null);
  const [downloads, setDownloads] = useState<number | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const repoRes = await fetch("https://api.github.com/repos/BANSAFAn/timiGS-");
        if (repoRes.ok) {
          const repoData = await repoRes.json();
          setStars(repoData.stargazers_count);
        }

        const releasesRes = await fetch("https://api.github.com/repos/BANSAFAn/timiGS-/releases");
        if (releasesRes.ok) {
          const releasesData = await releasesRes.json();
          let totalDownloads = 0;
          if (Array.isArray(releasesData)) {
            releasesData.forEach((release: any) => {
              release.assets?.forEach((asset: any) => {
                totalDownloads += asset.download_count || 0;
              });
            });
          }
          setDownloads(totalDownloads);
        }
      } catch (e) {
        console.error("Failed to fetch GitHub stats", e);
      }
    };
    fetchStats();
  }, []);

  const technologies = [
    { name: "Tauri v2", color: "text-orange-400", border: "border-orange-500/30", bg: "bg-orange-500/10", glow: "shadow-[0_0_20px_-3px_rgba(251,146,60,0.4)]" },
    { name: "Rust", color: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/10", glow: "shadow-[0_0_20px_-3px_rgba(248,113,113,0.4)]" },
    { name: "Vue 3", color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10", glow: "shadow-[0_0_20px_-3px_rgba(52,211,153,0.4)]" },
    { name: "TypeScript", color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10", glow: "shadow-[0_0_20px_-3px_rgba(96,165,250,0.4)]" },
    { name: "Vite", color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10", glow: "shadow-[0_0_20px_-3px_rgba(192,132,252,0.4)]" },
    { name: "Pinia", color: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/10", glow: "shadow-[0_0_20px_-3px_rgba(250,204,21,0.4)]" },
    { name: "SQLite", color: "text-cyan-400", border: "border-cyan-500/30", bg: "bg-cyan-500/10", glow: "shadow-[0_0_20px_-3px_rgba(34,211,238,0.4)]" },
    { name: "Chart.js", color: "text-pink-400", border: "border-pink-500/30", bg: "bg-pink-500/10", glow: "shadow-[0_0_20px_-3px_rgba(244,114,182,0.4)]" },
  ];

  return (
    <div className="space-y-32">
      {/* Hero Section */}
      <section className="relative pt-8 pb-20 lg:pt-16 text-center overflow-hidden">
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-sky-500/10 rounded-full blur-xl animate-float" />
        <div className="absolute top-40 right-20 w-32 h-32 bg-purple-500/10 rounded-full blur-xl animate-float-delayed" />
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-pink-500/10 rounded-full blur-xl animate-float" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-sky-500/10 to-purple-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium mb-8 hover:border-sky-400/40 transition-all duration-300 group animate-slide-down">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="group-hover:text-sky-300 transition-colors">{t.hero.new_version}</span>
        </div>

        {/* Main Title */}
        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-6 animate-slide-up">
          <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-400 bg-clip-text text-transparent bg-300% animate-gradient-x">
            TimiGS
          </span>
        </h1>
        
        <p className="text-2xl md:text-4xl text-slate-300 font-light mb-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {t.hero.tagline}
        </p>

        <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in" style={{ animationDelay: '0.4s' }}>
          {t.hero.subtext}
        </p>

        {/* Stats with animation */}
        <div className="flex justify-center gap-6 mb-12 flex-wrap animate-fade-in" style={{ animationDelay: '0.5s' }}>
          {stars !== null && (
            <div className="group flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-900/80 border border-slate-700/50 hover:border-yellow-500/30 transition-all duration-300 hover:scale-105">
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400 group-hover:animate-wiggle" />
              <div className="text-left">
                <span className="block font-bold text-2xl text-white">{stars.toLocaleString()}</span>
                <span className="text-xs text-slate-500 uppercase tracking-wider">Stars</span>
              </div>
            </div>
          )}
          {downloads !== null && (
            <div className="group flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-900/80 border border-slate-700/50 hover:border-sky-500/30 transition-all duration-300 hover:scale-105">
              <Download className="w-6 h-6 text-sky-400 group-hover:animate-bounce-slow" />
              <div className="text-left">
                <span className="block font-bold text-2xl text-white">{downloads.toLocaleString()}</span>
                <span className="text-xs text-slate-500 uppercase tracking-wider">Downloads</span>
              </div>
            </div>
          )}
          <div className="group flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-900/80 border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-300 hover:scale-105">
            <Users className="w-6 h-6 text-emerald-400" />
            <div className="text-left">
              <span className="block font-bold text-2xl text-white">3</span>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Platforms</span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <a
            href={`/${lang}/download`}
            className="group relative w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-600 to-sky-500 text-white font-bold text-lg transition-all duration-300 shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-105 overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Download className="w-5 h-5" />
              {t.hero.cta_download}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>
          <a
            href="https://github.com/BANSAFAn/timiGS-"
            target="_blank"
            rel="noopener noreferrer"
            className="group w-full sm:w-auto px-8 py-4 rounded-2xl glass-panel hover:bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white font-bold text-lg transition-all duration-300 hover:border-sky-500/50 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            {t.hero.cta_github}
          </a>
        </div>

        {/* Hero Video/Preview */}
        <div 
          className="relative rounded-3xl border border-slate-800/50 shadow-2xl overflow-hidden glass-panel max-w-6xl mx-auto group animate-scale-in"
          style={{ 
            animationDelay: '0.7s',
            transform: `perspective(1000px) rotateX(${Math.min(scrollY * 0.02, 5)}deg)` 
          }}
        >
          {/* Gradient border effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
          
          <div className="relative aspect-video bg-slate-900 w-full overflow-hidden m-[1px] rounded-[23px]">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
            >
              <source src="/hero-demo.mp4" type="video/mp4" />
            </video>
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />
            
            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
              <button 
                onClick={() => setIsVideoPlaying(true)}
                className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl hover:scale-110 transition-transform duration-300 hover:bg-white/20"
              >
                <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
              </button>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="mt-12 animate-bounce">
          <ChevronDown className="w-8 h-8 text-slate-600 mx-auto" />
        </div>
      </section>

      {/* GitHub Stats Section */}
      <section className="max-w-4xl mx-auto">
        <GitHubStats variant="full" />
      </section>

      {/* Features Grid */}
      <section>
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            <span>Powerful Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            {t.features.title}
          </h2>
          <div className="h-1.5 w-24 bg-gradient-to-r from-sky-500 to-purple-500 mx-auto rounded-full shadow-[0_0_20px_rgba(14,165,233,0.5)]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard icon={<Clock className="w-7 h-7" />} title={t.features.realtime_title} desc={t.features.realtime_desc} delay={0} />
          <FeatureCard icon={<Shield className="w-7 h-7" />} title={t.features.privacy_title} desc={t.features.privacy_desc} delay={100} />
          <FeatureCard icon={<BarChart3 className="w-7 h-7" />} title={t.features.analytics_title} desc={t.features.analytics_desc} delay={200} />
          <FeatureCard icon={<Activity className="w-7 h-7" />} title={t.features.timeline_title} desc={t.features.timeline_desc} delay={300} />
          <FeatureCard icon={<Layout className="w-7 h-7" />} title={t.features.crossplatform_title} desc={t.features.crossplatform_desc} delay={400} />
          <FeatureCard icon={<Globe2 className="w-7 h-7" />} title={t.features.i18n_title} desc={t.features.i18n_desc} delay={500} />
        </div>
      </section>

      {/* Tech Stack Marquee */}
      <section className="py-24 border-y border-slate-800/50 bg-gradient-to-b from-slate-950/50 via-slate-900/30 to-slate-950/50 relative overflow-hidden">
        {/* Gradient overlays for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center mb-16 relative z-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
            <TrendingUp className="w-4 h-4" />
            <span>Modern Stack</span>
          </div>
          <h3 className="text-sm font-bold text-sky-400 uppercase tracking-[0.3em] mb-3">
            {t.hero.built_for}
          </h3>
          <p className="text-3xl md:text-4xl font-bold text-white">
            {t.hero.powered_by}
          </p>
        </div>

        <div className="flex overflow-hidden py-4">
          <div className="flex animate-scroll hover:[animation-play-state:paused] gap-8 px-4 w-max">
            {[...technologies, ...technologies, ...technologies].map((tech, i) => (
              <div
                key={`${tech.name}-${i}`}
                className={`
                  flex items-center gap-3 px-8 py-4 rounded-2xl border 
                  ${tech.border} ${tech.bg} ${tech.color}
                  backdrop-blur-md transition-all duration-300 
                  hover:scale-110 hover:brightness-125 ${tech.glow}
                `}
              >
                <span className="font-bold text-lg whitespace-nowrap tracking-wide">
                  {tech.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">
            Ready to Track Smarter?
          </h2>
          <p className="text-xl text-slate-400 mb-10">
            Join thousands of users who trust TimiGS for their activity tracking needs.
          </p>
          <a
            href={`/${lang}/download`}
            className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 text-white font-bold text-xl shadow-xl shadow-sky-500/30 hover:shadow-sky-500/50 hover:scale-105 transition-all duration-300"
          >
            <Download className="w-6 h-6" />
            Download Now — It's Free
            <ArrowRight className="w-6 h-6" />
          </a>
        </div>
      </section>
    </div>
  );
};

export default Home;
