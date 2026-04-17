import React, { useState, useEffect } from "react";
import { Language } from "../../i18n/types";
import type { Translation } from "../../i18n/types";
import { GitCommit, GitPullRequest, GitMerge, FileZip, TerminalWindow, Warning, ArrowSquareOut, Checks } from "@phosphor-icons/react";

interface TestingProps {
  lang: Language;
  t: Translation;
}

const TestingPage: React.FC<TestingProps> = ({ t }) => {
  const [commits, setCommits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://api.github.com/repos/BANSAFAn/timiGS-/commits?per_page=20")
      .then((res) => res.json())
      .then((data) => setCommits(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching commits:", err))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')} ${d.getUTCDate()}/${d.getUTCMonth()+1}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-12 relative">
      {/* Header */}
      <div className="mb-12 relative z-10 animate-fade-in-up">
         <div className="hud-label text-cyber-red mb-4 flex items-center gap-2">
            <Warning className="w-4 h-4" /> [SYS.UNSTABLE_BUILD]
         </div>
         <h1 className="text-4xl md:text-5xl font-display font-black text-white uppercase tracking-tight mb-4">
           {t.nav.testing}
         </h1>
         <p className="text-sm font-mono text-cyber-red max-w-2xl border-l-2 border-cyber-red pl-4 bg-cyber-red/5 py-2">
           WARNING: Experimental subsystem branches. Use at your own risk. Data loss or unexpected metrics may occur.
         </p>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
         {/* Live Terminal Commits */}
         <div className="md:col-span-8">
            <div className="rounded-xl border border-[rgba(255,255,255,0.1)] bg-[#0a0a0f] overflow-hidden shadow-2xl relative">
               
               {/* Terminal Header */}
               <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)]">
                  <div className="flex items-center gap-2">
                     <TerminalWindow className="w-4 h-4 text-gray-500" />
                     <span className="font-mono text-[10px] text-gray-400">root@timigs:~# git log --oneline</span>
                  </div>
                  <div className="flex gap-1.5 ">
                     <div className="w-3 h-3 rounded-full bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(239,68,68,0.8)] transition-colors cursor-pointer" />
                     <div className="w-3 h-3 rounded-full bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(245,158,11,0.8)] transition-colors cursor-pointer" />
                     <div className="w-3 h-3 rounded-full bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(16,185,129,0.8)] transition-colors cursor-pointer" />
                  </div>
               </div>

               {/* Terminal Body */}
               <div className="p-4 font-mono text-xs sm:text-sm h-[600px] overflow-y-auto cyber-scrollbar">
                 {loading ? (
                    <div className="text-cyber-cyan animate-pulse">Establishing connection to origin/main...</div>
                 ) : (
                    <div className="space-y-1">
                      {commits.map((commit, i) => (
                        <div key={commit.sha} className="flex gap-4 group hover:bg-[rgba(255,255,255,0.02)] -mx-4 px-4 py-1 transition-colors">
                           <a href={commit.html_url} target="_blank" rel="noopener noreferrer" className="text-cyber-amber min-w-[70px] hover:underline">
                              {commit.sha.substring(0, 7)}
                           </a>
                           <div className="text-gray-500 min-w-[80px]">{formatDate(commit.commit.author.date)}</div>
                           <div className="text-gray-300 truncate group-hover:text-white transition-colors flex-1" title={commit.commit.message}>
                              {commit.commit.message.split("\n")[0]}
                           </div>
                           <div className="text-gray-600 hidden sm:block w-[100px] truncate text-right">
                              {commit.commit.author.name}
                           </div>
                        </div>
                      ))}
                    </div>
                 )}
               </div>
            </div>
         </div>

         {/* Actions & CI Status */}
         <div className="md:col-span-4 space-y-6">
            <div className="cyber-card p-6 border-cyber-red/30">
               <div className="hud-label text-cyber-red mb-4">ASSET_PULL</div>
               <h3 className="text-xl font-display font-bold text-white uppercase mb-2">Automated Builds</h3>
               <p className="font-mono text-xs text-gray-400 mb-6">Latest CI artifacts generated from origin/main.</p>
               
               <a href="https://github.com/BANSAFAn/timiGS-/actions" target="_blank" rel="noopener noreferrer" className="cyber-btn-ghost w-full justify-center text-cyber-red border-cyber-red/20 hover:border-cyber-red focus:bg-cyber-red/10">
                  <ArrowSquareOut className="w-4 h-4" /> Go to GitHub Actions
               </a>
            </div>

            <div className="p-6 border border-[rgba(255,255,255,0.05)] rounded-xl bg-[rgba(255,255,255,0.01)]">
               <div className="hud-label text-gray-500 mb-4">SYS_CHECKS</div>
               <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs">
                     <span className="text-gray-400 flex items-center gap-2"><Checks className="w-4 h-4 text-cyber-green" /> Build Master</span>
                     <span className="text-cyber-green">PASS</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs">
                     <span className="text-gray-400 flex items-center gap-2"><Checks className="w-4 h-4 text-cyber-green" /> Dependency Scan</span>
                     <span className="text-cyber-green">PASS</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs">
                     <span className="text-gray-400 flex items-center gap-2"><Warning className="w-4 h-4 text-cyber-amber" /> Tauri E2E</span>
                     <span className="text-cyber-amber">FLAKY</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default TestingPage;
