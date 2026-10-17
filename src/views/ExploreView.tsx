import React, { useState, useEffect } from 'react';
import { AppCard } from '../components/AppCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { CategoryChips, Category, CATEGORIES } from '../components/CategoryChips';
import { EmptyState } from '../components/EmptyState';
import { Sparkles, AlertCircle, RefreshCw, Search } from 'lucide-react';
import type { GitHubRepo, InstalledApp } from '../types';

interface ExploreViewProps {
  searchQuery: string;
  onClearSearch: () => void;
  installedApps: InstalledApp[];
  favorites: string[]; // list of repo full_name
  onOpenDetails: (repo: GitHubRepo) => void;
  onInstall: (repo: GitHubRepo) => void;
  onOpenApp: (appId: string) => void;
  onToggleFavorite: (repo: GitHubRepo) => void;
}

// Curated list of popular Windows desktop applications on GitHub
const CURATED_REPOS: string[] = [
  'obsproject/obs-studio',
  'ShareX/ShareX',
  'notepad-plus-plus/notepad-plus-plus',
  'pbatard/rufus',
  'HandBrake/HandBrake',
  'microsoft/PowerToys',
  'keepassxreboot/keepassxc',
  'flameshot-org/flameshot',
  'audacity/audacity',
  'bleachbit/bleachbit',
  'Transmission-Remote-GUI/transgui',
  'localsend/localsend',
];

export const ExploreView: React.FC<ExploreViewProps> = ({
  searchQuery,
  onClearSearch,
  installedApps,
  favorites,
  onOpenDetails,
  onInstall,
  onOpenApp,
  onToggleFavorite,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApps = async (query: string, categoryId: string) => {
    setLoading(true);
    setError(null);
    try {
      let finalQuery = query.trim();

      if (!finalQuery) {
        const cat = CATEGORIES.find((c) => c.id === categoryId);
        if (cat && cat.query) {
          finalQuery = `${cat.query} stars:>500`;
        }
      }

      if (!finalQuery && categoryId === 'all') {
        // Fetch curated batch first
        const results = await window.electronAPI.githubSearch(
          'stars:>10000 (topic:windows OR topic:desktop-app OR topic:tools) archived:false'
        );
        setRepos(results.items || []);
      } else {
        const results = await window.electronAPI.githubSearch(finalQuery);
        setRepos(results.items || []);
      }
    } catch (err: any) {
      console.error('Error fetching applications:', err);
      setError(
        err?.message ||
          'Could not load software catalog. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Debounced search on query or category change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchApps(searchQuery, selectedCategory);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  const handleSelectCategory = (cat: Category) => {
    setSelectedCategory(cat.id);
  };

  const isSearchActive = !!searchQuery.trim();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Category Chips Bar */}
      <div className="flex items-center justify-between gap-4">
        <CategoryChips
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
        />
        {isSearchActive && (
          <button
            onClick={onClearSearch}
            className="text-xs text-brand-600 hover:text-brand-700 font-medium shrink-0"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Section Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-600" />
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {isSearchActive
              ? `Results for "${searchQuery}"`
              : selectedCategory !== 'all'
              ? `${CATEGORIES.find((c) => c.id === selectedCategory)?.label || 'Category'} Software`
              : 'Popular & Verified Software'}
          </h2>
        </div>
        {!loading && repos.length > 0 && (
          <span className="text-xs font-medium text-slate-400">
            {repos.length} apps available
          </span>
        )}
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col items-center justify-center text-center max-w-md mx-auto my-8">
          <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
          <h4 className="text-sm font-bold text-rose-950 mb-1">Unable to Load Apps</h4>
          <p className="text-xs text-rose-700 mb-4">{error}</p>
          <button
            onClick={() => fetchApps(searchQuery, selectedCategory)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && repos.length === 0 && (
        <EmptyState
          icon={Search}
          title="No applications found"
          description={
            isSearchActive
              ? `We couldn't find any releases matching "${searchQuery}". Try searching for another name or paste the direct GitHub repository link.`
              : 'No applications found in this category.'
          }
          actionText={isSearchActive ? 'Clear Search' : undefined}
          onAction={isSearchActive ? onClearSearch : undefined}
        />
      )}

      {/* App Cards Grid */}
      {!loading && !error && repos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {repos.map((repo) => {
            const installed = installedApps.find(
              (a) => a.id.toLowerCase() === repo.full_name.toLowerCase()
            );
            const isFav = favorites.includes(repo.full_name.toLowerCase());
            return (
              <AppCard
                key={repo.id}
                repo={repo}
                installedApp={installed}
                isFavorite={isFav}
                onOpenDetails={onOpenDetails}
                onInstall={onInstall}
                onOpenApp={onOpenApp}
                onToggleFavorite={onToggleFavorite}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
