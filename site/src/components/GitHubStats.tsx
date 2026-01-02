import React, { useEffect, useState } from 'react';
import { Star, GitFork, Eye, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface GitHubStatsProps {
  owner?: string;
  repo?: string;
  variant?: 'compact' | 'full' | 'minimal';
  className?: string;
}

interface RepoData {
  stars: number;
  forks: number;
  watchers: number;
  lastCommit: string;
  status: 'active' | 'moderate' | 'inactive';
}

const GitHubStats: React.FC<GitHubStatsProps> = ({ 
  owner = 'BANSAFAn', 
  repo = 'timiGS-',
  variant = 'full',
  className = ''
}) => {
  const [data, setData] = useState<RepoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);

        if (repoRes.ok) {
          const repoData = await repoRes.json();
          
          const lastPush = new Date(repoData.pushed_at);
          const daysSinceLastPush = Math.floor((Date.now() - lastPush.getTime()) / (1000 * 60 * 60 * 24));
          
          let status: 'active' | 'moderate' | 'inactive' = 'active';
          if (daysSinceLastPush > 30) status = 'inactive';
          else if (daysSinceLastPush > 7) status = 'moderate';

          setData({
            stars: repoData.stargazers_count || 0,
            forks: repoData.forks_count || 0,
            watchers: repoData.subscribers_count || 0,
            lastCommit: repoData.pushed_at,
            status
          });
          setError(false);
        } else {
          setError(true);
        }
      } catch (e) {
        console.error('Failed to fetch GitHub stats', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [owner, repo]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const statusConfig = {
    active: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Active' },
    moderate: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Moderate' },
    inactive: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Inactive' }
  };

  // Show nothing if loading or error for minimal/compact
  if ((loading || error) && variant !== 'full') {
    return null;
  }

  // Loading state for full variant
  if (loading && variant === 'full') {
    return (
      <div className={`rounded-2xl glass-panel border border-slate-800/50 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading repository stats...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state for full variant
  if (error && variant === 'full') {
    return (
      <div className={`rounded-2xl glass-panel border border-slate-800/50 p-6 ${className}`}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="w-10 h-10 text-slate-600 mb-3" />
          <p className="text-slate-500 text-sm">Could not load repository stats</p>
          <a 
            href={`https://github.com/${owner}/${repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 text-sky-400 hover:text-sky-300 text-sm transition-colors"
          >
            View on GitHub →
          </a>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const StatusIcon = statusConfig[data.status].icon;

  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="flex items-center gap-1.5 text-yellow-400">
          <Star className="w-4 h-4 fill-current" />
          <span className="font-bold">{data.stars}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <GitFork className="w-4 h-4" />
          <span>{data.forks}</span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="font-bold text-white">{data.stars}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700">
          <GitFork className="w-4 h-4 text-sky-400" />
          <span className="font-bold text-white">{data.forks}</span>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig[data.status].bg} border border-slate-700`}>
          <StatusIcon className={`w-4 h-4 ${statusConfig[data.status].color}`} />
          <span className={`font-medium ${statusConfig[data.status].color}`}>{statusConfig[data.status].label}</span>
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={`rounded-2xl glass-panel border border-slate-800/50 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          Repository Status
        </h3>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusConfig[data.status].bg}`}>
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusConfig[data.status].color.replace('text-', 'bg-')} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${statusConfig[data.status].color.replace('text-', 'bg-')}`}></span>
          </span>
          <span className={`text-sm font-medium ${statusConfig[data.status].color}`}>{statusConfig[data.status].label}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="group p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-yellow-500/30 transition-all hover:scale-105">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="text-slate-400 text-sm">Stars</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.stars.toLocaleString()}</p>
        </div>

        <div className="group p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-sky-500/30 transition-all hover:scale-105">
          <div className="flex items-center gap-2 mb-2">
            <GitFork className="w-5 h-5 text-sky-400" />
            <span className="text-slate-400 text-sm">Forks</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.forks.toLocaleString()}</p>
        </div>

        <div className="group p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-purple-500/30 transition-all hover:scale-105">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-5 h-5 text-purple-400" />
            <span className="text-slate-400 text-sm">Watchers</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.watchers.toLocaleString()}</p>
        </div>

        <div className="group p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all hover:scale-105">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <span className="text-slate-400 text-sm">Last Update</span>
          </div>
          <p className="text-xl font-bold text-white">{formatDate(data.lastCommit)}</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-end">
        <a 
          href={`https://github.com/${owner}/${repo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-400 hover:text-sky-300 text-sm font-medium transition-colors"
        >
          View on GitHub →
        </a>
      </div>
    </div>
  );
};

export default GitHubStats;
