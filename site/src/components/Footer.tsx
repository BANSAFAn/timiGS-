import React, { useState, useEffect, useRef } from 'react';
import { GithubLogo as Github, Heart, Star, ArrowUpRight as ExternalLink, ArrowRight, GitCommit } from '@phosphor-icons/react';
import type { Translation } from '../i18n/types';

interface FooterProps {
    t: Translation;
}

/* ── Scroll reveal ── */
function useInView(threshold = 0.1) {
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

const Footer: React.FC<FooterProps> = ({ t }) => {
  const currentYear = new Date().getFullYear();
  const [stars, setStars] = useState<number | null>(null);
  const { ref, visible } = useInView(0.05);

  useEffect(() => {
    fetch('https://api.github.com/repos/BANSAFAn/timiGS-')
      .then(res => res.json())
      .then(data => {
        if (data.stargazers_count !== undefined) {
          setStars(data.stargazers_count);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <footer ref={ref} className="w-full mt-auto border-t border-[rgba(6,245,214,0.1)] bg-cyber-bg relative z-20 overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
      
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 relative z-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        
        {/* Top CTA Banner */}
        <div className="mb-16 p-8 relative rounded-xl border border-[rgba(168,85,247,0.2)] bg-[rgba(10,10,18,0.8)] overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-r from-[rgba(168,85,247,0.05)] to-transparent" />
           <div className="absolute top-0 left-0 w-[2px] h-full bg-gradient-to-b from-cyber-cyan to-cyber-purple opacity-50 shadow-[0_0_10px_rgba(6,245,214,0.5)]" />
           
           {/* Cyber corners */}
           <div className="corner-brackets absolute inset-0 pointer-events-none" />
           
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
             <div>
               <div className="hud-label tracking-[3px] mb-2 text-cyber-purple">SYS_INIT_SEQUENCE</div>
               <h3 className="text-2xl font-display font-bold text-white mb-1 tracking-wide">Ready to track smarter?</h3>
               <p className="text-sm font-mono text-gray-400">Deploy open source tracker globally.</p>
             </div>
             <a
               href="/en/download"
               className="cyber-btn-primary items-center justify-center min-w-[200px]"
             >
               <span className="font-mono tracking-widest uppercase text-xs">Execute // DL</span>
               <ArrowRight className="w-4 h-4 ml-2" />
             </a>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand Col */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl font-display font-black text-white tracking-widest uppercase text-shadow-glow">TimiGS</span>
              <span className="px-2 py-0.5 rounded border border-[rgba(255,255,255,0.1)] text-[10px] font-mono text-gray-400 bg-[rgba(255,255,255,0.05)]">v2.0_STABLE</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 font-mono border-l-2 border-[rgba(255,255,255,0.1)] pl-4">
              Advanced cyber-metric tracking subsystem.<br/>
              Platform agnostic. High privacy compliance.
            </p>
            
            <div className="flex gap-4">
              <a href="https://github.com/BANSAFAn/timiGS-" target="_blank" rel="noopener noreferrer" className="p-3 rounded-md bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)] text-gray-400 hover:text-cyber-cyan hover:border-[rgba(6,245,214,0.4)] hover:shadow-[0_0_15px_rgba(6,245,214,0.1)] transition-all">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://discord.gg/78V2c4bdpj" target="_blank" rel="noopener noreferrer" className="p-3 rounded-md bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)] text-gray-400 hover:text-[#5865F2] hover:border-[#5865F2] hover:shadow-[0_0_15px_rgba(88,101,242,0.2)] transition-all">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
              </a>
              {stars !== null && (
                <a href="https://github.com/BANSAFAn/timiGS-" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono border border-[rgba(255,255,255,0.1)] text-amber-500 hover:border-amber-500/50 hover:bg-amber-500/10 transition-colors">
                   <Star className="w-4 h-4 fill-current" />
                   {stars}
                </a>
              )}
            </div>
          </div>

          {/* Links Cols */}
          <div className="md:col-span-3 md:col-start-7">
            <h4 className="font-mono text-xs text-cyber-cyan font-bold tracking-[2px] uppercase mb-6">Operations</h4>
            <ul className="space-y-4">
              {['Download', 'Releases', 'Documentation', 'Testing'].map(item => (
                <li key={item}>
                  <a href={`/en/${item.toLowerCase()}`} className="text-sm font-mono text-gray-400 hover:text-white flex items-center gap-2 group transition-colors">
                     <span className="text-cyber-cyan opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0">›</span>
                     {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="md:col-span-3">
             <h4 className="font-mono text-xs text-cyber-purple font-bold tracking-[2px] uppercase mb-6">Network</h4>
             <ul className="space-y-4">
               <li>
                 <a href="https://github.com/BANSAFAn/timiGS-" target="_blank" rel="noopener noreferrer" className="text-sm font-mono text-gray-400 hover:text-white flex items-center gap-2 group transition-colors">
                   <span className="text-cyber-purple opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0">›</span>
                   Repository <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                 </a>
               </li>
               <li>
                 <a href="https://github.com/BANSAFAn/timiGS-/issues" target="_blank" rel="noopener noreferrer" className="text-sm font-mono text-gray-400 hover:text-white flex items-center gap-2 group transition-colors">
                   <span className="text-cyber-purple opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0">›</span>
                   Report Issue <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                 </a>
               </li>
               <li>
                 <a href="/en/terms" className="text-sm font-mono text-gray-400 hover:text-white flex items-center gap-2 group transition-colors">
                   <span className="text-cyber-purple opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0">›</span>
                   Intellectual Property
                 </a>
               </li>
             </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-[rgba(255,255,255,0.05)] flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-2 font-mono text-[10px] text-gray-500 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-cyber-green rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              SYSTEM_ONLINE // © {currentYear} TIMIGS
           </div>
           
           <div className="flex items-center gap-2 font-mono text-xs text-gray-500">
             Compiled with <Heart className="w-3.5 h-3.5 text-cyber-red fill-cyber-red animate-pulse" /> by 
             <a href="https://github.com/BANSAFAn" target="_blank" rel="noopener noreferrer" className="text-white border-b border-[rgba(255,255,255,0.2)] hover:border-cyber-cyan hover:text-cyber-cyan transition-colors">BANSAFAn</a>
           </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;