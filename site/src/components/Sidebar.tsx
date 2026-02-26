import React, { useState, useEffect } from 'react';
import { Language } from '../i18n/types';
import type { Translation } from '../i18n/types';
import { Menu, X, Globe, Clock, Star, Download, Home, FileText, BookOpen, Shield, FlaskConical, Newspaper, ChevronRight } from 'lucide-react';

interface SidebarProps {
  lang: Language;
  t: Translation;
  pathname: string;
}

const Sidebar: React.FC<SidebarProps> = ({ lang, t, pathname }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    fetch('https://api.github.com/repos/BANSAFAn/timiGS-')
      .then(res => res.json())
      .then(data => setStars(data.stargazers_count))
      .catch(() => {});
  }, []);

  const navLinks = [
    { path: '/', label: t.nav.home, icon: <Home className="w-5 h-5" /> },
    { path: '/releases', label: t.nav.releases, icon: <Newspaper className="w-5 h-5" /> },
    { path: '/download', label: t.nav.download, icon: <Download className="w-5 h-5" /> },
    { path: '/testing', label: t.nav.testing, icon: <FlaskConical className="w-5 h-5" /> },
    { path: '/docs', label: t.nav.docs, icon: <BookOpen className="w-5 h-5" /> },
    { path: '/notes', label: t.nav.notes, icon: <FileText className="w-5 h-5" /> },
    { path: '/terms', label: t.nav.terms, icon: <Shield className="w-5 h-5" /> },
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

  const getLinkHref = (path: string) => `/${lang}${path === '/' ? '' : path}`;

  const switchLanguage = (newLang: Language) => {
    const segments = window.location.pathname.split('/').filter(Boolean);
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
      {/* Desktop: Floating indicator tab on left edge */}
      {!isHovered && (
        <div
          className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-50 cursor-pointer items-center"
          onMouseEnter={() => setIsHovered(true)}
        >
          <div className="flex items-center gap-1 bg-apple-gray-900/80 backdrop-blur-md border border-white/10 border-l-0 rounded-r-2xl px-2 py-4 shadow-lg shadow-black/20 group hover:bg-apple-gray-800/90 transition-all duration-300">
            <ChevronRight className="w-4 h-4 text-apple-gray-400 group-hover:text-white transition-colors animate-pulse" />
          </div>
        </div>
      )}

      {/* Desktop Sidebar — hidden by default, slide-in on hover */}
      {/* Hover trigger zone (invisible strip on the left edge) */}
      <div
        className="hidden md:block fixed left-0 top-0 bottom-0 w-4 z-50"
        onMouseEnter={() => setIsHovered(true)}
      />

      <aside
        className={`hidden md:flex fixed left-0 top-0 bottom-0 w-[280px] bg-apple-gray-950/95 backdrop-blur-xl border-r border-white/10 flex-col z-40 rounded-r-3xl shadow-2xl shadow-black/30 transition-transform duration-300 ease-out ${
          isHovered ? 'translate-x-0' : '-translate-x-full'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <a href={`/${lang}/`} className="flex items-center gap-3 px-6 py-6 group">
          <div className="relative flex items-center justify-center p-2.5 rounded-2xl overflow-hidden bg-gradient-to-br from-apple-blue/20 to-purple-500/20 border border-white/10">
            <Clock className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-300 relative z-10" />
          </div>
          <span className="text-xl font-display font-bold text-white tracking-tight">TimiGS</span>
        </a>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navLinks.map((link) => (
            <a
              key={link.path}
              href={getLinkHref(link.path)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                isActive(link.path)
                  ? 'text-white bg-white/10 shadow-sm border border-white/5'
                  : 'text-apple-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={isActive(link.path) ? 'text-apple-blue' : ''}>{link.icon}</span>
              {link.label}
            </a>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-4 space-y-2 border-t border-white/5">
          {/* GitHub Stars */}
          <a
            href="https://github.com/BANSAFAn/timiGS-"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-apple-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm"
          >
            <Star className="w-4 h-4 fill-current" />
            <span className="font-medium">
              {stars !== null ? (stars >= 1000 ? `${(stars / 1000).toFixed(1)}k stars` : `${stars} stars`) : '...'}
            </span>
          </a>

          {/* Language */}
          <div className="relative group">
            <button className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-apple-gray-400 hover:text-white hover:bg-white/5 transition-all w-full text-sm">
              <Globe className="w-4 h-4" />
              <span className="font-medium">{languages.find(l => l.code === lang)?.label}</span>
            </button>
            <div className="absolute bottom-full left-0 mb-2 w-full py-2 bg-apple-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 max-h-64 overflow-y-auto">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => switchLanguage(l.code)}
                  className={`block w-full text-left px-4 py-2 text-sm transition-all ${
                    lang === l.code
                      ? 'text-apple-blue font-medium bg-apple-blue/10'
                      : 'text-apple-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <nav className="md:hidden fixed w-full z-50 top-0 bg-apple-gray-950/90 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <a href={`/${lang}/`} className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-white" />
            <span className="text-lg font-display font-bold text-white">TimiGS</span>
          </a>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-xl text-white hover:bg-white/10 transition-colors"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Slide-in Menu */}
      <div className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
        <div className={`absolute left-0 top-0 bottom-0 w-[280px] bg-apple-gray-950 border-r border-white/10 rounded-r-3xl flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Mobile Logo */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
            <a href={`/${lang}/`} className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
              <Clock className="w-5 h-5 text-white" />
              <span className="text-lg font-display font-bold text-white">TimiGS</span>
            </a>
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-xl text-white/50 hover:bg-white/5">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navLinks.map((link) => (
              <a
                key={link.path}
                href={getLinkHref(link.path)}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-base font-medium transition-all ${
                  isActive(link.path)
                    ? 'text-white bg-white/10 border border-white/5'
                    : 'text-apple-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={isActive(link.path) ? 'text-apple-blue' : ''}>{link.icon}</span>
                {link.label}
              </a>
            ))}
          </nav>

          {/* Mobile Bottom */}
          <div className="px-3 py-4 space-y-2 border-t border-white/5">
            <select
              className="w-full px-4 py-3 rounded-2xl bg-white/5 text-white font-medium appearance-none outline-none text-sm border border-white/5"
              onChange={(e) => { switchLanguage(e.target.value as Language); setIsOpen(false); }}
              value={lang}
            >
              {languages.map(l => (
                <option key={l.code} value={l.code} className="bg-apple-gray-900">{l.label}</option>
              ))}
            </select>

            <a
              href="https://github.com/BANSAFAn/timiGS-"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 text-white font-medium border border-white/10 text-sm"
              onClick={() => setIsOpen(false)}
            >
              <Star className="w-4 h-4 fill-current" />
              {stars !== null ? `${stars} stars` : '...'}
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
