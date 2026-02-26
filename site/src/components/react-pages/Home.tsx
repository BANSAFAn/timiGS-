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
  Zap,
  ChevronRight,
  Play,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Language } from "../../i18n/types";
import type { Translation } from "../../i18n/types";


const BentoCard: React.FC<{
  className?: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  delay?: number;
}> = ({ className, title, desc, icon, delay = 0 }) => (
  <div
    className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-apple-gray-900/40 backdrop-blur-xl border border-white/5 p-6 sm:p-8 transition-all duration-500 hover:bg-apple-gray-900/60 hover:scale-[1.01] hover:shadow-2xl hover:shadow-apple-blue/5 group ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 sm:w-32 sm:h-32 bg-apple-blue/10 rounded-full blur-2xl group-hover:bg-apple-blue/20 transition-all duration-500" />
    <div className="relative z-10 flex flex-col h-full">
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform duration-500 text-white w-fit">
        {icon}
      </div>
      <h3 className="text-xl sm:text-2xl font-display font-bold text-white mb-2 sm:mb-3">{title}</h3>
      <p className="text-sm sm:text-base text-apple-gray-400 font-medium leading-relaxed">{desc}</p>
    </div>
  </div>
);

interface HomeProps {
  lang: Language;
  t: Translation;
}

const Home: React.FC<HomeProps> = ({ lang, t }) => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="space-y-24 sm:space-y-32 md:space-y-40">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 md:pb-32 lg:pt-24 xl:pt-32 text-center px-2 sm:px-4 md:px-0">
        <div className="animate-fade-in-up">
           <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white tracking-wide mb-6 sm:mb-8 backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-apple-blue opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-apple-blue"></span>
            </span>
            {t.hero.new_version || "v1.20 Now Available"}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-display font-bold tracking-tight mb-4 sm:mb-6 md:mb-8 text-white text-balance leading-[1.1] sm:leading-[0.9]">
            Track Time.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-apple-blue to-purple-400">
               Master Focus.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-apple-gray-400 font-medium max-w-xl sm:max-w-2xl mx-auto mb-8 sm:mb-10 md:mb-12 leading-relaxed px-2">
            {t.hero.subtext}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-16 sm:mb-20 px-4">
            <a
              href={`/${lang}/download`}
              className="w-full sm:w-auto min-w-[160px] sm:min-w-[180px] px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-white text-black font-semibold text-base sm:text-lg transition-transform duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-white/10 flex items-center justify-center gap-2"
            >
              {t.hero.cta_download}
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="https://github.com/BANSAFAn/timiGS-"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto min-w-[160px] sm:min-w-[180px] px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-white/10 border border-white/5 text-white font-semibold text-base sm:text-lg backdrop-blur-md transition-all duration-300 hover:bg-white/15 active:scale-95 flex items-center justify-center gap-2"
            >
              {t.hero.cta_github}
              <ExternalLinkWrapper />
            </a>
          </div>
        </div>

        {/* App Showcase Presentation */}
        <div className="relative max-w-5xl mx-auto px-3 sm:px-4 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <div className="relative rounded-2xl sm:rounded-3xl border border-white/10 bg-apple-gray-900/50 backdrop-blur-xl shadow-2xl overflow-hidden min-h-[400px] sm:min-h-[500px] flex flex-col md:flex-row">
                 {/* Sidebar / Tabs */}
                 <div className="md:w-1/3 p-4 sm:p-6 md:p-8 border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-center space-y-4 sm:space-y-6 bg-white/5">
                    <div className="space-y-2">
                        <h3 className="text-xs sm:text-sm font-semibold text-apple-blue uppercase tracking-widest">Overview</h3>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-white">How it works</h2>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        {[
                            { title: 'Smart Dashboard', desc: 'Your productivity at a glance.', icon: <Activity className="w-4 h-4 sm:w-5 sm:h-5"/> },
                            { title: 'Privacy First', desc: 'Data stays on your device.', icon: <Shield className="w-4 h-4 sm:w-5 sm:h-5"/> },
                            { title: 'Auto-Categorization', desc: 'AI-powered sorting.', icon: <Sparkles className="w-4 h-4 sm:w-5 sm:h-5"/> }
                        ].map((item, i) => (
                            <div key={i} className="group p-3 sm:p-4 rounded-xl cursor-default transition-all duration-300 hover:bg-white/5 border border-transparent hover:border-white/5">
                                <div className="flex items-center gap-2 sm:gap-3 mb-2 text-white group-hover:text-apple-blue transition-colors">
                                    {item.icon}
                                    <span className="font-bold text-sm sm:text-base">{item.title}</span>
                                </div>
                                <p className="text-xs sm:text-sm text-apple-gray-400 pl-7 sm:pl-8">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                 </div>

                 {/* Visual Area */}
                 <div className="md:w-2/3 relative bg-gradient-to-br from-apple-gray-900 to-black flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden group">
                     {/* Background Glow */}
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-apple-blue/10 rounded-full blur-[80px] sm:blur-[100px] md:blur-[120px] group-hover:bg-apple-blue/20 transition-all duration-700"></div>

                     {/* Placeholder for Screenshots/Graphics */}
                     <div className="relative z-10 w-full max-w-sm sm:max-w-md aspect-square rounded-xl sm:rounded-2xl bg-black/40 border border-white/10 shadow-2xl flex items-center justify-center backdrop-blur-sm transform group-hover:scale-105 transition-transform duration-700">
                        <div className="text-center p-4 sm:p-6">
                            <Layout className="w-12 h-12 sm:w-16 sm:h-16 text-white/20 mx-auto mb-3 sm:mb-4" />
                            <p className="text-sm sm:text-base text-apple-gray-500 font-medium">Interactive Demo UI</p>
                            <p className="text-xs text-apple-gray-600 mt-2">Screenshots will appear here</p>
                        </div>

                        {/* Floating elements decoration */}
                        <div className="absolute -right-8 sm:-right-12 top-8 sm:top-12 w-20 h-20 sm:w-24 sm:h-24 bg-apple-gray-800/80 rounded-xl border border-white/10 shadow-xl backdrop-blur-md animate-float-delayed"></div>
                        <div className="absolute -left-4 sm:-left-8 bottom-8 sm:bottom-12 w-40 sm:w-48 h-14 sm:h-16 bg-apple-gray-800/80 rounded-xl border border-white/10 shadow-xl backdrop-blur-md animate-float flex items-center px-3 sm:px-4 gap-2 sm:gap-3">
                             <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                 <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                             </div>
                             <div className="h-1.5 sm:h-2 w-16 sm:w-20 bg-white/10 rounded-full"></div>
                        </div>
                     </div>
                 </div>
            </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4 sm:mb-6">Designed for <span className="text-apple-blue">Performance</span>.</h2>
            <p className="text-base sm:text-lg md:text-xl text-apple-gray-400 max-w-2xl px-2 sm:px-0">{t.features.title}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 auto-rows-[280px] sm:auto-rows-[300px]">
          <BentoCard
            className="md:col-span-2 md:row-span-1"
            title={t.features.realtime_title}
            desc={t.features.realtime_desc}
            icon={<Clock className="w-6 h-6 sm:w-8 sm:h-8" />}
            delay={100}
          />
          <BentoCard
            className="md:col-span-1"
            title={t.features.privacy_title}
            desc={t.features.privacy_desc}
            icon={<Shield className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />}
            delay={200}
          />
          <BentoCard
            className="md:col-span-1"
            title={t.features.analytics_title}
            desc={t.features.analytics_desc}
            icon={<BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />}
            delay={300}
          />
           <BentoCard
            className="md:col-span-2"
            title={t.features.crossplatform_title}
            desc={t.features.crossplatform_desc}
            icon={<Layout className="w-6 h-6 sm:w-8 sm:h-8 text-sky-400" />}
            delay={400}
          />
        </div>
      </section>

      {/* Detailed Platform Section */}
      <section className="relative py-20 sm:py-24 md:py-32 bg-apple-gray-900/30 border-y border-white/5 backdrop-blur-sm">
         <div className="max-w-7xl mx-auto px-3 sm:px-4 flex flex-col md:flex-row items-center gap-8 sm:gap-12 md:gap-16">
            <div className="md:w-1/2">
                 <h3 className="text-xs sm:text-sm font-semibold text-apple-blue uppercase tracking-widest mb-3 sm:mb-4">Cross Platform</h3>
                 <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4 sm:mb-6">Everywhere you work.</h2>
                 <p className="text-base sm:text-lg text-apple-gray-400 leading-relaxed mb-6 sm:mb-8">
                     Whether you are on Windows, macOS, or Linux, TimiGS provides a seamless and native experience.
                     Synced locally or via your own cloud.
                 </p>
                 <div className="flex flex-wrap gap-2 sm:gap-4">
                     {['Windows', 'macOS', 'Linux'].map(os => (
                         <div key={os} className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 text-white text-sm sm:text-base font-medium">
                             {os}
                         </div>
                     ))}
                 </div>
            </div>
            <div className="md:w-1/2 relative h-[300px] sm:h-[350px] md:h-[400px] w-full bg-gradient-to-br from-apple-blue/20 to-purple-500/20 rounded-2xl sm:rounded-3xl overflow-hidden glass flex items-center justify-center">
                 <Activity className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 text-white/20" />
            </div>
         </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-20 sm:py-24 md:py-32 max-w-4xl mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold text-white mb-6 sm:mb-8 tracking-tighter">
            Ready to dive in?
        </h2>
        <div className="flex flex-col items-center gap-4 sm:gap-6">
            <a
              href={`/${lang}/download`}
              className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 rounded-full bg-apple-blue text-white font-bold text-lg sm:text-xl shadow-2xl shadow-apple-blue/30 hover:shadow-apple-blue/50 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3"
            >
              <Download className="w-5 h-5 sm:w-6 sm:h-6" />
              {t.hero.cta_download}
            </a>
            <p className="text-apple-gray-500 text-xs sm:text-sm">Open Source • Free Forever • No Data Collection</p>
        </div>
      </section>
    </div>
  );
};

const ExternalLinkWrapper = () => (
    <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
)

export default Home;
