import React, { useState, useEffect } from 'react';
import { Language } from '../i18n/types';
import type { Translation } from '../i18n/types';
import { Menu, X, Globe, Clock, Star, Sparkles } from 'lucide-react';

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
    { path: '/download', label: t.nav.download },
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
      segments[0] = newLang;
      window.location.href = `/${segments.join('/')}`;
    } else {
      window.location.href = `/${newLang}/`;
    }
  };

  return (
    <nav className={`fixed w-full z-50 top-0 start-0 transition-all duration-300 ${
      scrolled 
        ? 'glass-panel border-b border-slate-800/50 bg-slate-900/90 backdrop-blur-xl shadow-lg shadow-slate-950/50' 
        : 'bg-transparent border-b border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between py-4">
          
          {/* Logo */}
          <a href={`/${lang}/`} className="flex items-center space-x-3 rtl:space-x-reverse group">
            <div className="relative p-2.5 bg-gradient-to-br from-sky-500/20 to-purple-500/10 rounded-xl group-hover:from-sky-500/30 group-hover:to-purple-500/20 transition-all duration-300 shadow-lg shadow-sky-500/10">
              <Clock className="w-7 h-7 text-sky-400 group-hover:text-sky-300 transition-colors" />
              <div className="absolute inset-0 bg-sky-400/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white tracking-tight group-hover:text-sky-100 transition-colors">TimiGS</span>
              <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Activity Tracker</span>
            </div>
          </a>

          {/* Desktop Nav */}
          <div className="hidden w-full md:flex md:w-auto md:order-1 items-center gap-6">
            <ul className="flex flex-row p-0 space-x-1 rtl:space-x-reverse mt-0 font-medium">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <a
                    href={getLinkHref(link.path)}
                    className={`relative block py-2 px-4 rounded-lg transition-all duration-300 ${
                      isActive(link.path)
                        ? 'text-sky-400 font-bold bg-sky-500/10'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    {link.label}
                    {isActive(link.path) && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sky-400" />
                    )}
                  </a>
                </li>
              ))}
            </ul>

            {/* GitHub Stars Button */}
            <a
              href="https://github.com/BANSAFAn/timiGS-"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-yellow-500/30 hover:bg-slate-800 transition-all duration-300"
            >
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 group-hover:animate-wiggle" />
              {stars !== null ? (
                <span className="text-sm font-bold text-white">{stars}</span>
              ) : (
                <span className="w-6 h-3 bg-slate-700 rounded animate-pulse" />
              )}
            </a>
            
            {/* Language Selector */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all">
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium uppercase">{lang}</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 py-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 h-64 overflow-y-auto z-50">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => switchLanguage(l.code)}
                    className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      lang === l.code 
                        ? 'text-sky-400 font-bold bg-sky-500/10' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-slate-400 rounded-lg md:hidden hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-600 transition-colors"
          >
            <span className="sr-only">Open main menu</span>
            {isMenuOpen ? <X /> : <Menu />}
          </button>

          {/* Mobile Menu Content */}
          <div className={`${isMenuOpen ? 'block' : 'hidden'} w-full md:hidden mt-4 border-t border-slate-800 pt-4`}>
            <ul className="flex flex-col font-medium p-4 md:p-0 bg-slate-900/50 rounded-lg space-y-2">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <a
                    href={getLinkHref(link.path)}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block py-2 px-3 rounded hover:bg-slate-800 ${
                      isActive(link.path) ? 'text-sky-400 bg-slate-800/50' : 'text-slate-300'
                    }`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li className="pt-4 border-t border-slate-700">
                <p className="px-3 text-xs text-slate-500 uppercase mb-2">Language</p>
                <div className="grid grid-cols-2 gap-2">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        switchLanguage(l.code);
                        setIsMenuOpen(false);
                      }}
                      className={`text-left px-3 py-2 text-sm rounded ${
                        lang === l.code ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;