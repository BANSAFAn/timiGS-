import React, { useState } from "react";
import { Language } from "../../i18n/types";
import type { Translation } from "../../i18n/types";
import { ShieldCheck, Gavel } from "@phosphor-icons/react";

interface TermsProps {
  lang: Language;
  t: Translation;
}

const Terms: React.FC<TermsProps> = ({ t }) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-semibold mb-6">
          <ShieldCheck className="w-4 h-4" />
          Legal & Privacy
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          {t.nav.terms}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {t.terms.title}
        </p>
      </div>

      <div className="flex gap-2 mb-8 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'privacy'
              ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          {t.terms.privacy_title}
        </button>
        <button
          onClick={() => setActiveTab('terms')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'terms'
              ? 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-md'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Gavel className="w-4 h-4" />
          {t.terms.license_title}
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
        {activeTab === 'privacy' ? (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t.terms.privacy_title}</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                <p>{t.terms.privacy_content}</p>
              </div>
            </div>
            <div className="pt-8 border-t border-gray-200 dark:border-slate-800">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t.terms.data_title}</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                <p>{t.terms.data_content}</p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t.terms.license_title}</h2>
            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
              <p>{t.terms.license_content}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Terms;
