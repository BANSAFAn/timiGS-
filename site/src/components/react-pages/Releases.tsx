import React, { useState, useEffect } from "react";
import { marked } from "marked";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css";
import { Language } from "../../i18n/types";
import type { Translation } from "../../i18n/types";
import { GitBranch, Star, DownloadSimple, CheckCircle, WarningCircle, ArrowsClockwise, Package } from "@phosphor-icons/react";

interface ReleaseProps {
  lang: Language;
  t: Translation;
}

const ReleasesPage: React.FC<ReleaseProps> = ({ t }) => {
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://api.github.com/repos/BANSAFAn/timiGS-/releases?per_page=10")
      .then((res) => res.json())
      .then((data) => setReleases(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching releases:", err))
      .finally(() => setLoading(false));

    marked.setOptions({
      highlight: function (code: string, lang: string) {
        const language = hljs.getLanguage(lang) ? lang : "plaintext";
        return hljs.highlight(code, { language }).value;
      },
    } as any);
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="max-w-5xl mx-auto py-12">
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-sm font-semibold mb-6">
          <GitBranch className="w-4 h-4" />
          Release History
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          {t.nav.releases}
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-400">
          Complete history of updates, patches, and feature additions.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
          <ArrowsClockwise className="w-10 h-10 text-brand-500 animate-spin" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Loading releases...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {releases.map((release, index) => (
            <div key={release.id} className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 hover:shadow-xl hover:border-gray-300 dark:hover:border-slate-700 transition-all">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {release.name || release.tag_name}
                    </h2>
                    {index === 0 && (
                      <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold">
                        Latest
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    {release.prerelease ? (
                      <span className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
                        <WarningCircle className="w-4 h-4" />
                        Pre-release
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        Stable
                      </span>
                    )}
                    <span>•</span>
                    <span>{formatDate(release.published_at)}</span>
                  </div>
                </div>

                <a
                  href={release.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium whitespace-nowrap"
                >
                  View on GitHub
                </a>
              </div>

              {release.body && (
                <div 
                  className="prose prose-sm dark:prose-invert max-w-none mb-6 text-gray-700 dark:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: marked.parse(release.body) as string }}
                />
              )}

              {release.assets && release.assets.length > 0 && (
                <div className="pt-6 border-t border-gray-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      Downloads ({release.assets.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {release.assets.map((asset: any) => (
                      <a
                        key={asset.id}
                        href={asset.browser_download_url}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <DownloadSimple className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {asset.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatSize(asset.size)}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                          {asset.download_count}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReleasesPage;
