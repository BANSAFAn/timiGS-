import React, { useState, useEffect } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import { Language } from "../../i18n/types";
import type { Translation } from "../../i18n/types";
import { GitBranch, Star, BookOpen, DownloadSimple, CheckCircle, WarningCircle, ArrowsClockwise } from "@phosphor-icons/react";

interface ReleaseProps {
  lang: Language;
  t: Translation;
}

const ReleasesPage: React.FC<ReleaseProps> = ({ t }) => {
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://api.github.com/repos/BANSAFAn/timiGS-/releases?per_page=10")
      .then((res) => res.json())
      .then((data) => setReleases(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching releases:", err))
      .finally(() => setLoading(false));

    marked.setOptions({
      highlight: function (code, lang) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
    } as any);
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')} ${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')} UTC`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-12 relative">
       {/* Background Decor */}
       <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-cyber-purple opacity-[0.02] blur-[150px] rounded-full pointer-events-none" />

       {/* Header */}
       <div className="mb-16 relative z-10 animate-fade-in-up">
         <div className="hud-label text-cyber-purple mb-4 flex items-center gap-2">
            <GitBranch className="w-4 h-4" /> [SYS.CHANGELOG]
         </div>
         <h1 className="text-4xl md:text-5xl font-display font-black text-white uppercase tracking-tight mb-4">
           {t.nav.releases}
         </h1>
         <p className="text-sm font-mono text-gray-400 border-l border-[rgba(255,255,255,0.1)] pl-4">
           Complete history of system updates, patches, and feature additions.
         </p>
       </div>

       {loading ? (
         <div className="flex flex-col items-center justify-center p-20 gap-6">
           <ArrowsClockwise className="w-10 h-10 text-cyber-purple animate-spin-slow" />
           <div className="hud-label animate-pulse text-cyber-purple">FETCHING_RELEASE_HISTORY</div>
         </div>
       ) : (
         <div className="relative">
           {/* Cyber Timeline Line */}
           <div className="absolute top-4 left-[20px] bottom-0 w-[2px] bg-gradient-to-b from-[rgba(168,85,247,0.5)] via-[rgba(6,245,214,0.3)] to-transparent" />

           <div className="space-y-16">
             {releases.map((release, index) => (
               <div key={release.id} className="relative pl-14 sm:pl-16 animate-fade-in-up group" style={{ animationDelay: `${index * 100}ms` }}>
                  
                  {/* Timeline node */}
                  <div className="absolute left-[11px] top-4 w-[20px] h-[20px] rounded border-2 border-cyber-bg bg-cyber-purple group-hover:bg-cyber-cyan transition-colors z-10 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-white shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
                  </div>

                  <div className="cyber-card p-6 sm:p-8">
                     <div className="corner-brackets absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                     {/* Release Header */}
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-[rgba(255,255,255,0.05)]">
                       <div>
                         <div className="flex items-center gap-3 mb-2">
                           <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider group-hover:text-cyber-cyan transition-colors">
                             {release.name || release.tag_name}
                           </h2>
                         </div>
                         <div className="flex items-center gap-3 font-mono text-[10px] text-gray-500 uppercase tracking-widest">
                           {release.prerelease ? (
                              <span className="text-cyber-amber flex items-center gap-1 bg-cyber-amber/10 px-2 py-0.5 rounded border border-cyber-amber/20"><WarningCircle /> PRE-RELEASE</span>
                           ) : (
                              <span className="text-cyber-green flex items-center gap-1 bg-cyber-green/10 px-2 py-0.5 rounded border border-cyber-green/20"><CheckCircle /> LATEST_STABLE</span>
                           )}
                           <span>{formatDate(release.published_at)}</span>
                         </div>
                       </div>
                       <a
                         href={release.html_url}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="flex items-center gap-2 px-4 py-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)] rounded-md font-mono text-xs text-gray-300 hover:text-white hover:border-[rgba(168,85,247,0.5)] transition-all"
                       >
                         <Star className="w-4 h-4" /> GitHub
                       </a>
                     </div>

                     {/* Release Body (Markdown) */}
                     <div 
                       className="prose prose-invert prose-p:text-gray-300 prose-p:font-mono prose-p:text-sm prose-a:text-cyber-purple hover:prose-a:text-cyber-cyan prose-headings:font-display prose-headings:uppercase prose-headings:tracking-wide max-w-none"
                       dangerouslySetInnerHTML={{ __html: marked.parse(release.body || "*No release notes provided.*") }}
                     />

                     {/* Assets */}
                     {release.assets && release.assets.length > 0 && (
                       <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.05)]">
                          <div className="text-[10px] font-mono text-gray-500 tracking-widest mb-4">DEPLOYMENT_ASSETS</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {release.assets.map((asset: any) => (
                              <a
                                key={asset.id}
                                href={asset.browser_download_url}
                                className="group/asset flex items-center justify-between p-3 rounded-lg border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(168,85,247,0.05)] hover:border-[rgba(168,85,247,0.3)] transition-all"
                              >
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <DownloadSimple className="w-4 h-4 text-gray-500 group-hover/asset:text-cyber-purple shrink-0" />
                                  <span className="font-mono text-xs text-gray-300 truncate">{asset.name}</span>
                                </div>
                                <span className="font-mono text-[10px] text-gray-500 shrink-0 ml-2 bg-[rgba(0,0,0,0.3)] px-1.5 py-0.5 rounded">
                                  {formatSize(asset.size)}
                                </span>
                              </a>
                            ))}
                          </div>
                       </div>
                     )}
                  </div>
               </div>
             ))}
           </div>
         </div>
       )}
    </div>
  );
};

export default ReleasesPage;