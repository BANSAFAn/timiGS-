import React, { useState, useEffect } from 'react';
import { Language } from '../i18n/types';
import type { Translation } from '../i18n/types';
import { List as Menu, X, GlobeHemisphereWest as Globe, Clock, Star, DownloadSimple as Download, ChatCircle as MessageSquare } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

interface NavbarProps {
  lang: Language;
  t: Translation;
  pathname: string;
}

const Navbar: React.FC<NavbarProps> = ({ lang, t, pathname }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stars, setStars] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetch('https://api.github.com/repos/BANSAFAn/timiGS-')
      .then(res => res.json())
      .then(data => setStars(data.stargazers_count))
      .catch(() => {});
  }, []);

  const navLinks = [
    { path: '/', label: t.nav.home },
    { path: '/releases', label: t.nav.releases },
    { path: '/docs', label: t.nav.docs },
    { path: '/notes', label: t.nav.notes },
    { path: '/terms', label: t.nav.terms },
  ];

  const languages = [
    { code: Language.EN, label: 'English' },
    { code: Language.UK, label: 'Українська' },
    { code: Language.DE, label: 'Deutsch' },
    { code: Language.ES, label: 'Español' },
    { code: Language.FR, label: 'Français' },
    { code: Language.ZH_CN, label: '简体中文' },
    { code: Language.ZH_TW, label: '繁體中文' },
    { code: Language.AR, label: 'العربية' },
    { code: Language.NL, label: 'Nederlands' },
    { code: Language.BE, label: 'Беларуская' },
    { code: Language.ZH_TW, label: '繁體中文' },
  ];

  const isActive = (path: string) => {
    const cleanPath = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
    const target = `/${lang}${path === '/' ? '' : path}`;
    return cleanPath === target || (path === '/' && cleanPath === `/${lang}`);
  };
  
  const getLinkHref = (path: string) => {
    return `/${lang}${path === '/' ? '' : path}`;
  };

  const switchLanguage = (newLang: Language) => {
    const currentPath = window.location.pathname;
    const segments = currentPath.split('/').filter(Boolean);
    
    if (segments.length > 0) {
      if (Object.values(Language).includes(segments[0] as Language)) {
          segments[0] = newLang;
      } else {
          segments.unshift(newLang);
      }
      window.location.href = `/${segments.join('/')}`;
    } else {
      window.location.href = `/${newLang}/`;
    }
  };

  return (
    <>
    <nav
      className={`fixed w-full z-50 top-0 start-0 transition-all duration-300 ${
        scrolled || isMenuOpen
          ? 'bg-surface/95 backdrop-blur-xl border-b border-border shadow-md'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between py-4">

          {/* Logo */}
          <a href={`/${lang}/`} className="flex items-center space-x-3 rtl:space-x-reverse group z-50">
            <div className="relative flex items-center justify-center p-2 rounded-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-brand-500/20 to-brand-secondary/20 border border-brand-500/20 group-hover:border-brand-500/40 group-hover:shadow-glow">
              <Clock className="w-6 h-6 text-brand-500 group-hover:scale-110 transition-all duration-300 relative z-10" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight group-hover:text-brand-500 transition-colors">TimiGS</span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex p-1 bg-bg-secondary rounded-xl border border-border mr-4 gap-1">
                {navLinks.map((link) => (
                    <a
                    key={link.path}
                    href={getLinkHref(link.path)}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive(link.path)
                        ? 'text-text-primary bg-surface shadow-sm'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
                    }`}
                    >
                    <span className="relative z-10">{link.label}</span>
                    </a>
                ))}
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-border">
                {/* GitHub Stars */}
                <a
                href="https://github.com/BANSAFAn/timiGS-"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 text-text-secondary hover:text-text-primary transition-all duration-300"
                title="GitHub Stars"
                >
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-bg-secondary border border-border hover:border-brand-500 hover:shadow-sm transition-all duration-300">
                    <Star className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">
                        {stars !== null ? (
                            stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : stars
                        ) : '...'}
                    </span>
                </div>
                </a>

                {/* Discord Link */}
                <a
                  href="https://discord.gg/78V2c4bdpj"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-2 rounded-lg text-text-secondary hover:text-[#5865F2] hover:bg-[#5865F2]/10 hover:border-[#5865F2]/30 border border-transparent transition-all duration-300 flex items-center justify-center"
                  title="Join Discord Server"
                >
                  <svg className="w-5 h-5 fill-current group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                  </svg>
                </a>

                {/* Language Selector */}
                <div className="relative group">
                    <button className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary hover:border-border border border-transparent transition-all duration-300">
                        <Globe className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                    </button>
                    <div className="absolute right-0 mt-2 w-56 py-2 bg-surface backdrop-blur-xl border border-border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right scale-95 group-hover:scale-100 max-h-80 overflow-y-auto">
                        <div className="px-4 py-2 text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1 flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5" />
                            Select Language
                        </div>
                        {languages.map((l) => (
                        <button
                            key={l.code}
                            onClick={() => switchLanguage(l.code)}
                            className={`block w-full text-left px-4 py-2.5 text-sm transition-all duration-200 flex items-center gap-3 ${
                            lang === l.code
                                ? 'text-brand-500 font-medium bg-brand-500/10 border-l-2 border-brand-500'
                                : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary border-l-2 border-transparent'
                            }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${lang === l.code ? 'bg-brand-500' : 'bg-transparent'}`}></span>
                            {l.label}
                        </button>
                        ))}
                    </div>
                </div>

                <a
                    href={getLinkHref('/download')}
                    className="ml-2 btn-primary"
                >
                    <Download className="w-4 h-4" />
                    <span>Get App</span>
                </a>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            type="button"
            className="inline-flex items-center justify-center p-2 rounded-lg text-text-primary md:hidden hover:bg-bg-secondary transition-all duration-300 z-50 relative touch-manipulation border border-border"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <span className="sr-only">Open main menu</span>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </nav>

    {/* Mobile Overlay Menu */}
    <div className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
        isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
    }`} role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-bg-primary/98 backdrop-blur-xl" onClick={() => setIsMenuOpen(false)}></div>
        <div className={`relative h-full flex flex-col justify-start pt-24 pb-8 px-6 transition-all duration-300 ${
            isMenuOpen ? 'translate-y-0' : '-translate-y-8'
        }`}>
            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto">
                <ul className="flex flex-col space-y-2">
                    {navLinks.map((link, index) => (
                    <li key={link.path}>
                        <a
                        href={getLinkHref(link.path)}
                        onClick={() => setIsMenuOpen(false)}
                        className={`block text-lg font-medium py-3 px-4 rounded-xl transition-all duration-300 border ${
                            isActive(link.path)
                                ? 'text-brand-500 bg-brand-500/10 border-brand-500/20'
                                : 'text-text-primary hover:bg-bg-secondary border-transparent hover:border-border'
                        }`}
                        >
                        {link.label}
                        </a>
                    </li>
                    ))}
                </ul>
            </nav>

            {/* Action Buttons */}
            <div className="mt-auto pt-6 border-t border-border space-y-3">
                <a
                    href={getLinkHref('/download')}
                    className="btn-primary w-full justify-center"
                    onClick={() => setIsMenuOpen(false)}
                >
                    <Download className="w-5 h-5" />
                    {t.nav.download}
                </a>

                {/* Language Selector */}
                <div className="relative">
                    <label htmlFor="mobile-lang-select" className="sr-only">Select Language</label>
                    <select
                        id="mobile-lang-select"
                        className="w-full px-4 py-3 rounded-xl bg-bg-secondary text-text-primary font-medium appearance-none outline-none focus:ring-2 focus:ring-brand-500/50 transition-all border border-border"
                        onChange={(e) => {
                            switchLanguage(e.target.value as Language);
                            setIsMenuOpen(false);
                        }}
                        value={lang}
                    >
                        {languages.map(l => (
                            <option key={l.code} value={l.code} className="bg-surface text-text-primary">{l.label}</option>
                        ))}
                    </select>
                    <Globe className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary pointer-events-none" />
                </div>

                {/* GitHub Stars (Mobile) */}
                <a
                    href="https://github.com/BANSAFAn/timiGS-"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-bg-secondary text-text-primary font-medium border border-border hover:border-brand-500 transition-all"
                    onClick={() => setIsMenuOpen(false)}
                >
                    <Star className="w-4 h-4 fill-current" />
                    <span>
                        {stars !== null ? (
                            stars >= 1000 ? `${(stars / 1000).toFixed(1)}k stars` : `${stars} stars`
                        ) : 'Loading...'}
                    </span>
                </a>
            </div>
        </div>
    </div>
    </>
  );
};

export default Navbar;