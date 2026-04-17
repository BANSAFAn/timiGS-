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
      {/* HUD Edge Trigger (Desktop) */}
      {!isHovered && (
        <div
          className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-50 cursor-pointer items-center group"
          onMouseEnter={() => setIsHovered(true)}
        >
          <div className="flex flex-col items-center gap-1 bg-cyber-panel border-y border-r border-[rgba(6,245,214,0.15)] rounded-r-lg px-1.5 py-4 shadow-[0_0_15px_rgba(6,245,214,0.05)] transition-all duration-300 group-hover:border-[rgba(6,245,214,0.4)] group-hover:bg-[#15152a] group-hover:shadow-[0_0_20px_rgba(6,245,214,0.15)] relative overflow-hidden">
            {/* Tech line */}
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-cyber-cyan opacity-80" />
            <span className="hud-label rotate-180 [writing-mode:vertical-rl] tracking-[4px] mb-2 group-hover:text-cyber-cyan transition-colors">DATA_LINK</span>
            <ChevronRight className="w-4 h-4 text-cyber-cyan opacity-50 group-hover:opacity-100 transition-all duration-300 animate-pulse-slow" />
          </div>
        </div>
      )}

      {/* Invisible hover strip */}
      <div
        className="hidden md:block fixed left-0 top-0 bottom-0 w-6 z-50"
        onMouseEnter={() => setIsHovered(true)}
      />

      {/* Desktop Sidebar (HUD Style) */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 bottom-0 w-[300px] bg-[rgba(10,10,18,0.95)] backdrop-blur-xl border-r border-[rgba(6,245,214,0.15)] flex-col z-40 shadow-[20px_0_40px_rgba(0,0,0,0.8)] transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${
          isHovered ? 'translate-x-0' : '-translate-x-full'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* HUD Scanner Line */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-none">
           <div className={`absolute left-0 right-0 h-[2px] bg-cyber-cyan opacity-40 blur-[1px] transition-opacity duration-1000 ${isHovered ? 'opacity-40' : 'opacity-0'}`} style={{ animation: isHovered ? 'cyber-scan 3s linear infinite' : 'none' }}></div>
        </div>

        {/* Logo / Header */}
        <a href={`/${lang}/`} className="flex items-center gap-4 px-6 py-7 group border-b border-[rgba(6,245,214,0.1)] relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyber-cyan opacity-50" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-cyber-cyan opacity-50" />
          
          <div className="relative flex items-center justify-center p-2.5 rounded-lg overflow-hidden bg-cyber-surface border border-[rgba(6,245,214,0.2)] group-hover:border-cyber-cyan group-hover:shadow-[0_0_15px_rgba(6,245,214,0.2)] transition-all duration-300">
            <Clock className="w-6 h-6 text-cyber-cyan relative z-10 group-hover:animate-loader-spin" />
            <div className="absolute inset-0 bg-cyber-cyan opacity-0 group-hover:opacity-10 transition-opacity" />
          </div>
          <div>
             <div className="text-xl font-display font-bold text-white tracking-widest uppercase group-hover:text-cyber-cyan transition-colors">TimiGS</div>
             <div className="hud-label text-[9px] mt-0.5">SYS.TRACKER_v2</div>
          </div>
        </a>

        {/* Navigation */}
        <div className="flex-1 px-4 py-6 overflow-y-auto cyber-scrollbar relative">
          <div className="hud-label text-[10px] mb-4 pl-2 opacity-50">/// MAIN_INDEX</div>
          <nav className="space-y-1.5">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <a
                  key={link.path}
                  href={getLinkHref(link.path)}
                  className={`group flex items-center gap-4 px-4 py-3 rounded-md transition-all duration-300 relative overflow-hidden ${
                    active
                      ? 'bg-[rgba(6,245,214,0.08)] border border-[rgba(6,245,214,0.25)] shadow-[0_0_15px_rgba(6,245,214,0.05)]'
                      : 'border border-transparent hover:border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)]'
                  }`}
                >
                  {/* Left accent bar */}
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-300 ${active ? 'h-3/4 bg-cyber-cyan shadow-[0_0_10px_rgba(6,245,214,0.8)]' : 'h-0 bg-[rgba(255,255,255,0.2)] group-hover:h-1/2'}`} />
                  
                  <span className={`relative z-10 transition-all duration-300 ${active ? 'text-cyber-cyan' : 'text-gray-400 group-hover:text-white'}`}>
                    {link.icon}
                  </span>
                  
                  <span className={`relative z-10 font-mono text-sm uppercase tracking-wide transition-colors ${active ? 'text-white font-semibold' : 'text-gray-400 group-hover:text-gray-200'}`}>
                    {link.label}
                  </span>

                  {active && (
                    <ChevronRight className="w-4 h-4 text-cyber-cyan ml-auto relative z-10 animate-pulse-slow" />
                  )}
                  
                  {/* Background grid on active */}
                  {active && (
                     <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(rgba(6,245,214,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(6,245,214,0.5)_1px,transparent_1px)] bg-[size:4px_4px] pointer-events-none" />
                  )}
                </a>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="px-4 py-5 border-t border-[rgba(6,245,214,0.1)] bg-[rgba(0,0,0,0.2)] space-y-3 relative">
          {/* Corner brackets */}
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-cyber-cyan opacity-50" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyber-cyan opacity-50" />

          {/* GitHub Stars */}
          <a
            href="https://github.com/BANSAFAn/timiGS-"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between px-4 py-2.5 rounded-md border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(6,245,214,0.3)] hover:bg-[rgba(6,245,214,0.05)] transition-all duration-300"
          >
            <div className="flex items-center gap-3 text-gray-400 group-hover:text-cyber-cyan transition-colors">
              <Star className="w-4 h-4 fill-current group-hover:animate-loader-pulse" />
              <span className="font-mono text-xs uppercase tracking-wider text-gray-300">GitHub</span>
            </div>
            <span className="font-mono text-xs text-cyber-cyan font-bold bg-[rgba(6,245,214,0.1)] px-2 py-0.5 rounded border border-[rgba(6,245,214,0.2)]">
              {stars !== null ? (stars >= 1000 ? `${(stars / 1000).toFixed(1)}K` : stars) : '...'}
            </span>
          </a>

          {/* Language / Region */}
          <div className="relative group">
            <button className="flex items-center justify-between w-full px-4 py-2.5 rounded-md border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(168,85,247,0.3)] hover:bg-[rgba(168,85,247,0.05)] transition-all duration-300 text-left">
              <div className="flex items-center gap-3 text-gray-400 group-hover:text-cyber-purple transition-colors">
                 <Globe className="w-4 h-4 group-hover:animate-spin-slow" />
                 <span className="font-mono text-xs uppercase tracking-wider text-gray-300">Region</span>
              </div>
              <span className="font-mono text-[10px] text-cyber-purple font-bold tracking-widest">{lang.toUpperCase()}</span>
            </button>
            
            {/* Lang Dropdown */}
            <div className="absolute bottom-full left-0 w-full mb-2 bg-[rgba(10,10,18,0.95)] backdrop-blur-xl border border-[rgba(168,85,247,0.2)] p-1 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.1)] z-50">
               <div className="max-h-48 overflow-y-auto cyber-scrollbar flex flex-col gap-1 p-1">
                 {languages.map((l) => (
                   <button
                     key={l.code}
                     onClick={() => switchLanguage(l.code)}
                     className={`text-left px-3 py-2 rounded text-xs font-mono tracking-wider transition-colors hover:bg-[rgba(168,85,247,0.1)] hover:text-white ${lang === l.code ? 'bg-[rgba(168,85,247,0.15)] text-cyber-purple' : 'text-gray-400'}`}
                   >
                     {lang === l.code && <span className="mr-2 opacity-70">►</span>}
                     {l.label}
                   </button>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </aside>


      {/* ═════════ MOBILE NAV ═════════ */}
      <nav className="md:hidden fixed w-full z-50 top-0 bg-[rgba(10,10,18,0.95)] backdrop-blur-xl border-b border-[rgba(6,245,214,0.15)]">
        <div className="flex items-center justify-between px-4 py-3 relative">
          {/* Top border effect */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyber-cyan to-transparent opacity-30" />
          
          <a href={`/${lang}/`} className="flex items-center gap-3">
            <div className="p-1.5 rounded-md bg-[rgba(6,245,214,0.1)] border border-[rgba(6,245,214,0.3)] text-cyber-cyan">
              <Clock className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-white tracking-widest uppercase text-base">TimiGS</span>
          </a>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-md border border-[rgba(255,255,255,0.1)] text-gray-300 hover:text-cyber-cyan hover:border-[rgba(6,245,214,0.3)] transition-colors bg-[rgba(255,255,255,0.02)]"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ease-out ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-[rgba(6,6,9,0.9)] backdrop-blur-md" onClick={() => setIsOpen(false)} />
        
        <div className={`absolute top-0 right-0 bottom-0 w-[85%] max-w-[320px] bg-cyber-surface border-l border-[rgba(6,245,214,0.2)] shadow-[-10px_0_30px_rgba(0,0,0,0.8)] flex flex-col transition-transform duration-500 delay-75 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-5 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(6,245,214,0.03)] flex items-center justify-between">
            <div className="hud-label">SYSMENU_ACX_01</div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.path}
                href={getLinkHref(link.path)}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-md font-mono text-sm tracking-wide border ${isActive(link.path) ? 'bg-[rgba(6,245,214,0.1)] border-[rgba(6,245,214,0.3)] text-cyber-cyan' : 'border-transparent text-gray-300 hover:bg-[rgba(255,255,255,0.05)]'}`}
              >
                {link.icon}
                {link.label}
              </a>
            ))}
          </div>

          <div className="p-4 border-t border-[rgba(255,255,255,0.05)] space-y-3 bg-[rgba(0,0,0,0.2)]">
            <select
               className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] text-gray-300 font-mono text-xs p-3 rounded-md outline-none focus:border-[rgba(168,85,247,0.5)] transition-colors"
               onChange={(e) => { switchLanguage(e.target.value as Language); setIsOpen(false); }}
               value={lang}
            >
               {languages.map(l => <option key={l.code} value={l.code} className="bg-cyber-surface">{l.label}</option>)}
            </select>
            
            <a
              href="https://github.com/BANSAFAn/timiGS-"
              className="flex items-center justify-center gap-2 w-full p-3 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded-md text-gray-300 font-mono text-xs hover:border-[rgba(6,245,214,0.4)] hover:text-cyber-cyan transition-colors"
            >
              <Star className="w-4 h-4" />
              GH STATUS: {stars !== null ? stars : '...'}
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
