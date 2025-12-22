import React, { useState } from 'react';
import { Language } from '../i18n/types';
import type { Translation } from '../i18n/types';
import { Menu, X, Globe, Clock } from 'lucide-react';

interface NavbarProps {
  lang: Language;
  t: Translation;
  pathname: string;
}

const Navbar: React.FC<NavbarProps> = ({ lang, t, pathname }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  // Helper to determine if link is active
  // pathname is like /en/ or /en/releases.
  // link.path is / or /releases.
  // We check if pathname ends with link.path (handling root carefully)
  const isActive = (path: string) => {
    // clean pathname of trailing slash for comparison
    const cleanPath = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
    const target = `/${lang}${path === '/' ? '' : path}`;
    return cleanPath === target || (path === '/' && cleanPath === `/${lang}`);
  };
  
  const getLinkHref = (path: string) => {
    return `/${lang}${path === '/' ? '' : path}`;
  };

  const switchLanguage = (newLang: Language) => {
    const currentPath = window.location.pathname;
    // Split and remove empty strings to handle slashes correctly
    const segments = currentPath.split('/').filter(Boolean);
    
    if (segments.length > 0) {
      // Replace the first segment (language code)
      segments[0] = newLang;
      window.location.href = `/${segments.join('/')}`;
    } else {
      // Fallback for root path
      window.location.href = `/${newLang}/`;
    }
  };

  return (
    <nav className="fixed w-full z-50 top-0 start-0 glass-panel border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between py-4">
          
          {/* Logo */}
          <a href={`/${lang}/`} className="flex items-center space-x-2 rtl:space-x-reverse group">
            <div className="p-2 bg-sky-500/10 rounded-xl group-hover:bg-sky-500/20 transition-colors">
              <Clock className="w-8 h-8 text-sky-400" />
            </div>
            <span className="self-center text-2xl font-bold whitespace-nowrap text-white tracking-tight">TimiGS</span>
          </a>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-slate-400 rounded-lg md:hidden hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-600"
          >
            <span className="sr-only">Open main menu</span>
            {isMenuOpen ? <X /> : <Menu />}
          </button>

          {/* Desktop Nav */}
          <div className="hidden w-full md:flex md:w-auto md:order-1 items-center gap-6">
            <ul className="flex flex-row p-0 space-x-8 rtl:space-x-reverse mt-0 font-medium">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <a
                    href={getLinkHref(link.path)}
                    className={`block py-2 px-3 rounded md:p-0 transition-colors ${
                      isActive(link.path)
                        ? 'text-sky-400 font-bold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            
            {/* Language Selector */}
            <div className="relative group">
              <button className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                <Globe className="w-5 h-5" />
                <span className="text-sm uppercase">{lang}</span>
              </button>
              <div className="absolute right-0 mt-2 w-48 py-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 h-64 overflow-y-auto custom-scrollbar z-50">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => switchLanguage(l.code)}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-800 ${
                      lang === l.code ? 'text-sky-400 font-bold' : 'text-slate-300'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

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