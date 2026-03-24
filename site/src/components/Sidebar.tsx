import React, { useState, useEffect } from 'react';
import { Language } from '../i18n/types';
import type { Translation } from '../i18n/types';
import { List as Menu, X, GlobeHemisphereWest as Globe, Clock, Star, DownloadSimple as Download, House as Home, FileText, BookOpen, ShieldCheck as Shield, Flask as FlaskConical, Newspaper, CaretRight as ChevronRight } from '@phosphor-icons/react';

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
          className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-50 cursor-pointer items-center group"
          onMouseEnter={() => setIsHovered(true)}
        >
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-apple-blue/20 to-purple-500/20 backdrop-blur-md border-y border-r border-white/15 border-l-0 rounded-r-2xl px-2.5 py-4 shadow-lg shadow-apple-blue/10 transition-all duration-500 group-hover:shadow-xl group-hover:shadow-apple-blue/20">
            <ChevronRight className="w-4 h-4 text-apple-gray-400 group-hover:text-white transition-all duration-300 animate-pulse" />
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
        className={`hidden md:flex fixed left-0 top-0 bottom-0 w-[300px] bg-apple-gray-950/98 backdrop-blur-2xl border-r border-white/15 flex-col z-40 rounded-r-3xl shadow-2xl shadow-black/40 transition-all duration-500 ease-out ${
          isHovered ? 'translate-x-0 shadow-apple-blue/10' : '-translate-x-full'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <a href={`/${lang}/`} className="flex items-center gap-3 px-6 py-6 group border-b border-white/5">
          <div className="relative flex items-center justify-center p-2.5 rounded-2xl overflow-hidden bg-gradient-to-br from-apple-blue/30 to-purple-500/30 border border-white/20 group-hover:border-white/30 group-hover:shadow-xl group-hover:shadow-apple-blue/20 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-tr from-apple-blue to-purple-500 opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-lg"></div>
            <Clock className="w-6 h-6 text-white group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 relative z-10" />
          </div>
          <div>
            <span className="text-xl font-display font-bold text-white tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-apple-blue/80 transition-all duration-500">TimiGS</span>
            <p className="text-xs text-apple-gray-500 font-medium">Activity Tracker</p>
          </div>
        </a>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navLinks.map((link) => (
            <a
              key={link.path}
              href={getLinkHref(link.path)}
              className={`group flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all duration-300 border ${
                isActive(link.path)
                  ? 'text-white bg-gradient-to-r from-apple-blue/20 to-purple-500/20 shadow-lg shadow-apple-blue/10 border-white/10'
                  : 'text-apple-gray-400 hover:text-white hover:bg-white/5 border-transparent hover:border-white/5'
              }`}
            >
              <span className={`transition-all duration-300 ${isActive(link.path) ? 'text-apple-blue scale-110' : 'text-apple-gray-500 group-hover:text-apple-blue group-hover:scale-105'}`}>{link.icon}</span>
              {link.label}
              {isActive(link.path) && (
                <ChevronRight className="w-4 h-4 text-apple-blue ml-auto opacity-100 transition-all duration-300" />
              )}
            </a>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-3 py-4 space-y-2 border-t border-white/10 bg-gradient-to-t from-apple-blue/5 to-transparent">
          {/* GitHub Stars */}
          <a
            href="https://github.com/BANSAFAn/timiGS-"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 px-4 py-3 rounded-2xl text-apple-gray-400 hover:text-white hover:bg-gradient-to-r hover:from-apple-blue/15 hover:to-purple-500/15 hover:border-apple-blue/30 border border-transparent transition-all duration-300 text-sm"
          >
            <Star className="w-4 h-4 fill-current group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
            <span className="font-medium">
              {stars !== null ? (stars >= 1000 ? `${(stars / 1000).toFixed(1)}k stars` : `${stars} stars`) : '...'}
            </span>
          </a>

          {/* Language */}
          <div className="relative group">
            <button className="flex items-center gap-3 px-4 py-3 rounded-2xl text-apple-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5 transition-all duration-300 w-full text-sm">
              <Globe className="w-4 h-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
              <span className="font-medium">{languages.find(l => l.code === lang)?.label}</span>
            </button>
            <div className="absolute bottom-full left-0 mb-2 w-full py-2 bg-apple-gray-900/98 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl shadow-black/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 max-h-64 overflow-y-auto">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => switchLanguage(l.code)}
                  className={`block w-full text-left px-4 py-2.5 text-sm transition-all duration-200 flex items-center gap-3 ${
                    lang === l.code
                      ? 'text-apple-blue font-medium bg-gradient-to-r from-apple-blue/15 to-purple-500/15 border-l-3 border-apple-blue'
                      : 'text-apple-gray-300 hover:text-white hover:bg-white/5 border-l-3 border-transparent'
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
      <nav className="md:hidden fixed w-full z-50 top-0 bg-apple-gray-950/95 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between px-4 py-3">
          <a href={`/${lang}/`} className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center p-2 rounded-xl overflow-hidden bg-gradient-to-br from-apple-blue/20 to-purple-500/20 border border-white/10 group-hover:border-white/20">
              <Clock className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="text-lg font-display font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-apple-blue/80 transition-all duration-300">TimiGS</span>
          </a>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2.5 rounded-xl text-white hover:bg-white/10 hover:scale-105 transition-all duration-300 border border-transparent hover:border-white/10"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Slide-in Menu */}
      <div className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="absolute inset-0 bg-apple-gray-950/98 backdrop-blur-xl" onClick={() => setIsOpen(false)} />
        <div className={`absolute left-0 top-0 bottom-0 w-[300px] bg-apple-gray-950 border-r border-white/15 rounded-r-3xl flex flex-col transition-all duration-500 shadow-2xl shadow-black/40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Mobile Logo */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-white/10 bg-gradient-to-r from-apple-blue/5 to-purple-500/5">
            <a href={`/${lang}/`} className="flex items-center gap-2.5 group" onClick={() => setIsOpen(false)}>
              <div className="relative flex items-center justify-center p-2 rounded-xl overflow-hidden bg-gradient-to-br from-apple-blue/20 to-purple-500/20 border border-white/10">
                <Clock className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="text-lg font-display font-bold text-white">TimiGS</span>
            </a>
            <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl text-apple-gray-400 hover:bg-white/10 hover:text-white transition-all duration-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
            {navLinks.map((link) => (
              <a
                key={link.path}
                href={getLinkHref(link.path)}
                onClick={() => setIsOpen(false)}
                className={`group flex items-center gap-3 px-4 py-3.5 rounded-2xl text-base font-medium transition-all duration-300 border ${
                  isActive(link.path)
                    ? 'text-white bg-gradient-to-r from-apple-blue/20 to-purple-500/20 shadow-lg shadow-apple-blue/10 border-white/10'
                    : 'text-apple-gray-400 hover:text-white hover:bg-white/5 border-transparent hover:border-white/5'
                }`}
              >
                <span className={`transition-all duration-300 ${isActive(link.path) ? 'text-apple-blue scale-110' : 'text-apple-gray-500 group-hover:text-apple-blue group-hover:scale-105'}`}>{link.icon}</span>
                {link.label}
                {isActive(link.path) && (
                  <ChevronRight className="w-4 h-4 text-apple-blue ml-auto opacity-100 transition-all duration-300" />
                )}
              </a>
            ))}
          </nav>

          {/* Mobile Bottom */}
          <div className="px-3 py-4 space-y-2.5 border-t border-white/10 bg-gradient-to-t from-apple-blue/5 to-transparent">
            <select
              className="w-full px-4 py-3.5 rounded-2xl bg-white/5 text-white font-medium appearance-none outline-none text-sm border border-white/10 focus:ring-2 focus:ring-apple-blue/30 active:bg-white/10 transition-all"
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
              className="group flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-white/5 text-white font-medium border border-white/10 hover:bg-gradient-to-r hover:from-apple-blue/15 hover:to-purple-500/15 hover:border-apple-blue/30 transition-all duration-300"
              onClick={() => setIsOpen(false)}
            >
              <Star className="w-4 h-4 fill-current group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
              {stars !== null ? `${stars} stars` : '...'}
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
