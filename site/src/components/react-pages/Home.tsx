import React, { useEffect, useState } from "react";
import {
  Shield,
  BarChart3,
  Clock,
  Layout,
  Globe2,
  Activity,
  Star,
  Download,
} from "lucide-react";
import { Language, Translation } from "../../i18n/types";

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  desc: string;
}> = ({ icon, title, desc }) => (
  <div className="p-6 rounded-2xl glass-panel hover:bg-slate-800/60 transition-all hover:scale-[1.02] border border-slate-800/50 group hover:border-sky-500/30 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
    <div className="w-12 h-12 rounded-lg bg-sky-500/10 flex items-center justify-center mb-4 group-hover:bg-sky-500/20 transition-colors relative z-10">
      <div className="text-sky-400">{icon}</div>
    </div>
    <h3 className="text-xl font-semibold mb-2 text-slate-100 relative z-10">
      {title}
    </h3>
    <p className="text-slate-400 leading-relaxed relative z-10">{desc}</p>
  </div>
);

interface HomeProps {
  lang: Language;
  t: Translation;
}

const Home: React.FC<HomeProps> = ({ lang, t }) => {
  const [stars, setStars] = useState<number | null>(null);
  const [downloads, setDownloads] = useState<number | null>(null);

  useEffect(() => {
    // Fetch GitHub Stats
    const fetchStats = async () => {
      try {
        // Stars
        const repoRes = await fetch(
          "https://api.github.com/repos/BANSAFAn/timiGS-"
        );
        if (repoRes.ok) {
          const repoData = await repoRes.json();
          setStars(repoData.stargazers_count);
        }

        // Downloads (Sum of all assets in all releases)
        const releasesRes = await fetch(
          "https://api.github.com/repos/BANSAFAn/timiGS-/releases"
        );
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

  // Polished text badges with brand colors
  const technologies = [
    {
      name: "Tauri v2",
      color: "text-orange-400",
      border: "border-orange-500/30",
      bg: "bg-orange-500/10",
      glow: "shadow-[0_0_15px_-3px_rgba(251,146,60,0.3)]",
    },
    {
      name: "Rust",
      color: "text-red-400",
      border: "border-red-500/30",
      bg: "bg-red-500/10",
      glow: "shadow-[0_0_15px_-3px_rgba(248,113,113,0.3)]",
    },
    {
      name: "Vue 3",
      color: "text-emerald-400",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
      glow: "shadow-[0_0_15px_-3px_rgba(52,211,153,0.3)]",
    },
    {
      name: "TypeScript",
      color: "text-blue-400",
      border: "border-blue-500/30",
      bg: "bg-blue-500/10",
      glow: "shadow-[0_0_15px_-3px_rgba(96,165,250,0.3)]",
    },
    {
      name: "Vite",
      color: "text-purple-400",
      border: "border-purple-500/30",
      bg: "bg-purple-500/10",
      glow: "shadow-[0_0_15px_-3px_rgba(192,132,252,0.3)]",
    },
    {
      name: "Pinia",
      color: "text-yellow-400",
      border: "border-yellow-500/30",
      bg: "bg-yellow-500/10",
      glow: "shadow-[0_0_15px_-3px_rgba(250,204,21,0.3)]",
    },
    {
      name: "SQLite",
      color: "text-cyan-400",
      border: "border-cyan-500/30",
      bg: "bg-cyan-500/10",
      glow: "shadow-[0_0_15px_-3px_rgba(34,211,238,0.3)]",
    },
    {
      name: "Chart.js",
      color: "text-pink-400",
      border: "border-pink-500/30",
      bg: "bg-pink-500/10",
      glow: "shadow-[0_0_15px_-3px_rgba(244,114,182,0.3)]",
    },
  ];

  return (
    <div className="space-y-24 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 lg:pt-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium mb-8 hover:bg-sky-500/20 transition-colors cursor-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
          </span>
          {t.hero.new_version}
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 bg-gradient-to-r from-sky-400 via-blue-100 to-sky-400 bg-clip-text text-transparent pb-2 drop-shadow-sm">
          TimiGS
          <br />
          <span className="text-3xl md:text-5xl text-slate-400 font-normal mt-2 block">
            {t.hero.tagline}
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed px-4">
          {t.hero.subtext}
        </p>

        {/* Stats Section */}
        <div className="flex justify-center gap-8 mb-12 flex-wrap">
          {stars !== null && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-800 text-slate-300">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="font-bold text-white">{stars}</span>
              <span className="text-sm">Stars</span>
            </div>
          )}
          {downloads !== null && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 border border-slate-800 text-slate-300">
              <Download className="w-5 h-5 text-sky-400" />
              <span className="font-bold text-white">
                {downloads.toLocaleString()}
              </span>
              <span className="text-sm">Downloads</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href={`/${lang}/download`}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-all shadow-lg shadow-sky-900/20 hover:scale-105 hover:shadow-sky-500/30 cursor-none"
          >
            {t.hero.cta_download}
          </a>
          <a
            href="https://github.com/BANSAFAn/timiGS-"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl glass-panel hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-semibold transition-all hover:border-sky-500/50 cursor-none"
          >
            {t.hero.cta_github}
          </a>
        </div>

        {/* Hero Video */}
        <div className="mt-16 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden glass-panel max-w-5xl mx-auto relative group">
          <div className="absolute inset-0 bg-sky-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          <div className="relative aspect-video bg-slate-900 w-full overflow-hidden">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-700"
            >
              {/* Placeholder video - User should replace this */}
              <source src="/hero-demo.mp4" type="video/mp4" />
              <img
                src="https://via.placeholder.com/1200x675/0f172a/38bdf8?text=TimiGS+Preview"
                alt="TimiGS Preview"
                className="w-full h-full object-cover"
              />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-transparent pointer-events-none"></div>

            {/* Overlay Play Button (Decorative/Functional if needed) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-xl">
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-1"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section>
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t.features.title}
          </h2>
          <div className="h-1 w-20 bg-sky-500 mx-auto rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)]"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
          <FeatureCard
            icon={<Clock className="w-6 h-6" />}
            title={t.features.realtime_title}
            desc={t.features.realtime_desc}
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title={t.features.privacy_title}
            desc={t.features.privacy_desc}
          />
          <FeatureCard
            icon={<BarChart3 className="w-6 h-6" />}
            title={t.features.analytics_title}
            desc={t.features.analytics_desc}
          />
          <FeatureCard
            icon={<Activity className="w-6 h-6" />}
            title={t.features.timeline_title}
            desc={t.features.timeline_desc}
          />
          <FeatureCard
            icon={<Layout className="w-6 h-6" />}
            title={t.features.crossplatform_title}
            desc={t.features.crossplatform_desc}
          />
          <FeatureCard
            icon={<Globe2 className="w-6 h-6" />}
            title={t.features.i18n_title}
            desc={t.features.i18n_desc}
          />
        </div>
      </section>

      {/* Tech Stack Marquee */}
      <section className="py-20 border-y border-slate-800/50 bg-slate-950/30 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950 pointer-events-none z-10"></div>

        <div className="max-w-7xl mx-auto text-center mb-12 relative z-20">
          <h3 className="text-sm font-bold text-sky-400 uppercase tracking-[0.2em] mb-2">
            {t.hero.built_for}
          </h3>
          <p className="text-2xl font-semibold text-white">
            {t.hero.powered_by}
          </p>
        </div>

        <div className="flex overflow-hidden py-4">
          <div className="flex animate-scroll hover:[animation-play-state:paused] gap-8 px-4 w-max">
            {[...technologies, ...technologies, ...technologies].map(
              (tech, i) => (
                <div
                  key={`${tech.name}-${i}`}
                  className={`
                          flex items-center gap-2 px-8 py-3 rounded-full border 
                          ${tech.border} ${tech.bg} ${tech.color}
                          backdrop-blur-md transition-all duration-300 
                          hover:scale-110 hover:brightness-110 ${tech.glow}
                        `}
                >
                  <span className="font-bold text-lg whitespace-nowrap tracking-wide">
                    {tech.name}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
