import React, { useState, useEffect } from 'react';
import { Github, Heart, Star, ExternalLink } from 'lucide-react';
import type { Translation } from '../i18n/types';

interface FooterProps {
    t: Translation;
}

const Footer: React.FC<FooterProps> = ({ t }) => {
  const currentYear = new Date().getFullYear();
  const [stars, setStars] = useState<number | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('https://api.github.com/repos/BANSAFAn/timiGS-')
      .then(res => res.json())
      .then(data => {
        if (data.stargazers_count !== undefined) {
          setStars(data.stargazers_count);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return (
    <footer className="w-full mt-auto border-t border-slate-800/50 bg-gradient-to-b from-slate-950/50 to-slate-950 backdrop-blur-xl z-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-br from-sky-500/20 to-purple-500/10 rounded-xl">
                <svg className="w-6 h-6 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
              </div>
              <span className="text-xl font-black text-white tracking-tight">TimiGS</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md mb-6">
              Intelligent activity tracker for Windows, Linux, and macOS. 
              Track your productivity with beautiful analytics and complete privacy.
            </p>
            
            {/* Social links */}
            <div className="flex items-center gap-3">
              <a 
                href="https://github.com/BANSAFAn/timiGS-" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all hover:bg-slate-800"
              >
                <Github className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
              </a>
              {loaded && stars !== null && (
                <a 
                  href="https://github.com/BANSAFAn/timiGS-" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-yellow-500/30 transition-all hover:bg-slate-800"
                >
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-bold text-white">{stars.toLocaleString()}</span>
                  <span className="text-xs text-slate-500">stars</span>
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <a href="/en/download" className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                  Download
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a href="/en/releases" className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                  Releases
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a href="https://github.com/BANSAFAn/timiGS-#features" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                  Features
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-3">
              <li>
                <a href="https://github.com/BANSAFAn/timiGS-" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                  GitHub
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a href="https://github.com/BANSAFAn/timiGS-/issues" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                  Report Issue
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a href="/en/terms" className="text-slate-400 hover:text-white text-sm transition-colors flex items-center gap-2 group">
                  Terms & Privacy
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-slate-500 text-sm">
            © {currentYear} TimiGS. {t.footer.rights}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
            <span>by</span>
            <a 
              href="https://github.com/BANSAFAn" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 font-medium transition-colors"
            >
              BANSAFAn
            </a>
          </div>

          <div className="text-slate-600 text-xs">
            {t.footer.built_with}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;