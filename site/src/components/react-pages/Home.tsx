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
    <div className="min-h-screen">
      <section className="pt-32 pb-20">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <div className="space-y-6">
            <h1 className="text-6xl md:text-8xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
              Track Your Time,<br/>
              <span className="text-blue-600 dark:text-blue-400">
                Own Your Data
              </span>
            </h1>
            
            <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-light">
              Privacy-first activity tracker. All data stays on your device. No cloud, no tracking, no BS.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 justify-center items-center pt-8">
            <a 
              href={`/${lang}/download`}
              className="group relative px-10 py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-bold text-xl hover:scale-105 transition-all shadow-2xl"
            >
              <span className="flex items-center gap-3">
                <DownloadIcon className="w-7 h-7" />
                Download Free
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </span>
            </a>
            
            <a 
              href="https://github.com/BANSAFAn/timiGS-"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-5 border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white rounded-full font-bold text-xl hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 transition-all"
            >
              <span className="flex items-center gap-3">
                <Star className="w-7 h-7" />
                {ghStats.stars > 0 ? ghStats.stars.toLocaleString() : '...'} Stars
              </span>
            </a>
          </div>

          {ghStats.downloads > 0 && (
            <div className="pt-8 text-gray-500 dark:text-gray-500">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{ghStats.downloads.toLocaleString()}+</span>
              <span className="ml-2 text-lg">downloads worldwide</span>
            </div>
          )}
        </div>
      </section>

      <section className="py-32 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-green-500 text-white flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform">
                <Shield className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                100% Private
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Your data never leaves your computer. No servers, no cloud, no tracking.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-blue-500 text-white flex items-center justify-center transform -rotate-3 hover:-rotate-6 transition-transform">
                <Lightning className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                Super Fast
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Built with Rust and Tauri. Lightweight and blazing fast performance.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-purple-500 text-white flex items-center justify-center transform rotate-2 hover:rotate-6 transition-transform">
                <Clock className="w-10 h-10" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                Auto Tracking
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Automatically tracks your active windows and apps in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="inline-block p-16 rounded-[3rem] bg-blue-600 text-white shadow-2xl transform hover:scale-105 transition-transform">
            <h2 className="text-5xl font-black mb-6">
              Ready to take control?
            </h2>
            <p className="text-2xl opacity-90 mb-10 font-light">
              Join thousands of users tracking their productivity
            </p>
            <a 
              href={`/${lang}/download`}
              className="inline-flex items-center gap-4 px-12 py-6 bg-white text-gray-900 rounded-full font-bold text-2xl hover:scale-110 transition-transform shadow-xl"
            >
              <DownloadIcon className="w-8 h-8" />
              Download Now
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
