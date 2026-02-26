import React, { useState, useEffect } from 'react';
import { Github, Heart, Star, ExternalLink } from 'lucide-react';
import type { Translation } from '../i18n/types';

interface FooterProps {
    t: Translation;
}

const Footer: React.FC<FooterProps> = ({ t }) => {
  const currentYear = new Date().getFullYear();
  const [stars, setStars] = useState<number | null>(null);

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
    <footer className="w-full mt-auto border-t border-white/5 bg-apple-gray-950/30 backdrop-blur-sm md:backdrop-blur-xl z-20 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-12 mb-12 sm:mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <span className="text-lg sm:text-xl font-display font-bold text-white tracking-tight">TimiGS</span>
            </div>
            <p className="text-apple-gray-400 text-xs sm:text-sm leading-relaxed max-w-sm mb-6 sm:mb-8 font-medium">
              Intelligent activity tracker for Windows, Linux, and macOS.
              Designed for privacy and performance.
            </p>

            {/* Social links */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://github.com/BANSAFAn/timiGS-"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300"
              >
                <Github className="w-5 h-5 text-apple-gray-400 group-hover:text-white transition-colors" />
              </a>
              {stars !== null && (
                <a
                  href="https://github.com/BANSAFAn/timiGS-"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300"
                >
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium text-white">{stars.toLocaleString()}</span>
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[10px] sm:text-xs font-semibold text-apple-gray-500 uppercase tracking-widest mb-4 sm:mb-6">Product</h4>
            <ul className="space-y-3 sm:space-y-4">
              {['Download', 'Releases', 'Features'].map((item) => (
                <li key={item}>
                  <a href={`/en/${item.toLowerCase()}`} className="text-apple-gray-400 hover:text-apple-blue text-xs sm:text-sm font-medium transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-[10px] sm:text-xs font-semibold text-apple-gray-500 uppercase tracking-widest mb-4 sm:mb-6">Resources</h4>
             <ul className="space-y-3 sm:space-y-4">
              <li>
                <a href="https://github.com/BANSAFAn/timiGS-" className="text-apple-gray-400 hover:text-apple-blue text-xs sm:text-sm font-medium transition-colors">
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://github.com/BANSAFAn/timiGS-/issues" className="text-apple-gray-400 hover:text-apple-blue text-xs sm:text-sm font-medium transition-colors">
                  Report Issue
                </a>
              </li>
              <li>
                <a href="/en/terms" className="text-apple-gray-400 hover:text-apple-blue text-xs sm:text-sm font-medium transition-colors">
                  Terms & Privacy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 sm:pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-apple-gray-500 text-xs font-medium text-center md:text-left">
            © {currentYear} TimiGS. {t.footer.rights}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-apple-gray-500 font-medium">
            <span>Designed by</span>
            <a
              href="https://github.com/BANSAFAn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-apple-blue transition-colors"
            >
              BANSAFAn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;