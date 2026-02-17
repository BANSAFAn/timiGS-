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
    className={`relative overflow-hidden rounded-3xl bg-apple-gray-900/40 backdrop-blur-xl border border-white/5 p-8 transition-all duration-500 hover:bg-apple-gray-900/60 hover:scale-[1.01] hover:shadow-2xl hover:shadow-apple-blue/5 group ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-32 h-32 bg-apple-blue/10 rounded-full blur-2xl group-hover:bg-apple-blue/20 transition-all duration-500" />
    <div className="relative z-10 flex flex-col h-full">
      <div className="mb-6 p-4 rounded-2xl bg-white/5 w-fit border border-white/5 group-hover:scale-110 transition-transform duration-500 text-white">
        {icon}
      </div>
      <h3 className="text-2xl font-display font-bold text-white mb-3">{title}</h3>
      <p className="text-apple-gray-400 font-medium leading-relaxed">{desc}</p>
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
    <div className="space-y-20 md:space-y-40">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-20 md:pb-32 lg:pt-32 text-center px-4 md:px-0">
        <div className="animate-fade-in-up">
           <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white tracking-wide mb-6 md:mb-8 backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-apple-blue opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-apple-blue"></span>
            </span>
            {t.hero.new_version || "v1.20 Now Available"}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-display font-bold tracking-tight mb-6 md:mb-8 text-white text-balance leading-[0.9]">
            Track Time.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-apple-blue to-purple-400">
               Master Focus.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-apple-gray-400 font-medium max-w-2xl mx-auto mb-8 md:mb-12 text-balance leading-relaxed px-2">
            {t.hero.subtext}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-16 md:mb-20 px-4">
            <a
              href={`/${lang}/download`}
              className="w-full sm:w-auto min-w-[160px] px-6 md:px-8 py-3 md:py-4 rounded-full bg-white text-black font-semibold text-base md:text-lg transition-transform duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-white/10 flex items-center justify-center gap-2"
            >
              {t.hero.cta_download}
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a
              href="https://github.com/BANSAFAn/timiGS-"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto min-w-[160px] px-6 md:px-8 py-3 md:py-4 rounded-full bg-white/10 border border-white/5 text-white font-semibold text-base md:text-lg backdrop-blur-md transition-all duration-300 hover:bg-white/15 active:scale-95 flex items-center justify-center gap-2"
            >
              {t.hero.cta_github}
              <ExternalLinkWrapper />
            </a>
          </div>
        </div>

        {/* App Showcase Presentation */}
        <div className="relative max-w-6xl mx-auto px-4 animate-fade-in" style={{ animationDelay: '0.8s' }}>
            <div className="relative rounded-2xl md:rounded-3xl border border-white/10 bg-apple-gray-900/50 backdrop-blur-xl shadow-2xl overflow-hidden min-h-[400px] md:min-h-[500px] flex flex-col md:flex-row">
                 {/* Sidebar / Tabs */}
                 <div className="md:w-1/3 p-4 md:p-8 border-b md:border-b-0 md:border-r border-white/5 flex flex-col justify-center space-y-4 md:space-y-6 bg-white/5">
                    <div className="space-y-2">
                        <h3 className="text-xs md:text-sm font-semibold text-apple-blue uppercase tracking-widest">Overview</h3>
                        <h2 className="text-xl md:text-3xl font-display font-bold text-white">How it works</h2>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                        {[
                            { title: 'Smart Dashboard', desc: 'Your productivity at a glance.', icon: <Activity className="w-4 h-4 md:w-5 md:h-5"/> },
                            { title: 'Privacy First', desc: 'Data stays on your device.', icon: <Shield className="w-4 h-4 md:w-5 md:h-5"/> },
                            { title: 'Auto-Categorization', desc: 'AI-powered sorting.', icon: <Sparkles className="w-4 h-4 md:w-5 md:h-5"/> }
                        ].map((item, i) => (
                            <div key={i} className="group p-3 md:p-4 rounded-xl cursor-default transition-all duration-300 hover:bg-white/5 border border-transparent hover:border-white/5">
                                <div className="flex items-center gap-2 md:gap-3 mb-2 text-white group-hover:text-apple-blue transition-colors">
                                    {item.icon}
                                    <span className="font-bold text-sm md:text-base">{item.title}</span>
                                </div>
                                <p className="text-xs md:text-sm text-apple-gray-400 pl-7 md:pl-8">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                 </div>

                 {/* Visual Area */}
                 <div className="md:w-2/3 relative bg-gradient-to-br from-apple-gray-900 to-black flex items-center justify-center p-4 md:p-8 overflow-hidden group">
                     {/* Background Glow */}
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-96 md:h-96 bg-apple-blue/10 rounded-full blur-[80px] md:blur-[100px] group-hover:bg-apple-blue/20 transition-all duration-700"></div>

                     {/* Placeholder for Screenshots/Graphics */}
                     <div className="relative z-10 w-full max-w-sm md:max-w-md aspect-square rounded-xl md:rounded-2xl bg-black/40 border border-white/10 shadow-2xl flex items-center justify-center backdrop-blur-sm transform group-hover:scale-105 transition-transform duration-700">
                        <div className="text-center p-4 md:p-6">
                            <Layout className="w-12 h-12 md:w-16 md:h-16 text-white/20 mx-auto mb-3 md:mb-4" />
                            <p className="text-sm md:text-base text-apple-gray-500 font-medium">Interactive Demo UI</p>
                            <p className="text-xs text-apple-gray-600 mt-2">Screenshots will appear here</p>
                        </div>

                        {/* Floating elements decoration - hidden on mobile */}
                        <div className="hidden sm:block absolute -right-8 md:-right-12 top-8 md:top-12 w-20 h-20 md:w-24 md:h-24 bg-apple-gray-800/80 rounded-xl border border-white/10 shadow-xl backdrop-blur-md animate-float-delayed"></div>
                        <div className="hidden sm:block absolute -left-4 md:-left-8 bottom-8 md:bottom-12 w-40 md:w-48 h-12 md:h-16 bg-apple-gray-800/80 rounded-xl border border-white/10 shadow-xl backdrop-blur-md animate-float flex items-center px-3 md:px-4 gap-2 md:gap-3">
                             <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                 <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-emerald-400" />
                             </div>
                             <div className="h-1.5 md:h-2 w-16 md:w-20 bg-white/10 rounded-full"></div>
                        </div>
                     </div>
                 </div>
            </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-0">
        <div className="mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4 md:mb-6">Designed for <span className="text-apple-blue">Performance</span>.</h2>
            <p className="text-base md:text-xl text-apple-gray-400 max-w-2xl">{t.features.title}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[250px] md:auto-rows-[300px]">
          <BentoCard
            className="md:col-span-2 md:row-span-1"
            title={t.features.realtime_title}
            desc={t.features.realtime_desc}
            icon={<Clock className="w-6 h-6 md:w-8 md:h-8" />}
          />
          <BentoCard
            className="md:col-span-1"
            title={t.features.privacy_title}
            desc={t.features.privacy_desc}
            icon={<Shield className="w-6 h-6 md:w-8 md:h-8 text-emerald-400" />}
          />
          <BentoCard
            className="md:col-span-1"
            title={t.features.analytics_title}
            desc={t.features.analytics_desc}
            icon={<BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />}
          />
           <BentoCard
            className="md:col-span-2"
            title={t.features.crossplatform_title}
            desc={t.features.crossplatform_desc}
            icon={<Layout className="w-6 h-6 md:w-8 md:h-8 text-sky-400" />}
          />
        </div>
      </section>

      {/* Detailed Platform Section */}
      <section className="relative py-16 md:py-32 bg-apple-gray-900/30 border-y border-white/5 backdrop-blur-sm">
         <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-8 md:gap-16">
            <div className="md:w-1/2 w-full">
                 <h3 className="text-xs md:text-sm font-semibold text-apple-blue uppercase tracking-widest mb-4">Cross Platform</h3>
                 <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-4 md:mb-6">Everywhere you work.</h2>
                 <p className="text-base md:text-lg text-apple-gray-400 leading-relaxed mb-6 md:mb-8">
                     Whether you are on Windows, macOS, or Linux, TimiGS provides a seamless and native experience.
                     Synced locally or via your own cloud.
                 </p>
                 <div className="flex flex-wrap gap-2 md:gap-4">
                     {['Windows', 'macOS', 'Linux'].map(os => (
                         <div key={os} className="px-4 md:px-6 py-2 md:py-3 rounded-xl bg-white/5 border border-white/10 text-white font-medium text-sm md:text-base">
                             {os}
                         </div>
                     ))}
                 </div>
            </div>
            <div className="md:w-1/2 relative h-[250px] md:h-[400px] w-full bg-gradient-to-br from-apple-blue/20 to-purple-500/20 rounded-2xl md:rounded-3xl overflow-hidden glass flex items-center justify-center">
                 <Activity className="w-20 h-20 md:w-32 md:h-32 text-white/20" />
            </div>
         </div>
      </section>

      {/* CTA Section */}
      <section className="text-center py-16 md:py-32 max-w-4xl mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-display font-bold text-white mb-6 md:mb-8 tracking-tighter px-2">
            Ready to dive in?
        </h2>
        <div className="flex flex-col items-center gap-4 md:gap-6">
            <a
              href={`/${lang}/download`}
              className="group w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 rounded-full bg-apple-blue text-white font-bold text-base md:text-xl shadow-2xl shadow-apple-blue/30 hover:shadow-apple-blue/50 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 md:gap-3"
            >
              <Download className="w-5 h-5 md:w-6 md:h-6" />
              {t.hero.cta_download}
            </a>
            <p className="text-apple-gray-500 text-xs md:text-sm">Open Source • Free Forever • No Data Collection</p>
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
