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
      <nav className="fixed w-full z-50 top-0 bg-[var(--bg-secondary)] border-b border-[var(--border)] notranslate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href={`/${lang}/`} className="flex items-center gap-3 group">
              <div className="p-2 border border-[var(--brand-primary)] bg-[var(--bg-tertiary)] text-[var(--brand-primary)] transition-all">
                <Clock className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-wider text-[var(--brand-primary)] font-mono">TimiGS //</span>
            </a>

            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.path}
                  href={getLinkHref(link.path)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all ${
                    isActive(link.path)
                      ? 'border border-[var(--brand-primary)] bg-[var(--bg-tertiary)] text-[var(--brand-primary)] font-bold'
                      : 'text-[var(--text-primary)] hover:border hover:border-[var(--border)] hover:bg-[var(--bg-tertiary)]'
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
                className="flex items-center gap-2 px-3 py-1.5 border border-[var(--border)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition-colors"
              >
                <Star className="w-4 h-4" />
                <span className="text-sm font-medium">{stars !== null ? stars : '...'}</span>
              </a>

              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-1.5 border border-[var(--border)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition-colors">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm font-medium">[{lang.toUpperCase()}]</span>
                </button>
                
                <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-secondary)] border border-[var(--brand-primary)] shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => switchLanguage(l.code)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        lang === l.code
                          ? 'bg-[var(--bg-tertiary)] text-[var(--brand-primary)] font-bold'
                          : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
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
              className="md:hidden p-2 border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden notranslate">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setIsOpen(false)} />
          
          <div className="absolute top-16 right-0 bottom-0 w-80 bg-[var(--bg-secondary)] border-l border-[var(--brand-primary)] shadow-2xl overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                {navLinks.map((link) => (
                  <a
                    key={link.path}
                    href={getLinkHref(link.path)}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${
                      isActive(link.path)
                        ? 'border border-[var(--brand-primary)] bg-[var(--bg-tertiary)] text-[var(--brand-primary)] font-bold'
                        : 'text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>

              <div className="pt-6 border-t border-[var(--border)] space-y-3">
                <a
                  href="https://github.com/BANSAFAn/timiGS-"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-4 py-3 border border-[var(--border)] bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                >
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    <span className="text-sm font-medium">GitHub</span>
                  </div>
                  <span className="text-sm font-bold">{stars !== null ? stars : '...'}</span>
                </a>

                <select
                  className="w-full px-4 py-3 border border-[var(--border)] bg-[var(--bg-tertiary)] text-[var(--brand-primary)] text-sm font-medium outline-none"
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
