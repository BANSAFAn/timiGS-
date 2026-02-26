import React from 'react';
import { Shield, Lock, Database, FileText, Scale, CheckCircle2 } from 'lucide-react';
import type { Translation } from '../../i18n/types';

interface TermsProps {
    t: Translation;
}

const Terms: React.FC<TermsProps> = ({ t }) => {

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-12 sm:py-16 md:py-24">
      {/* Header */}
      <div className="text-center mb-16 sm:mb-20 md:mb-24 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[400px] sm:h-[600px] bg-apple-blue/10 blur-[100px] sm:blur-[120px] rounded-full -z-10 pointer-events-none opacity-60"></div>
        <div className="inline-flex items-center justify-center p-3 sm:p-4 rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-br from-white/10 to-white/5 text-white mb-6 sm:mb-8 border border-white/10 shadow-2xl backdrop-blur-xl">
            <Scale className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl lg:text-7xl font-display font-bold mb-4 sm:mb-6 md:mb-8 text-white tracking-tight px-2">
          {t.terms.title}
        </h1>
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-apple-gray-400 font-mono uppercase tracking-widest px-4">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Last Updated: January 2026
        </div>
      </div>

      <div className="grid gap-6 sm:gap-8 md:gap-12 relative z-10">
        {/* Privacy Section */}
        <div className="group relative">
            <div className="absolute -inset-0.5 rounded-[2.5rem] bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition duration-500 blur-xl"></div>
            <div className="relative p-6 sm:p-8 md:p-10 lg:p-14 rounded-[2.5rem] glass-panel border border-white/5 bg-[#1c1c1e]/60 overflow-hidden transition-transform duration-500 group-hover:scale-[1.01]">
                <div className="absolute top-0 right-0 p-8 sm:p-10 md:p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 transform group-hover:scale-110">
                    <Lock className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 text-white" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
                    <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-white shadow-inner shrink-0">
                        <Lock className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-white mb-4 sm:mb-6 tracking-tight">
                            {t.terms.privacy_title}
                        </h2>
                        <div className="prose prose-invert prose-sm sm:prose-base md:prose-lg max-w-none">
                            <p className="text-apple-gray-300 leading-relaxed font-medium text-sm sm:text-base">
                                {t.terms.privacy_content}
                            </p>
                            <ul className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                                <li className="flex items-center gap-2 sm:gap-3 text-apple-gray-400 text-xs sm:text-base">
                                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500/80 shrink-0" />
                                    <span>No personal data collection</span>
                                </li>
                                <li className="flex items-center gap-2 sm:gap-3 text-apple-gray-400 text-xs sm:text-base">
                                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500/80 shrink-0" />
                                    <span>Local-first architecture</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Data Ownership Section */}
        <div className="group relative">
             <div className="absolute -inset-0.5 rounded-[2.5rem] bg-gradient-to-br from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition duration-500 blur-xl"></div>
             <div className="relative p-6 sm:p-8 md:p-10 lg:p-14 rounded-[2.5rem] glass-panel border border-white/5 bg-[#1c1c1e]/60 overflow-hidden transition-transform duration-500 group-hover:scale-[1.01]">
                <div className="absolute top-0 right-0 p-8 sm:p-10 md:p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 transform group-hover:scale-110">
                    <Database className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 text-emerald-400" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
                    <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-inner shrink-0">
                        <Database className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-white mb-4 sm:mb-6 tracking-tight">
                            {t.terms.data_title}
                        </h2>
                        <div className="prose prose-invert prose-sm sm:prose-base md:prose-lg max-w-none">
                            <p className="text-apple-gray-300 leading-relaxed font-medium text-sm sm:text-base">
                                {t.terms.data_content}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

          {/* License Section */}
          <div className="group relative">
              <div className="absolute -inset-0.5 rounded-[2.5rem] bg-gradient-to-br from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition duration-500 blur-xl"></div>
              <div className="relative p-6 sm:p-8 md:p-10 lg:p-14 rounded-[2.5rem] glass-panel border border-white/5 bg-[#1c1c1e]/60 overflow-hidden transition-transform duration-500 group-hover:scale-[1.01]">
                <div className="absolute top-0 right-0 p-8 sm:p-10 md:p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 transform group-hover:scale-110">
                    <FileText className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 text-purple-400" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
                     <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-inner shrink-0">
                        <FileText className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-white mb-4 sm:mb-6 tracking-tight">
                            {t.terms.license_title}
                        </h2>
                        <div className="text-apple-gray-300 leading-relaxed text-sm sm:text-base space-y-6 sm:space-y-8 font-medium">
                            <p>{t.terms.license_content}</p>

                            <div className="relative p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-black/40 border border-white/10 overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                <h4 className="text-white font-bold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                                    <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-apple-gray-400" />
                                    Mandatory Attribution
                                </h4>
                                <p className="text-xs sm:text-sm text-apple-gray-400 mb-3 sm:mb-4 leading-relaxed">
                                    The software is protected under the MIT License. Original Software developed by <a href="https://github.com/BANSAFAn" target="_blank" rel="noopener noreferrer" className="text-white underline decoration-white/30 hover:decoration-white transition-all">BANSAFAn</a>.
                                </p>
                                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg bg-white/5 border border-white/5 w-fit">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                                    <p className="text-[10px] sm:text-xs text-apple-gray-300 font-mono uppercase tracking-wide">
                                        Project: TimiGS
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Terms;