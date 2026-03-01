import React, { useState, useEffect, useRef } from 'react';
import { Github, Heart, Star, ExternalLink, ArrowRight } from 'lucide-react';
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
    <footer ref={ref} className="w-full mt-auto border-t border-white/[0.04] bg-apple-gray-950/50 backdrop-blur-xl z-20 relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-apple-gray-950/80 to-transparent pointer-events-none" />

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-16 sm:py-20 relative z-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>

        {/* Top CTA banner */}
        <div className="mb-16 p-8 sm:p-10 rounded-2xl bg-gradient-to-r from-apple-blue/[0.06] to-purple-500/[0.06] border border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-display font-bold text-white mb-1">Ready to track smarter?</h3>
            <p className="text-sm text-apple-gray-400">Open source, free forever. Join the community.</p>
          </div>
          <a
            href="/en/download"
            className="group flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-gray-100 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] shadow-lg whitespace-nowrap"
          >
            Get Started
            <ArrowRight className="w-4 h-4 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 sm:gap-12 mb-14">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-xl font-display font-bold text-white tracking-tight">TimiGS</span>
            </div>
            <p className="text-apple-gray-400 text-sm leading-relaxed max-w-sm mb-7 font-medium">
              Intelligent activity tracker for Windows, Linux, and macOS.
              Designed for privacy and performance.
            </p>

            {/* Social links */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://github.com/BANSAFAn/timiGS-"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2.5 rounded-full bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-300"
              >
                <Github className="w-5 h-5 text-apple-gray-400 group-hover:text-white transition-colors" />
              </a>
              {stars !== null && (
                <a
                  href="https://github.com/BANSAFAn/timiGS-/stargazers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-300"
                >
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium text-white">{stars.toLocaleString()}</span>
                </a>
              )}
              <a
                href="https://discord.gg/78V2c4bdpj"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-2.5 rounded-full bg-white/[0.04] border border-white/[0.06] hover:bg-[#5865F2]/20 hover:border-[#5865F2]/50 transition-all duration-300"
                title="Join Discord Server"
              >
                <svg className="w-5 h-5 text-apple-gray-400 group-hover:text-[#5865F2] fill-current transition-colors" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-bold text-apple-gray-500 uppercase tracking-[0.15em] mb-5">Product</h4>
            <ul className="space-y-3.5">
              {[
                { label: 'Download', href: '/en/download' },
                { label: 'Releases', href: '/en/releases' },
                { label: 'Documentation', href: '/en/docs' },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-apple-gray-400 hover:text-white text-sm font-medium transition-colors duration-200">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-bold text-apple-gray-500 uppercase tracking-[0.15em] mb-5">Resources</h4>
            <ul className="space-y-3.5">
              <li>
                <a href="https://github.com/BANSAFAn/timiGS-" target="_blank" rel="noopener noreferrer" className="text-apple-gray-400 hover:text-white text-sm font-medium transition-colors duration-200 inline-flex items-center gap-1.5">
                  GitHub
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </li>
              <li>
                <a href="https://github.com/BANSAFAn/timiGS-/issues" target="_blank" rel="noopener noreferrer" className="text-apple-gray-400 hover:text-white text-sm font-medium transition-colors duration-200 inline-flex items-center gap-1.5">
                  Report Issue
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              </li>
              <li>
                <a href="/en/terms" className="text-apple-gray-400 hover:text-white text-sm font-medium transition-colors duration-200">
                  Terms & Privacy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-7 border-t border-white/[0.04] flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-apple-gray-500 text-xs font-medium text-center md:text-left">
            © {currentYear} TimiGS. {t.footer.rights}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-apple-gray-500 font-medium">
            <span>Designed with</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>by</span>
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