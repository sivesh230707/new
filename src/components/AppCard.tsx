import React from 'react';
import { Star, ShieldCheck, Download, Bookmark, Play, RefreshCw } from 'lucide-react';
import type { GitHubRepo, InstalledApp } from '../types';

interface AppCardProps {
  repo: GitHubRepo;
  installedApp?: InstalledApp;
  isFavorite: boolean;
  onOpenDetails: (repo: GitHubRepo) => void;
  onInstall: (repo: GitHubRepo) => void;
  onOpenApp: (appId: string) => void;
  onToggleFavorite: (repo: GitHubRepo) => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  repo,
  installedApp,
  isFavorite,
  onOpenDetails,
  onInstall,
  onOpenApp,
  onToggleFavorite,
}) => {
  const isVerified = repo.stargazers_count >= 250;
  const isInstalled = !!installedApp;
  const hasUpdate = installedApp?.hasUpdate;

  // Format numbers nicely
  const formatStars = (count: number) => {
    if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
    return count.toString();
  };

  // Format relative date
  const formatRelativeDate = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return 'today';
      if (diffDays === 1) return 'yesterday';
      if (diffDays < 30) return `${diffDays}d ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
      return `${Math.floor(diffDays / 365)}y ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 shadow-xs card-hover flex flex-col justify-between h-56 transition-all group">
      <div>
        {/* Header: Avatar, Name, Favorite */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div
            onClick={() => onOpenDetails(repo)}
            className="flex items-center gap-3 cursor-pointer overflow-hidden"
          >
            <img
              src={repo.owner.avatar_url}
              alt={repo.name}
              className="w-11 h-11 rounded-xl bg-slate-100 object-cover border border-slate-100 shrink-0"
              onError={(e) => {
                // fallback avatar
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="overflow-hidden">
              <h3 className="font-semibold text-slate-900 text-sm tracking-tight truncate group-hover:text-brand-600 transition-colors">
                {repo.name}
              </h3>
              <p className="text-xs text-slate-400 truncate">by {repo.owner.login}</p>
            </div>
          </div>

          <button
            onClick={() => onToggleFavorite(repo)}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shrink-0 ${
              isFavorite ? 'text-amber-500 fill-amber-500 hover:text-amber-600' : ''
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Description */}
        <p
          onClick={() => onOpenDetails(repo)}
          className="text-xs text-slate-500 line-clamp-2 leading-relaxed cursor-pointer mb-3"
        >
          {repo.description || 'No description provided by the author.'}
        </p>
      </div>

      {/* Footer: Metadata & Primary Action Button */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-1 text-slate-600">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{formatStars(repo.stargazers_count)}</span>
          </div>

          {isVerified ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px] font-medium bg-emerald-50 px-2 py-0.5 rounded-md">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">
              {formatRelativeDate(repo.pushed_at || repo.updated_at)}
            </span>
          )}
        </div>

        {/* ONE main button */}
        {hasUpdate ? (
          <button
            onClick={() => onInstall(repo)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Update</span>
          </button>
        ) : isInstalled ? (
          <button
            onClick={() => onOpenApp(installedApp.id)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 shadow-xs transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Open</span>
          </button>
        ) : (
          <button
            onClick={() => onInstall(repo)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-brand-500/20 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
        )}
      </div>
    </div>
  );
};
