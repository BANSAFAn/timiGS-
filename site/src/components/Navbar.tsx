import React, { useState, useEffect } from 'react';
import { Language } from '../i18n/types';
import type { Translation } from '../i18n/types';
import { Menu, X, Globe, Clock, Star, Download } from 'lucide-react';

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
      className={`fixed w-full z-50 top-0 start-0 transition-all duration-500 ${
        scrolled || isMenuOpen
          ? 'bg-apple-gray-950/70 backdrop-blur-md border-b border-white/5 supports-[backdrop-filter]:bg-apple-gray-950/40' 
          : 'bg-transparent border-b border-transparent py-2'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between py-4">
          
          {/* Logo */}
          <a href={`/${lang}/`} className="flex items-center space-x-3 rtl:space-x-reverse group z-50">
            <div className="relative flex items-center justify-center p-2 rounded-xl transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-apple-blue to-purple-500 opacity-20 group-hover:opacity-100 transition-opacity duration-500 blur-lg"></div>
              <Clock className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-500 relative z-10" />
            </div>
            <span className="text-xl font-display font-bold text-white tracking-tight">TimiGS</span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <div className="flex p-1 bg-white/5 rounded-full border border-white/5 backdrop-blur-sm mr-4">
                {navLinks.map((link) => (
                    <a
                    key={link.path}
                    href={getLinkHref(link.path)}
                    className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                        isActive(link.path)
                        ? 'text-white bg-white/10 shadow-sm'
                        : 'text-apple-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                    >
                    {link.label}
                    </a>
                ))}
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                {/* GitHub Stars - Minimalist */}
                <a
                href="https://github.com/BANSAFAn/timiGS-"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-apple-gray-400 hover:text-white transition-colors"
                title="GitHub Stars"
                >
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-xs font-medium font-mono">
                        {stars !== null ? (
                            stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : stars
                        ) : '...'}
                    </span>
                </div>
                </a>
                
                {/* Language Selector - Minimalist */}
                <div className="relative group">
                    <button className="p-2 rounded-full text-apple-gray-400 hover:text-white hover:bg-white/10 transition-all">
                        <Globe className="w-5 h-5" />
                    </button>
                    <div className="absolute right-0 mt-4 w-56 py-2 bg-apple-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right scale-95 group-hover:scale-100 h-80 overflow-y-auto">
                        <div className="px-4 py-2 text-xs font-medium text-apple-gray-500 uppercase tracking-wider mb-1">Select Language</div>
                        {languages.map((l) => (
                        <button
                            key={l.code}
                            onClick={() => switchLanguage(l.code)}
                            className={`block w-full text-left px-4 py-2.5 text-sm transition-all ${
                            lang === l.code 
                                ? 'text-apple-blue font-medium bg-apple-blue/10 border-l-2 border-apple-blue' 
                                : 'text-apple-gray-300 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                            }`}
                        >
                            {l.label}
                        </button>
                        ))}
                    </div>
                </div>

                <a 
                    href={getLinkHref('/download')}
                    className="ml-2 flex items-center gap-2 px-4 py-2 rounded-full bg-apple-blue hover:bg-apple-blue-dark text-white text-sm font-medium transition-all shadow-lg shadow-apple-blue/20 hover:scale-105 active:scale-95"
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
            className="inline-flex items-center justify-center p-2 rounded-full text-white md:hidden hover:bg-white/10 transition-colors z-50 relative"
          >
            <span className="sr-only">Open main menu</span>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </nav>
    
    {/* Mobile Overlay Menu */}
    <div className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ${
        isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
    }`}>
        <div className="absolute inset-0 bg-apple-gray-950/80 backdrop-blur-2xl"></div>
        <div className={`relative h-full flex flex-col justify-center px-8 transition-all duration-700 delay-100 ${
            isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
            <ul className="flex flex-col space-y-6">
                {navLinks.map((link) => (
                <li key={link.path}>
                    <a
                    href={getLinkHref(link.path)}
                    onClick={() => setIsMenuOpen(false)}
                    className={`text-3xl font-display font-medium tracking-tight ${
                        isActive(link.path) ? 'text-apple-blue' : 'text-white'
                    }`}
                    >
                    {link.label}
                    </a>
                </li>
                ))}
            </ul>

            <div className="mt-12 pt-12 border-t border-white/10 grid grid-cols-2 gap-4">
                <a
                    href={getLinkHref('/download')}
                    className="flex justify-center items-center gap-2 px-6 py-4 rounded-xl bg-apple-blue text-white font-medium shadow-lg"
                    onClick={() => setIsMenuOpen(false)}
                >
                    <Download className="w-5 h-5" />
                    {t.nav.download}
                </a>
                
                <div className="relative">
                    <select 
                        className="w-full px-6 py-4 rounded-xl bg-white/10 text-white font-medium appearance-none outline-none"
                        onChange={(e) => {
                            switchLanguage(e.target.value as Language);
                            setIsMenuOpen(false);
                        }}
                        value={lang}
                    >
                        {languages.map(l => (
                            <option key={l.code} value={l.code} className="bg-apple-gray-900">{l.label}</option>
                        ))}
                    </select>
                    <Globe className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50 pointer-events-none" />
                </div>
            </div>
        </div>
    </div>
    </>
  );
};

export default Navbar;