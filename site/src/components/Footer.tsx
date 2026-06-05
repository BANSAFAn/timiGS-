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
    <footer ref={ref} className="w-full mt-auto border-t border-border bg-bg-secondary relative z-20 overflow-hidden notranslate">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 relative z-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
        
        {/* Top CTA Banner */}
        <div className="mb-16 p-8 relative rounded-2xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 to-brand-secondary/10 overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-r from-brand-500/5 to-transparent" />
           
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
             <div>
               <div className="badge inline-flex mb-3">
                 <span>Get Started</span>
               </div>
               <h3 className="text-2xl font-display font-bold mb-2">Ready to track smarter?</h3>
               <p className="text-sm text-text-secondary">Deploy open source tracker globally.</p>
             </div>
             <a
               href="/en/download"
               className="btn-primary"
             >
               <span>Download Now</span>
               <ArrowRight className="w-4 h-4" />
             </a>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand Col */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl font-display font-black tracking-tight">TimiGS</span>
              <span className="px-2 py-0.5 rounded-full border border-border text-xs font-medium text-text-tertiary bg-bg-tertiary">v2.0</span>
            </div>
            <p className="text-text-secondary text-sm leading-relaxed mb-8 border-l-2 border-border pl-4">
              Advanced time tracking system.<br/>
              Platform agnostic. High privacy compliance.
            </p>
            
            <div className="flex gap-3">
              <a href="https://github.com/BANSAFAn/timiGS-" target="_blank" rel="noopener noreferrer" className="p-3 rounded-lg bg-bg-tertiary border border-border text-text-secondary hover:text-text-primary hover:border-brand-500 transition-all">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://discord.gg/78V2c4bdpj" target="_blank" rel="noopener noreferrer" className="p-3 rounded-lg bg-bg-tertiary border border-border text-text-secondary hover:text-[#5865F2] hover:border-[#5865F2] transition-all">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
              </a>
              {stars !== null && (
                <a href="https://github.com/BANSAFAn/timiGS-" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-accent-orange hover:border-accent-orange/50 hover:bg-accent-orange/10 transition-colors">
                   <Star className="w-4 h-4 fill-current" />
                   {stars}
                </a>
              )}
            </div>
          </div>

          {/* Links Cols */}
          <div className="md:col-span-3 md:col-start-7">
            <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-6">Operations</h4>
            <ul className="space-y-3">
              {['Download', 'Releases', 'Docs', 'Testing'].map(item => (
                <li key={item}>
                  <a href={`/en/${item.toLowerCase()}`} className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-2 group transition-colors">
                     <span className="text-brand-500 opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0">›</span>
                     {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="md:col-span-3">
             <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-6">Network</h4>
             <ul className="space-y-3">
               <li>
                 <a href="https://github.com/BANSAFAn/timiGS-" target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-2 group transition-colors">
                   <span className="text-brand-500 opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0">›</span>
                   Repository <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                 </a>
               </li>
               <li>
                 <a href="https://github.com/BANSAFAn/timiGS-/issues" target="_blank" rel="noopener noreferrer" className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-2 group transition-colors">
                   <span className="text-brand-500 opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0">›</span>
                   Report Issue <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                 </a>
               </li>
               <li>
                 <a href="/en/terms" className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-2 group transition-colors">
                   <span className="text-brand-500 opacity-0 -ml-4 transition-all group-hover:opacity-100 group-hover:ml-0">›</span>
                   Terms
                 </a>
               </li>
             </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-2 text-xs text-text-tertiary">
              <span className="w-2 h-2 bg-accent-green rounded-full" />
              © {currentYear} TimiGS
           </div>
           
           <div className="flex items-center gap-2 text-xs text-text-tertiary">
             Made with <Heart className="w-3.5 h-3.5 text-accent-pink fill-accent-pink" /> by 
             <a href="https://github.com/BANSAFAn" target="_blank" rel="noopener noreferrer" className="text-text-primary border-b border-border hover:border-brand-500 hover:text-brand-500 transition-colors">BANSAFAn</a>
           </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;