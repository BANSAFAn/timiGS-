import React from 'react';
import { Shield, Lock, Database, FileText } from 'lucide-react';
import type { Translation } from '../../i18n/types';

interface TermsProps {
    t: Translation;
}

const Terms: React.FC<TermsProps> = ({ t }) => {

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-apple-blue/10 blur-[120px] rounded-full -z-10"></div>
        <div className="inline-flex p-4 rounded-3xl bg-white/5 text-apple-blue mb-8 border border-white/5">
            <Shield className="w-10 h-10" />
        </div>
        <h1 className="text-5xl md:text-6xl font-display font-bold mb-6 text-white tracking-tight">
          {t.terms.title}
        </h1>
      </div>

      <div className="grid gap-8">
        {/* Privacy Section */}
        <div className="p-10 rounded-3xl glass-panel border border-white/5 bg-white/5 relative overflow-hidden group hover:bg-white/10 transition-all duration-300">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Lock className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
              <Lock className="w-6 h-6 text-apple-gray-300" />
              {t.terms.privacy_title}
            </h2>
            <p className="text-apple-gray-300 leading-relaxed text-lg font-medium">
              {t.terms.privacy_content}
            </p>
          </div>
        </div>

        {/* Data Ownership Section */}
        <div className="p-10 rounded-3xl glass-panel border border-white/5 bg-white/5 relative overflow-hidden group hover:bg-white/10 transition-all duration-300">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Database className="w-32 h-32 text-emerald-500" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
              <Database className="w-6 h-6 text-emerald-400" />
              {t.terms.data_title}
            </h2>
            <p className="text-apple-gray-300 leading-relaxed text-lg font-medium">
              {t.terms.data_content}
            </p>
          </div>
        </div>

          {/* License Section */}
          <div className="p-10 rounded-3xl glass-panel border border-white/5 bg-white/5 relative overflow-hidden group hover:bg-white/10 transition-all duration-300">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <FileText className="w-32 h-32 text-purple-500" />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
                <FileText className="w-6 h-6 text-purple-400" />
                {t.terms.license_title}
              </h2>
              <div className="text-apple-gray-300 leading-relaxed text-lg space-y-4 font-medium">
                <p>{t.terms.license_content}</p>
                
                <div className="p-6 rounded-2xl bg-black/20 border border-white/5 mt-6">
                  <h4 className="text-white font-bold mb-2">Mandatory Attribution</h4>
                  <p className="text-sm text-apple-gray-400 mb-2">
                    Original Software developed by <a href="https://github.com/BANSAFAn" target="_blank" rel="noopener noreferrer" className="text-apple-blue hover:text-white font-semibold transition-colors">BANSAFAn</a>.
                  </p>
                  <p className="text-xs text-apple-gray-500 uppercase tracking-wide">
                    The name "TimiGS" must be preserved in all forks.
                  </p>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Terms;