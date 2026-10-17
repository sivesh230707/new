import React, { useState } from 'react';
import { Bookmark, Clock, Star, Play, Trash2, DownloadCloud, ExternalLink, ArrowRight } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import type { FavoriteApp, RecentDownload, GitHubRepo, InstalledApp } from '../types';

interface FavoritesViewProps {
  favorites: FavoriteApp[];
  history: RecentDownload[];
  installedApps: InstalledApp[];
  onOpenRepoByName: (fullName: string) => void;
  onOpenApp: (appId: string) => void;
  onRemoveFavorite: (repo: GitHubRepo) => void;
  onExplore: () => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({
  favorites,
  history,
  installedApps,
  onOpenRepoByName,
  onOpenApp,
  onRemoveFavorite,
  onExplore,
}) => {
  const [subTab, setSubTab] = useState<'favorites' | 'history'>('favorites');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Favorites & Activity</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quickly access your saved repositories and review your download history.
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setSubTab('favorites')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'favorites'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved Apps ({favorites.length})</span>
          </button>
          <button
            onClick={() => setSubTab('history')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Download History ({history.length})</span>
          </button>
        </div>
      </div>

      {/* Subtab 1: Favorites */}
      {subTab === 'favorites' && (
        <>
          {favorites.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="No favorites saved yet"
              description="Click the bookmark icon on any application card in the Explore tab to save it here for quick access."
              actionText="Browse Applications"
              onAction={onExplore}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {favorites.map((fav) => {
                const installed = installedApps.find(
                  (a) => a.id.toLowerCase() === fav.repoFullName.toLowerCase()
                );
                return (
                  <div
                    key={fav.repoFullName}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-48 hover:border-slate-300 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div
                          onClick={() => onOpenRepoByName(fav.repoFullName)}
                          className="flex items-center gap-3 cursor-pointer overflow-hidden"
                        >
                          <img
                            src={fav.avatar_url}
                            alt={fav.name}
                            className="w-10 h-10 rounded-xl bg-slate-100 object-cover border border-slate-100 shrink-0"
                          />
                          <div className="overflow-hidden">
                            <h3 className="font-semibold text-slate-900 text-sm tracking-tight truncate hover:text-brand-600 transition-colors">
                              {fav.name}
                            </h3>
                            <p className="text-xs text-slate-400 truncate">by {fav.owner}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            // Dummy repo object for toggle
                            onRemoveFavorite({
                              id: 0,
                              name: fav.name,
                              full_name: fav.repoFullName,
                              owner: { login: fav.owner, avatar_url: fav.avatar_url, html_url: '' },
                              html_url: '',
                              description: fav.description,
                              stargazers_count: fav.stars,
                              forks_count: 0,
                              open_issues_count: 0,
                              updated_at: '',
                              pushed_at: '',
                            });
                          }}
                          className="p-1.5 text-amber-500 hover:text-slate-400 rounded-lg hover:bg-slate-50 transition-colors"
                          title="Remove favorite"
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>
                      </div>

                      <p
                        onClick={() => onOpenRepoByName(fav.repoFullName)}
                        className="text-xs text-slate-500 line-clamp-2 leading-relaxed cursor-pointer"
                      >
                        {fav.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{(fav.stars / 1000).toFixed(1)}k</span>
                      </div>

                      {installed ? (
                        <button
                          onClick={() => onOpenApp(installed.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-all"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Open</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenRepoByName(fav.repoFullName)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-all"
                        >
                          <span>View App</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Subtab 2: History */}
      {subTab === 'history' && (
        <>
          {history.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No downloads yet"
              description="Your download and installation activity will be logged here automatically."
            />
          ) : (
            <div className="bg-white border border-slate-200/90 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-xs">
              {history.map((item) => (
                <div key={item.id} className="p-4 px-6 flex items-center justify-between gap-4 hover:bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                      <DownloadCloud className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                      <p className="text-[11px] text-slate-400">
                        Version {item.version} • {new Date(item.date).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-medium text-[11px] rounded-md">
                      Successful
                    </span>
                    <button
                      onClick={() => onOpenRepoByName(item.repoFullName)}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
