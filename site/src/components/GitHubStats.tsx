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
      <div className={`rounded-3xl glass-panel p-8 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-apple-gray-400 font-medium">
            <div className="w-5 h-5 border-2 border-apple-blue border-t-transparent rounded-full animate-spin" />
            <span>Loading repository stats...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state for full variant
  if (error && variant === 'full') {
    return (
      <div className={`rounded-3xl glass-panel p-8 ${className}`}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="w-10 h-10 text-apple-gray-500 mb-3" />
          <p className="text-apple-gray-500 text-sm font-medium">Could not load repository stats</p>
          <a 
            href={`https://github.com/${owner}/${repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 text-apple-blue hover:text-apple-blue-dark text-sm font-medium transition-colors"
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
          <span className="font-bold font-display">{data.stars}</span>
        </div>
        <div className="flex items-center gap-1.5 text-apple-gray-400">
          <GitFork className="w-4 h-4" />
          <span className="font-display">{data.forks}</span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="font-bold text-white font-display">{data.stars}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <GitFork className="w-4 h-4 text-apple-blue" />
          <span className="font-bold text-white font-display">{data.forks}</span>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig[data.status].bg} border border-white/5`}>
          <StatusIcon className={`w-4 h-4 ${statusConfig[data.status].color}`} />
          <span className={`font-medium text-sm ${statusConfig[data.status].color}`}>{statusConfig[data.status].label}</span>
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={`rounded-3xl glass-panel p-8 ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h3 className="text-xl font-display font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-xl border border-white/10">
                <GithubIcon className="w-5 h-5 text-white" />
            </div>
          Repository Status
        </h3>
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full ${statusConfig[data.status].bg} border border-white/5`}>
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusConfig[data.status].color.replace('text-', 'bg-')} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusConfig[data.status].color.replace('text-', 'bg-')}`}></span>
          </span>
          <span className={`text-sm font-semibold ${statusConfig[data.status].color}`}>{statusConfig[data.status].label}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="group p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-yellow-500/30 transition-all duration-300 hover:scale-[1.02] hover:bg-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="text-apple-gray-400 text-sm font-medium">Stars</span>
          </div>
          <p className="text-3xl font-display font-bold text-white">{data.stars.toLocaleString()}</p>
        </div>

        <div className="group p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-apple-blue/30 transition-all duration-300 hover:scale-[1.02] hover:bg-white/10">
          <div className="flex items-center gap-2 mb-3">
            <GitFork className="w-5 h-5 text-apple-blue" />
            <span className="text-apple-gray-400 text-sm font-medium">Forks</span>
          </div>
          <p className="text-3xl font-display font-bold text-white">{data.forks.toLocaleString()}</p>
        </div>

        <div className="group p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all duration-300 hover:scale-[1.02] hover:bg-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-5 h-5 text-purple-400" />
            <span className="text-apple-gray-400 text-sm font-medium">Watchers</span>
          </div>
          <p className="text-3xl font-display font-bold text-white">{data.watchers.toLocaleString()}</p>
        </div>

        <div className="group p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/30 transition-all duration-300 hover:scale-[1.02] hover:bg-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-emerald-400" />
            <span className="text-apple-gray-400 text-sm font-medium">Last Update</span>
          </div>
          <p className="text-lg font-display font-bold text-white mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis px-1">{formatDate(data.lastCommit)}</p>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs font-medium text-apple-gray-500">
            Data refreshed in real-time
        </span>
        <a 
          href={`https://github.com/${owner}/${repo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-apple-blue hover:text-white text-sm font-medium transition-colors flex items-center gap-1 group"
        >
          View on GitHub 
          <span className="group-hover:translate-x-0.5 transition-transform">→</span>
        </a>
      </div>
    </div>
  );
};

// Mini icon component for the header
const GithubIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
    </svg>
)

export default GitHubStats;
