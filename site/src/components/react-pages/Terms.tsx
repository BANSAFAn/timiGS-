import React, { useEffect, useRef, useState } from 'react';
import { Shield, Lock, Database, FileText, Scale, CheckCircle2 } from 'lucide-react';
import type { Translation } from '../../i18n/types';

interface TermsProps {
    t: Translation;
}

/* ── Scroll reveal hook ── */
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const Terms: React.FC<TermsProps> = ({ t }) => {
  const s1 = useInView();
  const s2 = useInView();
  const s3 = useInView();

  const sections = [
    {
      ref: s1,
      icon: <Lock className="w-7 h-7" />,
      bgIcon: <Lock className="w-40 h-40 md:w-48 md:h-48 text-white" />,
      iconBg: "bg-white/[0.06] border-white/[0.08]",
      iconColor: "text-white",
      title: t.terms.privacy_title,
      content: t.terms.privacy_content,
      list: [
        "No personal data collection",
        "Local-first architecture",
        "Zero telemetry & analytics",
        "Full data export available",
      ],
    },
    {
      ref: s2,
      icon: <Database className="w-7 h-7" />,
      bgIcon: <Database className="w-40 h-40 md:w-48 md:h-48 text-emerald-400" />,
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
      iconColor: "text-emerald-400",
      title: t.terms.data_title,
      content: t.terms.data_content,
    },
    {
      ref: s3,
      icon: <FileText className="w-7 h-7" />,
      bgIcon: <FileText className="w-40 h-40 md:w-48 md:h-48 text-purple-400" />,
      iconBg: "bg-purple-500/10 border-purple-500/20",
      iconColor: "text-purple-400",
      title: t.terms.license_title,
      content: t.terms.license_content,
      hasLicense: true,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-24 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute top-[-100px] left-[20%] w-[600px] h-[500px] bg-apple-blue/6 blur-[180px] rounded-full pointer-events-none -z-10 animate-glow-pulse" />

      {/* Header */}
      <div className="text-center mb-16 md:mb-24">
        <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] text-white mb-8 shadow-xl backdrop-blur-sm">
            <Scale className="w-8 h-8" />
          </div>
        </div>
        <h1 className="animate-fade-in-up text-4xl sm:text-5xl md:text-6xl font-display font-bold text-white tracking-tight mb-6 leading-[1.1]" style={{ animationDelay: "0.2s" }}>
          {t.terms.title}
        </h1>
        <div className="animate-fade-in-up flex items-center justify-center gap-2 text-sm text-apple-gray-500 font-mono" style={{ animationDelay: "0.35s" }}>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Last Updated: January 2026
        </div>
      </div>

      {/* Sections */}
      <div className="grid gap-8 md:gap-10 relative z-10">
        {sections.map((section, i) => (
          <div
            key={i}
            ref={section.ref.ref}
            className={`group relative transition-all duration-700 ${section.ref.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            style={{ transitionDelay: `${i * 100}ms` }}
          >
            <div className="relative p-8 sm:p-10 md:p-12 rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-all duration-500 hover:border-white/[0.1] hover:bg-white/[0.04]">
              {/* Background icon */}
              <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500">
                {section.bgIcon}
              </div>

              <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
                <div className={`p-3.5 rounded-xl ${section.iconBg} border ${section.iconColor} shadow-lg shrink-0`}>
                  {section.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-white mb-5 tracking-tight">
                    {section.title}
                  </h2>
                  <p className="text-sm sm:text-base text-apple-gray-300 leading-relaxed font-medium mb-5">
                    {section.content}
                  </p>

                  {section.list && (
                    <ul className="space-y-2.5">
                      {section.list.map((item, j) => (
                        <li key={j} className="flex items-center gap-3 text-apple-gray-400 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500/70 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.hasLicense && (
                    <div className="mt-6 p-6 rounded-xl bg-black/20 border border-white/[0.06]">
                      <h4 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
                        <Shield className="w-4 h-4 text-apple-gray-400" />
                        Mandatory Attribution
                      </h4>
                      <p className="text-sm text-apple-gray-400 mb-4 leading-relaxed">
                        The software is protected under the MIT License. Original Software developed by{" "}
                        <a href="https://github.com/BANSAFAn" target="_blank" rel="noopener noreferrer" className="text-white underline decoration-white/30 hover:decoration-white transition-all">BANSAFAn</a>.
                      </p>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.05] w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        <span className="text-xs text-apple-gray-300 font-mono uppercase tracking-wide">Project: TimiGS</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Terms;