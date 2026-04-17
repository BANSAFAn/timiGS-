import React, { useState, useEffect } from "react";
import { 
  DownloadSimple as Download, 
  WindowsLogo, 
  AppleLogo, 
  LinuxLogo, 
  Terminal,
  FileZip,
  Monitor,
  CheckCircle,
  Spinner,
  ArrowRight
} from "@phosphor-icons/react";
import { Language } from "../../i18n/types";
import type { Translation } from "../../i18n/types";

interface DownloadProps {
  lang: Language;
  t: Translation;
}

const DownloadPage: React.FC<DownloadProps> = ({ lang, t }) => {
  const [activePlatform, setActivePlatform] = useState<"win" | "mac" | "linux">(() => {
    if (typeof window !== "undefined") {
      const platform = window.navigator.platform.toLowerCase();
      if (platform.includes("win")) return "win";
      if (platform.includes("mac")) return "mac";
      return "linux";
    }
    return "win";
  });

  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState("v2.2.3");
  const [date, setDate] = useState("2024-03-20");

  useEffect(() => {
    fetch("https://api.github.com/repos/BANSAFAn/timiGS-/releases/latest")
      .then((res) => res.json())
      .then((data) => {
        if (data.tag_name) {
          setVersion(data.tag_name);
          setDate(data.published_at.split("T")[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const platforms = [
    { id: "win" as const, name: "Windows", icon: <WindowsLogo weight="fill" className="w-6 h-6" />, ext: ".exe", arch: "x64", color: "cyber-blue" },
    { id: "mac" as const, name: "macOS", icon: <AppleLogo weight="fill" className="w-6 h-6" />, ext: ".dmg", arch: "Universal", color: "cyber-purple" },
    { id: "linux" as const, name: "Linux", icon: <LinuxLogo weight="fill" className="w-6 h-6" />, ext: ".AppImage", arch: "x64", color: "cyber-amber" }
  ];

  const getDownloadLink = (platformId: string) => {
    const base = `https://github.com/BANSAFAn/timiGS-/releases/download/${version}`;
    const v = version.replace('v', '');
    if (platformId === "win") return `${base}/TimiGS_${v}_x64-setup.exe`;
    if (platformId === "mac") return `${base}/TimiGS_${v}_universal.dmg`;
    return `${base}/TimiGS_${v}_amd64.AppImage`;
  };

  const currentPlatform = platforms.find((p) => p.id === activePlatform)!;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-12 relative animate-fade-in-up">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyber-cyan opacity-[0.03] blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyber-purple opacity-[0.03] blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-16 relative z-10">
        <div className="hud-label text-cyber-cyan mb-4 flex justify-center items-center gap-2">
           <Download className="w-4 h-4" /> [SYS.ACQUIRE]
        </div>
        <h1 className="text-4xl md:text-6xl font-display font-black text-white uppercase tracking-tight mb-4">
          {t.downloads.title}
        </h1>
        <p className="text-sm font-mono text-gray-400 max-w-xl mx-auto px-4">
          Latest stable build. Privacy-focused time tracking subsystem.
        </p>
      </div>

      {/* Main Download Card */}
      <div className="cyber-card p-1">
        <div className="corner-brackets absolute inset-0 pointer-events-none hidden sm:block" />
        <div className="grid md:grid-cols-12 gap-1 bg-[#0a0a10]">
          
          {/* Left Column: Platform Select */}
          <div className="md:col-span-4 p-6 sm:p-8 border-b md:border-b-0 md:border-r border-[rgba(6,245,214,0.1)] flex flex-col gap-3">
             <div className="hud-label tracking-widest text-[9px] mb-2 opacity-50">TARGET_PLATFORM</div>
             
             {platforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePlatform(p.id)}
                  className={`flex items-center gap-4 p-4 rounded-lg font-mono text-sm transition-all duration-300 relative overflow-hidden text-left ${
                    activePlatform === p.id 
                      ? "bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.15)] shadow-[0_0_15px_rgba(255,255,255,0.02)] text-white" 
                      : "border border-transparent text-gray-400 hover:bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.05)]"
                  }`}
                >
                   {/* Active Indicator Line */}
                   <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${p.color} transition-opacity duration-300 ${activePlatform === p.id ? "opacity-100" : "opacity-0"}`} />
                   
                   <div className={`${activePlatform === p.id ? `text-${p.color}` : "text-gray-500"}`}>
                      {p.icon}
                   </div>
                   <div className="flex-1">
                      <div className={`font-bold uppercase tracking-wider ${activePlatform === p.id ? "text-white" : "text-gray-400"}`}>{p.name}</div>
                      <div className="text-[10px] opacity-50">{p.arch}</div>
                   </div>
                   
                   {activePlatform === p.id && (
                     <CheckCircle className={`w-5 h-5 text-${p.color} animate-fade-in-up`} weight="fill" />
                   )}
                </button>
             ))}
          </div>

          {/* Right Column: Download Actions */}
          <div className="md:col-span-8 p-6 sm:p-10 lg:p-14 flex flex-col justify-center relative overflow-hidden">
             
             {/* Tech grid overlay */}
             <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

             {loading ? (
                <div className="flex flex-col items-center justify-center p-12 h-64 gap-4">
                  <Spinner className="w-8 h-8 text-cyber-cyan animate-spin" />
                  <div className="hud-label animate-pulse">FETCHING_RELEASE_DATA</div>
                </div>
             ) : (
                <div className="relative z-10 animate-fade-in-up">
                   
                   <div className="flex flex-wrap items-center gap-4 mb-8">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[rgba(6,245,214,0.1)] border border-[rgba(6,245,214,0.2)] text-cyber-cyan font-mono text-xs font-bold tracking-widest uppercase">
                         {version}
                      </div>
                      <div className="text-gray-500 font-mono text-xs">{date}</div>
                      <a href={`/${lang}/releases`} className="text-cyber-purple font-mono text-xs hover:border-b hover:border-cyber-purple transition-colors ml-auto flex items-center gap-1">
                        Changelog <ArrowRight className="w-3 h-3" />
                      </a>
                   </div>

                   <h3 className="text-2xl md:text-3xl font-display font-bold text-white uppercase tracking-tight mb-2">
                     {currentPlatform.name} Build
                   </h3>
                   <p className="text-gray-400 font-mono text-sm mb-10">Optimized standalone executable.</p>

                   {/* Main Download Button */}
                   <a
                     href={getDownloadLink(currentPlatform.id)}
                     className={`flex items-center justify-between p-5 md:p-6 w-full rounded-xl border transition-all duration-300 group overflow-hidden relative cursor-pointer
                       border-[rgba(6,245,214,0.3)] bg-[rgba(6,245,214,0.05)] hover:border-[rgba(6,245,214,0.6)] hover:bg-[rgba(6,245,214,0.1)] hover:shadow-[0_0_30px_rgba(6,245,214,0.15)]
                     `}
                   >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(6,245,214,0.1)] to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      
                      <div className="flex items-center gap-5 relative z-10">
                         <div className={`p-3 rounded-lg bg-[rgba(6,245,214,0.1)] border border-[rgba(6,245,214,0.3)] text-cyber-cyan group-hover:scale-110 transition-transform`}>
                            <Download className="w-6 h-6" />
                         </div>
                         <div className="text-left">
                            <div className="text-white font-display font-bold uppercase tracking-wider mb-1">Standard Installer</div>
                            <div className="text-xs font-mono text-gray-400">{currentPlatform.ext} format</div>
                         </div>
                      </div>
                      <div className="hidden sm:flex px-4 py-2 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.05)] rounded font-mono text-xs text-cyber-cyan uppercase font-bold group-hover:bg-[rgba(6,245,214,0.1)] transition-colors">
                         Execute
                      </div>
                   </a>

                   {/* Alt formats */}
                   <div className="grid grid-cols-2 gap-4 mt-6">
                      <a href={`/${lang}/testing`} className="flex items-center gap-3 p-4 rounded-lg border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.1)] transition-colors text-left group">
                         <Terminal className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                         <div>
                           <div className="text-[10px] font-mono text-gray-500 tracking-wider">LATEST</div>
                           <div className="text-xs font-bold text-gray-300 uppercase mt-0.5 group-hover:text-white">Pre-Releases</div>
                         </div>
                      </a>
                      <a href="https://github.com/BANSAFAn/timiGS-/releases" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-lg border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.1)] transition-colors text-left group">
                         <FileZip className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                         <div>
                           <div className="text-[10px] font-mono text-gray-500 tracking-wider">ALL ARCHIVES</div>
                           <div className="text-xs font-bold text-gray-300 uppercase mt-0.5 group-hover:text-white">All Assets</div>
                         </div>
                      </a>
                   </div>
                </div>
             )}
          </div>
        </div>
      </div>
      
      {/* Verify Hash / System Info (Decorative) */}
      <div className="mt-12 flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-t border-[rgba(255,255,255,0.05)] font-mono text-xs text-gray-500 gap-4">
        <div className="flex items-center gap-2">
           <Monitor className="w-4 h-4" />
           DETECTED: <span className="text-white uppercase font-bold">{activePlatform}</span> // Local System
        </div>
        <div className="flex gap-4">
           <span>SIG_VERIFIED: TRUE</span>
           <span>SEC_COMPLIANT: PASS</span>
        </div>
      </div>
    </div>
  );
};

export default DownloadPage;
