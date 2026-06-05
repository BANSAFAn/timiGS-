import React, { useState, useEffect } from 'react';
import { Language } from '../i18n/types';
import type { Translation } from '../i18n/types';
import { List as Menu, X, GlobeHemisphereWest as Globe, Clock, Star, DownloadSimple as Download, House as Home, FileText, BookOpen, ShieldCheck as Shield, Flask as FlaskConical, Newspaper } from '@phosphor-icons/react';

interface SidebarProps {
  lang: Language;
  t: Translation;
  pathname: string;
}

const Sidebar: React.FC<SidebarProps> = ({ lang, t, pathname }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    fetch('https://api.github.com/repos/BANSAFAn/timiGS-')
      .then(res => res.json())
      .then(data => setStars(data.stargazers_count))
      .catch(() => {});
  }, []);

  const navLinks = [
    { path: '/', label: t.nav.home, icon: <Home className="w-5 h-5" /> },
    { path: '/download', label: t.nav.download, icon: <Download className="w-5 h-5" /> },
    { path: '/releases', label: t.nav.releases, icon: <Newspaper className="w-5 h-5" /> },
    { path: '/docs', label: t.nav.docs, icon: <BookOpen className="w-5 h-5" /> },
    { path: '/notes', label: t.nav.notes, icon: <FileText className="w-5 h-5" /> },
    { path: '/testing', label: t.nav.testing, icon: <FlaskConical className="w-5 h-5" /> },
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
      <nav className="fixed w-full z-50 top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-gray-200 dark:border-slate-800 transition-colors notranslate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href={`/${lang}/`} className="flex items-center gap-3 group">
              <div className="p-2 rounded-xl bg-gradient-to-br from-brand-500 to-accent-purple text-white shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all">
                <Clock className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">TimiGS</span>
            </a>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.path}
                  href={getLinkHref(link.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(link.path)
                      ? 'bg-brand-500 text-white shadow-md'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <a
                href="https://github.com/BANSAFAn/timiGS-"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Star className="w-4 h-4" />
                <span className="text-sm font-medium">{stars !== null ? stars : '...'}</span>
              </a>

              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">{lang.toUpperCase()}</span>
                </button>
                
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => switchLanguage(l.code)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        lang === l.code
                          ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden notranslate">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="absolute top-16 right-0 bottom-0 w-80 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 shadow-2xl overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <a
                    key={link.path}
                    href={getLinkHref(link.path)}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive(link.path)
                        ? 'bg-brand-500 text-white shadow-md'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-slate-800 space-y-3">
                <a
                  href="https://github.com/BANSAFAn/timiGS-"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300"
                >
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    <span className="text-sm font-medium">GitHub</span>
                  </div>
                  <span className="text-sm font-bold">{stars !== null ? stars : '...'}</span>
                </a>

                <select
                  className="w-full px-4 py-3 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-sm font-medium border-none outline-none"
                  onChange={(e) => { switchLanguage(e.target.value as Language); setIsOpen(false); }}
                  value={lang}
                >
                  {languages.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
