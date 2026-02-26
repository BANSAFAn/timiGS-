import React from "react";
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
} from "lucide-react";
import { Language } from "../../i18n/types";
import type { Translation } from "../../i18n/types";

interface HomeProps {
  lang: Language;
  t: Translation;
}

const Home: React.FC<HomeProps> = ({ lang, t }) => {
  return (
    <div className="space-y-20 md:space-y-28">
      {/* Hero Section */}
      <section className="relative pt-8 md:pt-16 pb-12 md:pb-20">
        <div className="animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white tracking-wide mb-6">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-apple-blue opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-apple-blue" />
            </span>
            Open Source • Free Forever
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight mb-6 text-white leading-[1.1]">
            Track Time.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-apple-blue to-purple-400">
              Master Focus.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-apple-gray-400 font-medium max-w-2xl mb-10 leading-relaxed">
            {t.hero.subtext}
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-3">
            <a
              href={`/${lang}/download`}
              className="px-8 py-4 rounded-2xl bg-white text-black font-semibold text-base transition-transform duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-white/10 flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              {t.hero.cta_download}
              <ChevronRight className="w-4 h-4 opacity-50" />
            </a>
            <a
              href="https://github.com/BANSAFAn/timiGS-"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-base hover:bg-white/10 transition-all flex items-center gap-2"
            >
              {t.hero.cta_github}
            </a>
          </div>
        </div>
      </section>

      {/* What Makes TimiGS Unique */}
      <section>
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
            What makes TimiGS <span className="text-apple-blue">unique</span>
          </h2>
          <p className="text-base text-apple-gray-400 max-w-2xl">{t.features.title}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              icon: <Focus className="w-6 h-6" />,
              title: "🎯 Focus Mode",
              desc: "Lock yourself into productive work. Block app switching with a password-protected Focus Mode that keeps you on task.",
              color: "text-rose-400",
              gradient: "from-rose-500/10 to-rose-500/5",
            },
            {
              icon: <Timer className="w-6 h-6" />,
              title: "⏰ Time OUT",
              desc: "Smart break reminders that protect your health. Set custom intervals and get notified when it's time to rest your eyes and stretch.",
              color: "text-amber-400",
              gradient: "from-amber-500/10 to-amber-500/5",
            },
            {
              icon: <CloudSun className="w-6 h-6" />,
              title: "🌦️ Built-in Weather",
              desc: "Weather widget right in your tracker. Auto-detect location or set manually — plan your day without leaving the app.",
              color: "text-sky-400",
              gradient: "from-sky-500/10 to-sky-500/5",
            },
            {
              icon: <HardDrive className="w-6 h-6" />,
              title: "☁️ Google Drive Sync",
              desc: "Back up and sync your activity data across devices via Google Drive. Your data, your cloud, your control.",
              color: "text-emerald-400",
              gradient: "from-emerald-500/10 to-emerald-500/5",
            },
            {
              icon: <Lock className="w-6 h-6" />,
              title: "🔒 100% Privacy",
              desc: "All data stored locally in SQLite. Zero telemetry, zero cloud uploads. You own every byte of your data.",
              color: "text-purple-400",
              gradient: "from-purple-500/10 to-purple-500/5",
            },
            {
              icon: <BarChart3 className="w-6 h-6" />,
              title: "📊 Rich Analytics",
              desc: "Beautiful Donut, Pie, and Bar charts. Day-by-day timeline view. Understand exactly where your time goes.",
              color: "text-blue-400",
              gradient: "from-blue-500/10 to-blue-500/5",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${feature.gradient} border border-white/5 p-6 transition-all duration-300 hover:border-white/10 hover:shadow-lg group`}
            >
              <div className="flex flex-col h-full">
                <h3 className="text-lg font-display font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-apple-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Competitor Comparison */}
      <section>
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
            How TimiGS <span className="text-emerald-400">compares</span>
          </h2>
          <p className="text-base text-apple-gray-400">See why developers and users choose TimiGS over alternatives.</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="text-left p-4 text-apple-gray-400 font-medium">Feature</th>
                <th className="p-4 text-center">
                  <span className="text-apple-blue font-bold text-base">TimiGS</span>
                </th>
                <th className="p-4 text-center text-apple-gray-400">RescueTime</th>
                <th className="p-4 text-center text-apple-gray-400">Toggl</th>
                <th className="p-4 text-center text-apple-gray-400">WakaTime</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: "Free Forever", timigs: true, rescue: false, toggl: "partial", waka: "partial" },
                { feature: "Open Source", timigs: true, rescue: false, toggl: false, waka: false },
                { feature: "Focus Mode", timigs: true, rescue: false, toggl: false, waka: false },
                { feature: "Local Data Storage", timigs: true, rescue: false, toggl: false, waka: false },
                { feature: "No Telemetry", timigs: true, rescue: false, toggl: false, waka: false },
                { feature: "Desktop App", timigs: true, rescue: true, toggl: true, waka: true },
                { feature: "Android App", timigs: "alpha", rescue: true, toggl: true, waka: false },
                { feature: "Break Reminders", timigs: true, rescue: false, toggl: false, waka: false },
                { feature: "Weather Widget", timigs: true, rescue: false, toggl: false, waka: false },
                { feature: "Google Drive Sync", timigs: true, rescue: false, toggl: false, waka: false },
              ].map((row, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-white font-medium">{row.feature}</td>
                  {[row.timigs, row.rescue, row.toggl, row.waka].map((val, j) => (
                    <td key={j} className="p-4 text-center">
                      {val === true ? (
                        <Check className={`w-5 h-5 mx-auto ${j === 0 ? 'text-emerald-400' : 'text-apple-gray-500'}`} />
                      ) : val === false ? (
                        <XIcon className="w-5 h-5 mx-auto text-apple-gray-700" />
                      ) : val === "alpha" ? (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">ALPHA</span>
                      ) : (
                        <span className="text-[10px] font-bold text-apple-gray-500 bg-white/5 px-2 py-0.5 rounded-full">PARTIAL</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Platform Section */}
      <section className="relative py-16 -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 px-4 sm:px-6 md:px-8 lg:px-12 bg-apple-gray-900/20 border-y border-white/5">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="md:w-1/2">
            <h3 className="text-xs font-semibold text-apple-blue uppercase tracking-widest mb-3">Cross Platform</h3>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">Everywhere you work.</h2>
            <p className="text-base text-apple-gray-400 leading-relaxed mb-6">
              Whether you're on Windows, macOS, Linux, or even Android — TimiGS provides a seamless, native experience with consistent tracking across all your devices.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { name: 'Windows', icon: <Monitor className="w-4 h-4" /> },
                { name: 'macOS', icon: <Laptop className="w-4 h-4" /> },
                { name: 'Linux', icon: <Activity className="w-4 h-4" /> },
                { name: 'Android', icon: <Smartphone className="w-4 h-4" />, badge: 'Alpha' },
              ].map(os => (
                <div key={os.name} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium">
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
          <div className="md:w-1/2 relative h-[200px] md:h-[280px] w-full bg-gradient-to-br from-apple-blue/10 to-purple-500/10 rounded-2xl overflow-hidden flex items-center justify-center border border-white/5">
            <div className="text-center">
              <Zap className="w-16 h-16 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-apple-gray-600 font-medium">Built with Tauri v2 + Flutter</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-16 max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6 tracking-tight">
          Ready to take control?
        </h2>
        <p className="text-apple-gray-400 mb-8">Open Source • Free Forever • No Data Collection</p>
        <a
          href={`/${lang}/download`}
          className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-apple-blue text-white font-bold text-lg shadow-2xl shadow-apple-blue/20 hover:shadow-apple-blue/40 hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <Download className="w-6 h-6" />
          {t.hero.cta_download}
        </a>
      </section>
    </div>
  );
};

export default Home;
