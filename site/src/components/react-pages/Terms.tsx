import React, { useState } from "react";
import { Language } from "../../i18n/types";
import type { Translation } from "../../i18n/types";
import { ShieldCheck, Gavel, Cpu, Lock, ShareNetwork as Share2 } from "@phosphor-icons/react";

interface TermsProps {
  lang: Language;
  t: Translation;
}

const Terms: React.FC<TermsProps> = ({ lang, t }) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'p2p' | 'terms'>('privacy');

  return (
    <div className="max-w-4xl mx-auto py-12 font-mono">
      <div className="mb-12 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-[var(--brand-primary)] bg-[var(--bg-tertiary)] text-[var(--brand-primary)] text-sm font-bold">
          <ShieldCheck className="w-4 h-4" />
          [ LEGAL & DATA PRIVACY POLICY ]
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-[var(--brand-primary)] font-mono">
          {t.nav.terms}
        </h1>
        <p className="text-lg text-[var(--text-secondary)] font-mono">
          {t.terms.title}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 p-1 border border-[var(--border)] bg-[var(--bg-secondary)]">
        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all ${
            activeTab === 'privacy'
              ? 'border border-[var(--brand-primary)] bg-[var(--bg-tertiary)] text-[var(--brand-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--brand-primary)]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          [ {t.terms.privacy_title.toUpperCase()} ]
        </button>
        <button
          onClick={() => setActiveTab('p2p')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all ${
            activeTab === 'p2p'
              ? 'border border-[var(--brand-primary)] bg-[var(--bg-tertiary)] text-[var(--brand-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--brand-primary)]'
          }`}
        >
          <Share2 className="w-4 h-4" />
          [ {(t.terms.p2p_tab_title || "P2P & LOCAL DATA GUARANTEE").toUpperCase()} ]
        </button>
        <button
          onClick={() => setActiveTab('terms')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition-all ${
            activeTab === 'terms'
              ? 'border border-[var(--brand-primary)] bg-[var(--bg-tertiary)] text-[var(--brand-primary)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--brand-primary)]'
          }`}
        >
          <Gavel className="w-4 h-4" />
          [ {t.terms.license_title.toUpperCase()} ]
        </button>
      </div>

      <div className="card p-8 border border-[var(--brand-primary)] bg-[var(--bg-secondary)]">
        {activeTab === 'privacy' && (
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-[var(--brand-primary)]" />
                <h2 className="text-2xl font-bold text-[var(--brand-primary)] font-mono">{t.terms.privacy_title}</h2>
              </div>
              <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed font-mono">
                <p>{t.terms.privacy_content}</p>
                <div className="p-4 border border-[var(--border)] bg-[var(--bg-tertiary)] text-sm space-y-2">
                  <p className="font-bold text-[var(--brand-primary)]">{t.terms.zero_telemetry_title || "> ZERO TELEMETRY POLICY:"}</p>
                  <p>{t.terms.zero_telemetry_desc || "TimiGS does not harvest, transmit, track, or upload any user metrics, window titles, activity logs, typed text, or personal telemetry to external servers. Your data stays 100% offline on your device."}</p>
                </div>
              </div>
            </div>
            <div className="pt-8 border-t border-[var(--border)]">
              <div className="flex items-center gap-3 mb-4">
                <Cpu className="w-6 h-6 text-[var(--brand-primary)]" />
                <h2 className="text-2xl font-bold text-[var(--brand-primary)] font-mono">{t.terms.data_title}</h2>
              </div>
              <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed font-mono">
                <p>{t.terms.data_content}</p>
                <p>{t.terms.sqlite_storage_desc || "All database records are stored in a local SQLite file (timigs_data.db). You maintain full ownership, encryption keys, and complete control to inspect, export, or permanently erase your data at any moment."}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'p2p' && (
          <div className="space-y-8 font-mono">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Share2 className="w-6 h-6 text-[var(--brand-primary)]" />
                <h2 className="text-2xl font-bold text-[var(--brand-primary)]">{t.terms.p2p_section_title || "Peer-to-Peer (P2P) Privacy & Direct Data Transfer"}</h2>
              </div>
              <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
                <p>{t.terms.p2p_intro || "When using TimiGS Peer-to-Peer (P2P) features to synchronize data across your devices or share reports with peers:"}</p>
                <div className="p-5 border border-[var(--brand-primary)] bg-[var(--bg-tertiary)] space-y-3">
                  <p className="font-bold text-[var(--brand-primary)]">{t.terms.p2p_direct_transport_title || "> DIRECT PEER TRANSPORT:"}</p>
                  <p>{t.terms.p2p_direct_transport_desc || "All P2P connections are established directly between authorized peer devices using encrypted WebRTC / local socket protocols."}</p>
                  <p className="font-bold text-[var(--brand-primary)]">{t.terms.p2p_no_cloud_title || "> NO INTERMEDIARY CLOUD STORAGE:"}</p>
                  <p>{t.terms.p2p_no_cloud_desc || "Data packets travel directly from sender to receiver. Zero data is cached, stored, sniffed, or logged on any cloud server or middleman infrastructure."}</p>
                  <p className="font-bold text-[var(--brand-primary)]">{t.terms.p2p_no_stolen_title || "> NOTHING IS STOLEN OR EXFILTRATED:"}</p>
                  <p>{t.terms.p2p_no_stolen_desc || "Neither BANSAFAn nor any third party has access to your P2P streams, sync keys, or session logs. You retain 100% data sovereignty."}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-6 font-mono">
            <div className="flex items-center gap-3 mb-4">
              <Gavel className="w-6 h-6 text-[var(--brand-primary)]" />
              <h2 className="text-2xl font-bold text-[var(--brand-primary)]">{t.terms.license_title}</h2>
            </div>
            <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed">
              <p>{t.terms.license_content}</p>
              <div className="p-4 border border-[var(--border)] bg-[var(--bg-tertiary)] text-sm">
                <p className="font-bold text-[var(--brand-primary)]">{t.terms.license_sub_title || "> TimiGS Public License (TPL) v1.0:"}</p>
                <p>{t.terms.license_sub_desc || "Free to use, inspect, modify, and distribute with proper attribution to BANSAFAn. Commercial and open-source derivative works must preserve the \"TimiGS\" project reference and local privacy guarantees."}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Terms;
