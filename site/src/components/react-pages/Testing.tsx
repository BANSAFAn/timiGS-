import React, { useState, useEffect } from "react";
import { Language } from "../../i18n/types";
import type { Translation } from "../../i18n/types";
import { GitCommit, Warning, ArrowSquareOut, Clock } from "@phosphor-icons/react";

interface TestingProps {
  lang: Language;
  t: Translation;
}

const TestingPage: React.FC<TestingProps> = ({ t }) => {
  const [commits, setCommits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://api.github.com/repos/BANSAFAn/timiGS-/commits?per_page=20")
      .then((res) => res.json())
      .then((data) => setCommits(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching commits:", err))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-5xl mx-auto py-12">
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-sm font-semibold mb-6">
          <Warning className="w-4 h-4" />
          Experimental Build
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          {t.nav.testing}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Latest development commits and experimental features. Use at your own risk.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <GitCommit className="w-5 h-5" />
            Recent Commits
          </h2>
          <a
            href="https://github.com/BANSAFAn/timiGS-/commits"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            View All
            <ArrowSquareOut className="w-4 h-4" />
          </a>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="flex gap-2">
              <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
              <div className="w-2 h-2 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {commits.map((commit) => (
              <a
                key={commit.sha}
                href={commit.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {commit.commit.message.split('\n')[0]}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-mono">{commit.sha.substring(0, 7)}</span>
                      <span>•</span>
                      <span>{commit.commit.author.name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(commit.commit.author.date)}
                      </span>
                    </div>
                  </div>
                  <ArrowSquareOut className="w-4 h-4 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors flex-shrink-0" />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 p-6 rounded-2xl border border-orange-200 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10">
        <div className="flex items-start gap-3">
          <Warning className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-300 mb-1">
              Experimental Features Warning
            </h3>
            <p className="text-sm text-orange-700 dark:text-orange-400">
              These builds contain untested features and may be unstable. Not recommended for production use.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestingPage;
