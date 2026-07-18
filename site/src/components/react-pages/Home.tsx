import React, { useEffect, useState } from "react";
import { Download as DownloadIcon, Star, Shield, Lightning, ArrowRight, Clock } from '@phosphor-icons/react';
import { Language } from "../../i18n/types";
import type { Translation } from "../../i18n/types";

interface HomeProps {
  lang: Language;
  t: Translation;
}

const Home: React.FC<HomeProps> = ({ lang, t }) => {
  const [ghStats, setGhStats] = useState({ stars: 0, downloads: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const repoRes = await fetch('https://api.github.com/repos/BANSAFAn/timiGS-');
        const repoData = await repoRes.json();
        const stars = repoData.stargazers_count || 0;
        
        const releasesRes = await fetch('https://api.github.com/repos/BANSAFAn/timiGS-/releases?per_page=100');
        const releasesData = await releasesRes.json();
        let downloads = 0;
        if (Array.isArray(releasesData)) {
          for (const release of releasesData) {
            for (const asset of release.assets || []) {
              downloads += asset.download_count || 0;
            }
          }
        }
        setGhStats({ stars, downloads });
      } catch { }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen font-mono">
      <section className="pt-24 pb-16">
        <div className="max-w-5xl mx-auto text-center space-y-10">
          <div className="space-y-6">
            <div className="inline-block border border-[var(--brand-primary)] bg-[var(--bg-tertiary)] px-4 py-1.5 text-sm font-bold text-[var(--brand-primary)]">
              [ SYSTEM_STATUS: READY // V1.10.4 ]
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-[var(--brand-primary)] tracking-tight leading-tight font-mono">
              {t.hero.tagline1}<br/>
              <span className="text-[var(--text-secondary)]">
                {t.hero.tagline2}
              </span>
            </h1>
            
            <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto font-mono">
              {t.hero.subtext}
            </p>
          </div>

          <div className="flex flex-wrap gap-6 justify-center items-center pt-6">
            <a 
              href={`/${lang}/download`}
              className="btn-primary text-lg px-8 py-4"
            >
              <span className="flex items-center gap-3">
                <DownloadIcon className="w-6 h-6" />
                [ {t.hero.cta_download.toUpperCase()} ]
                <ArrowRight className="w-5 h-5" />
              </span>
            </a>
            
            <a 
              href="https://github.com/BANSAFAn/timiGS-"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-lg px-8 py-4"
            >
              <span className="flex items-center gap-3">
                <Star className="w-6 h-6" />
                {ghStats.stars > 0 ? ghStats.stars.toLocaleString() : '...'} {t.hero.stats_stars.toUpperCase()}
              </span>
            </a>
          </div>

          {ghStats.downloads > 0 && (
            <div className="pt-6 text-[var(--text-tertiary)] font-mono">
              <span className="text-2xl font-bold text-[var(--brand-primary)]">{ghStats.downloads.toLocaleString()}+</span>
              <span className="ml-2 text-base">{t.hero.stats_downloads.toLowerCase()} {lang === 'en' ? 'downloads worldwide' : ''}</span>
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-[var(--bg-secondary)] border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto border border-[var(--brand-primary)] bg-[var(--bg-tertiary)] text-[var(--brand-primary)] flex items-center justify-center">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--brand-primary)] font-mono">
                {t.whyTimiGS.features.privacy.title}
              </h3>
              <p className="text-base text-[var(--text-secondary)] font-mono">
                {t.whyTimiGS.features.privacy.description}
              </p>
            </div>

            <div className="card p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto border border-[var(--brand-primary)] bg-[var(--bg-tertiary)] text-[var(--brand-primary)] flex items-center justify-center">
                <Lightning className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--brand-primary)] font-mono">
                {t.whyTimiGS.features.crossplatform.title}
              </h3>
              <p className="text-base text-[var(--text-secondary)] font-mono">
                {t.whyTimiGS.features.crossplatform.description}
              </p>
            </div>

            <div className="card p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto border border-[var(--brand-primary)] bg-[var(--bg-tertiary)] text-[var(--brand-primary)] flex items-center justify-center">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--brand-primary)] font-mono">
                {t.features.sections.tracking.title}
              </h3>
              <p className="text-base text-[var(--text-secondary)] font-mono">
                {t.features.sections.tracking.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="p-12 border border-[var(--brand-primary)] bg-[var(--bg-tertiary)]">
            <h2 className="text-4xl font-bold mb-4 text-[var(--brand-primary)] font-mono">
              {t.cta.title}
            </h2>
            <p className="text-xl text-[var(--text-secondary)] mb-8 font-mono">
              {t.cta.subtitle}
            </p>
            <a 
              href={`/${lang}/download`}
              className="btn-primary text-xl px-10 py-5"
            >
              <DownloadIcon className="w-7 h-7" />
              [ {t.cta.primary.toUpperCase()} ]
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
