import React, { useEffect, useState } from 'react';
import { Language } from '../../i18n/types';
import type { Translation } from '../../i18n/types';
import { GitCommit, Download, AlertTriangle, Clock, User, ExternalLink, Package } from 'lucide-react';

interface TestingProps {
  lang: Language;
  t: Translation;
}

interface Commit {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
  html_url: string;
  author?: { avatar_url: string; login: string };
}

interface WorkflowArtifact {
  id: number;
  name: string;
  size_in_bytes: number;
  archive_download_url: string;
  created_at: string;
}

const REPO = 'BANSAFAn/timiGS-';

const Testing: React.FC<TestingProps> = ({ lang, t }) => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [preReleases, setPreReleases] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`https://api.github.com/repos/${REPO}/commits?per_page=10`).then(r => r.json()),
      fetch(`https://api.github.com/repos/${REPO}/releases`).then(r => r.json()),
    ]).then(([commitsData, releasesData]) => {
      setCommits(Array.isArray(commitsData) ? commitsData : []);
      const pre = Array.isArray(releasesData) ? releasesData.filter((r: any) => r.prerelease) : [];
      setPreReleases(pre);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const formatDate = (d: string) => new Date(d).toLocaleDateString(lang, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const formatSize = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1) + ' MB';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-apple-gray-400">
          <div className="w-5 h-5 border-2 border-apple-blue border-t-transparent rounded-full animate-spin" />
          <span className="text-lg font-medium">{t.downloads.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400 tracking-wide mb-4">
          <AlertTriangle className="w-3.5 h-3.5" />
          {t.testing.alpha_warning.split('—')[0].trim()}
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-3">{t.testing.title}</h1>
        <p className="text-lg text-apple-gray-400">{t.testing.subtitle}</p>
      </div>

      {/* Latest Commits */}
      <section>
        <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
          <GitCommit className="w-6 h-6 text-apple-blue" />
          {t.testing.latest_commit}
        </h2>
        <div className="space-y-3">
          {commits.length === 0 ? (
            <p className="text-apple-gray-500">{t.testing.no_commits}</p>
          ) : commits.map((c) => (
            <a
              key={c.sha}
              href={c.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-2xl bg-apple-gray-900/40 border border-white/5 hover:border-white/10 hover:bg-apple-gray-900/60 transition-all group"
            >
              <div className="flex items-start gap-3">
                {c.author?.avatar_url && (
                  <img src={c.author.avatar_url} alt="" className="w-8 h-8 rounded-full mt-0.5 ring-1 ring-white/10" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate group-hover:text-apple-blue transition-colors">
                    {c.commit.message.split('\n')[0]}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-apple-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {c.author?.login || c.commit.author.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(c.commit.author.date)}
                    </span>
                    <code className="px-1.5 py-0.5 rounded bg-white/5 font-mono text-[10px]">
                      {c.sha.slice(0, 7)}
                    </code>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-apple-gray-600 group-hover:text-apple-blue transition-colors flex-shrink-0 mt-1" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Pre-release / Test Builds */}
      <section>
        <h2 className="text-2xl font-display font-bold text-white mb-6 flex items-center gap-3">
          <Package className="w-6 h-6 text-emerald-400" />
          {t.testing.test_builds}
        </h2>

        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15 mb-6">
          <p className="text-sm text-amber-300 font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {t.testing.alpha_warning}
          </p>
        </div>

        {preReleases.length === 0 ? (
          <div className="p-8 rounded-2xl bg-apple-gray-900/40 border border-dashed border-white/10 text-center">
            <Package className="w-10 h-10 text-apple-gray-600 mx-auto mb-3" />
            <p className="text-apple-gray-500">{t.downloads.no_assets}</p>
          </div>
        ) : preReleases.map((rel: any) => (
          <div key={rel.id} className="mb-6 p-5 rounded-2xl bg-apple-gray-900/40 border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-widest border border-amber-500/30">
                Pre-release
              </span>
              <h3 className="text-lg font-bold text-white">{rel.name || rel.tag_name}</h3>
              <span className="text-xs text-apple-gray-500">{formatDate(rel.published_at)}</span>
            </div>
            {rel.body && (
              <p className="text-sm text-apple-gray-400 mb-4 whitespace-pre-line line-clamp-3">{rel.body}</p>
            )}
            <div className="space-y-2">
              {(rel.assets || []).map((asset: any) => (
                <a
                  key={asset.id}
                  href={asset.browser_download_url}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all group/btn"
                >
                  <div className="flex items-center gap-3">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-white font-medium">{asset.name}</span>
                  </div>
                  <span className="text-xs text-apple-gray-500">{formatSize(asset.size)}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Testing;
