import React from 'react';
import { Shield, Lock, Database, FileText } from 'lucide-react';
import { Translation } from '../../i18n/types';

interface TermsProps {
    t: Translation;
}

const Terms: React.FC<TermsProps> = ({ t }) => {

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 blur-[120px] rounded-full -z-10"></div>
        <div className="inline-flex p-3 rounded-2xl bg-sky-500/10 text-sky-400 mb-6">
            <Shield className="w-10 h-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
          {t.terms.title}
        </h1>
      </div>

      <div className="grid gap-8">
        {/* Privacy Section */}
        <div className="p-8 rounded-2xl glass-panel border border-slate-800 bg-slate-900/50 relative overflow-hidden group hover:border-sky-500/30 transition-all">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Lock className="w-32 h-32 text-sky-500" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Lock className="w-6 h-6 text-sky-400" />
              {t.terms.privacy_title}
            </h2>
            <p className="text-slate-300 leading-relaxed text-lg">
              {t.terms.privacy_content}
            </p>
          </div>
        </div>

        {/* Data Ownership Section */}
        <div className="p-8 rounded-2xl glass-panel border border-slate-800 bg-slate-900/50 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Database className="w-32 h-32 text-emerald-500" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <Database className="w-6 h-6 text-emerald-400" />
              {t.terms.data_title}
            </h2>
            <p className="text-slate-300 leading-relaxed text-lg">
              {t.terms.data_content}
            </p>
          </div>
        </div>

          {/* License Section */}
          <div class="p-8 rounded-2xl glass-panel border border-slate-800 bg-slate-900/50 relative overflow-hidden group hover:border-purple-500/30 transition-all">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <FileText className="w-32 h-32 text-purple-500" />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                <FileText className="w-6 h-6 text-purple-400" />
                {t.terms.license_title}
              </h2>
              <div className="text-slate-300 leading-relaxed text-lg space-y-4">
                <p>{t.terms.license_content}</p>
                
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 mt-4">
                  <h4 className="text-white font-bold mb-2">Mandatory Attribution</h4>
                  <p className="text-sm text-slate-400 mb-2">
                    Original Software developed by <a href="https://github.com/BANSAFAn" target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 font-medium">BANSAFAn</a>.
                  </p>
                  <p className="text-xs text-slate-500">
                    The name "TimiGS" must be preserved in all forks and distributions.
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