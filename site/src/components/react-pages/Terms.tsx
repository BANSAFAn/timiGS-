import React, { useState } from "react";
import { Language } from "../../i18n/types";
import type { Translation } from "../../i18n/types";
import { ShieldCheck, ShieldWarning, Cookie, CloudArrowDown, Gavel, Handshake, TextIndent } from "@phosphor-icons/react";

interface TermsProps {
  lang: Language;
  t: Translation;
}

const Terms: React.FC<TermsProps> = ({ t }) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');

  const navItems = [
    { id: 'privacy', label: t.terms.privacy_title, icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'terms', label: t.terms.license_title, icon: <Gavel className="w-4 h-4" /> }
  ] as const;

  const getSections = () => {
    if (activeTab === 'privacy') {
      return [
        { icon: <ShieldWarning />, title: t.terms.privacy_title, content: t.terms.privacy_content },
        { icon: <CloudArrowDown />, title: t.terms.data_title, content: t.terms.data_content }
      ];
    }
    return [
      { icon: <Gavel />, title: t.terms.license_title, content: t.terms.license_content }
    ];
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-12 relative animate-fade-in-up">
      {/* Bg */}
      <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-cyber-pink opacity-[0.02] blur-[150px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="mb-12 relative z-10 text-center">
         <div className="hud-label text-cyber-pink mb-4 flex justify-center items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> [SYS.COMPLIANCE]
         </div>
         <h1 className="text-4xl md:text-5xl font-display font-black text-white uppercase tracking-tight mb-4">
           {t.nav.terms}
         </h1>
         <p className="text-sm font-mono text-gray-400 max-w-2xl mx-auto">
           {t.terms.title}
         </p>
      </div>

      <div className="cyber-card p-2 md:p-6 mb-16 relative">
         <div className="corner-brackets absolute inset-0 pointer-events-none" />
         
         {/* Switcher */}
         <div className="flex border-b border-[rgba(255,255,255,0.1)] mb-8 p-1 sm:p-0">
           {navItems.map((item) => (
             <button
               key={item.id}
               onClick={() => setActiveTab(item.id)}
               className={`flex-1 flex items-center justify-center gap-2 py-4 px-2 sm:px-6 font-mono text-xs sm:text-sm tracking-widest uppercase transition-all duration-300 relative ${
                 activeTab === item.id 
                   ? 'text-cyber-pink font-bold' 
                   : 'text-gray-500 hover:text-white'
               }`}
             >
               {item.icon}
               <span className="hidden sm:inline">{item.label}</span>
               {activeTab === item.id && (
                 <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyber-pink shadow-[0_0_10px_rgba(236,72,153,0.8)] animate-pulse" />
               )}
             </button>
           ))}
         </div>

         {/* Content container */}
         <div className="space-y-6 animate-fade-in-up px-2 sm:px-4" key={activeTab}>
            <div className="flex items-center gap-4 py-4 px-6 mb-6 rounded-lg bg-[rgba(236,72,153,0.05)] border border-[rgba(236,72,153,0.2)]">
               <ShieldCheck className="w-6 h-6 text-cyber-pink shrink-0" />
               <p className="font-mono text-xs text-cyber-pink leading-relaxed">
                 {activeTab === 'privacy' 
                   ? "All data is stored locally. We respect your privacy and do not transmit operational tracker metrics to external servers."
                   : "By using TimiGS, you agree to these operating conditions. The software is provided 'as is' without warranty."}
               </p>
            </div>

            {getSections().map((section, idx) => (
              <div 
                key={idx} 
                className="group p-6 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(255,255,255,0.02)] hover:border-[rgba(236,72,153,0.3)] transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-2.5 rounded bg-[rgba(236,72,153,0.1)] text-cyber-pink group-hover:scale-110 transition-transform">
                    {React.cloneElement(section.icon as React.ReactElement, { className: "w-5 h-5", weight: "duotone" })}
                  </div>
                  <h2 className="text-xl font-display font-bold text-white uppercase tracking-wider">{section.title}</h2>
                </div>
                <div className="font-mono text-sm text-gray-400 leading-relaxed pl-[3.25rem] border-l border-[rgba(255,255,255,0.05)] ml-5">
                   {section.content.split('\n').map((paragraph, i) => (
                     <p key={i} className="mb-4 last:mb-0 relative">
                        {/* Decorative bullet for paragraphs */}
                        <span className="absolute -left-6 top-2 w-1 h-1 bg-[rgba(236,72,153,0.3)] rounded-full group-hover:bg-cyber-pink transition-colors" />
                        {paragraph}
                     </p>
                   ))}
                </div>
              </div>
            ))}
         </div>
      </div>
      
      {/* Print / Export Actions */}
      <div className="flex justify-end gap-4 font-mono text-xs">
         <button className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors p-2" onClick={() => window.print()}>
            [PRINT_RECORD]
         </button>
      </div>
    </div>
  );
};

export default Terms;