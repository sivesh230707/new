import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ExploreView } from './views/ExploreView';
import { MyAppsView } from './views/MyAppsView';
import { FavoritesView } from './views/FavoritesView';
import { SettingsView } from './views/SettingsView';
import { AppDetailModal } from './components/AppDetailModal';
import { InstallProgressDrawer } from './components/InstallProgressDrawer';
import type { 
  GitHubRepo, 
  GitHubRelease, 
  GitHubAsset, 
  InstalledApp, 
  FavoriteApp, 
  RecentDownload, 
  DownloadProgress 
} from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('explore');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [favorites, setFavorites] = useState<FavoriteApp[]>([]);
  const [history, setHistory] = useState<RecentDownload[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [hasToken, setHasToken] = useState<boolean>(false);

  // Load initial app data
  const refreshInstalledApps = async () => {
    try {
      const apps = await window.electronAPI.getInstalledApps();
      setInstalledApps(apps);
    } catch (e) {
      console.error('Failed to load installed apps:', e);
    }
  };

  const refreshFavorites = async () => {
    try {
      const favs = await window.electronAPI.getFavorites();
      setFavorites(favs);
    } catch (e) {
      console.error('Failed to load favorites:', e);
    }
  };

  const refreshHistory = async () => {
    try {
      const hist = await window.electronAPI.getRecentDownloads();
      setHistory(hist);
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  };

  useEffect(() => {
    refreshInstalledApps();
    refreshFavorites();
    refreshHistory();

    // Check settings token
    window.electronAPI.getSettings().then((s) => {
      setHasToken(!!s.githubToken);
    });

    // Listen to download progress
    const unsubscribe = window.electronAPI.onDownloadProgress((progress) => {
      setDownloadProgress(progress);
      if (progress.status === 'completed') {
        refreshInstalledApps();
        refreshHistory();
      }
    });

    return () => unsubscribe();
  }, []);

  // Quick install flow from AppCard
  const handleQuickInstall = async (repo: GitHubRepo) => {
    try {
      setDownloadProgress({
        id: repo.full_name,
        status: 'downloading',
        bytesDownloaded: 0,
        totalBytes: 0,
        percent: 0,
        speedMBs: 0,
        message: `Finding latest Windows release for ${repo.name}...`,
      });

      const releases = await window.electronAPI.getReleases(repo.owner.login, repo.name);
      if (!releases || releases.length === 0) {
        setDownloadProgress({
          id: repo.full_name,
          status: 'error',
          bytesDownloaded: 0,
          totalBytes: 0,
          percent: 0,
          speedMBs: 0,
          message: 'No published releases found',
          error: 'This repository has not published any binary releases yet.',
        });
        return;
      }

      const latestRelease = releases[0];
      const match = await window.electronAPI.resolveAsset(latestRelease.assets);

      if (!match) {
        // Open modal so user can pick manually or see why
        setSelectedRepo(repo);
        setDownloadProgress(null);
        return;
      }

      // Start full install
      await window.electronAPI.startInstall(repo, latestRelease, match.asset);
    } catch (err: any) {
      console.error('Quick install error:', err);
      setDownloadProgress({
        id: repo.full_name,
        status: 'error',
        bytesDownloaded: 0,
        totalBytes: 0,
        percent: 0,
        speedMBs: 0,
        message: 'Could not complete install',
        error: err?.message || 'Error resolving release assets',
      });
    }
  };

  // Detailed install from modal
  const handleModalInstall = async (repo: GitHubRepo, release: GitHubRelease, asset: GitHubAsset) => {
    try {
      await window.electronAPI.startInstall(repo, release, asset);
    } catch (err: any) {
      console.error('Modal install error:', err);
    }
  };

  const handleCancelInstall = (repoFullName: string) => {
    window.electronAPI.cancelInstall(repoFullName);
    setDownloadProgress(null);
  };

  const handleOpenApp = async (appId: string) => {
    const res = await window.electronAPI.openApp(appId);
    if (!res.success && res.error) {
      alert(`Could not open app: ${res.error}`);
    }
  };

  const handleUninstallApp = async (appId: string) => {
    await window.electronAPI.uninstallApp(appId);
    await refreshInstalledApps();
  };

  const handleCheckUpdates = async () => {
    const res = await window.electronAPI.checkForUpdates();
    await refreshInstalledApps();
    if (res.updatedCount === 0) {
      alert('All your installed applications are up to date!');
    }
  };

  const handleUpdateApp = async (app: InstalledApp) => {
    const [owner, repoName] = app.id.split('/');
    try {
      const repo = await window.electronAPI.getRepoDetails(owner, repoName);
      await handleQuickInstall(repo);
    } catch (e: any) {
      alert(`Failed to fetch update: ${e?.message}`);
    }
  };

  const handleUpdateAll = async () => {
    const updatable = installedApps.filter((a) => a.hasUpdate);
    for (const app of updatable) {
      await handleUpdateApp(app);
    }
  };

  const handleToggleFavorite = async (repo: GitHubRepo) => {
    await window.electronAPI.toggleFavorite(repo);
    await refreshFavorites();
  };

  const handleOpenRepoByName = async (fullName: string) => {
    const [owner, repoName] = fullName.split('/');
    try {
      const repo = await window.electronAPI.getRepoDetails(owner, repoName);
      setSelectedRepo(repo);
    } catch (e: any) {
      alert(`Could not open repository: ${e?.message}`);
    }
  };

  const handleClearCache = async () => {
    await window.electronAPI.clearCache();
    await refreshHistory();
  };

  const updatesCount = installedApps.filter((a) => a.hasUpdate).length;
  const favoriteFullNames = favorites.map((f) => f.repoFullName.toLowerCase());

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans select-none">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'explore') setSearchQuery('');
        }}
        installedCount={installedApps.length}
        updatesCount={updatesCount}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (currentTab !== 'explore') setCurrentTab('explore');
          }}
          onSearchSubmit={() => {
            if (currentTab !== 'explore') setCurrentTab('explore');
          }}
          hasCustomToken={hasToken}
        />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/60">
          {currentTab === 'explore' && (
            <ExploreView
              searchQuery={searchQuery}
              onClearSearch={() => setSearchQuery('')}
              installedApps={installedApps}
              favorites={favoriteFullNames}
              onOpenDetails={(repo) => setSelectedRepo(repo)}
              onInstall={handleQuickInstall}
              onOpenApp={handleOpenApp}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {currentTab === 'my-apps' && (
            <MyAppsView
              installedApps={installedApps}
              onOpenApp={handleOpenApp}
              onUpdateApp={handleUpdateApp}
              onUpdateAll={handleUpdateAll}
              onUninstallApp={handleUninstallApp}
              onCheckUpdates={handleCheckUpdates}
              onExplore={() => setCurrentTab('explore')}
            />
          )}

          {currentTab === 'favorites' && (
            <FavoritesView
              favorites={favorites}
              history={history}
              installedApps={installedApps}
              onOpenRepoByName={handleOpenRepoByName}
              onOpenApp={handleOpenApp}
              onRemoveFavorite={handleToggleFavorite}
              onExplore={() => setCurrentTab('explore')}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView onClearCache={handleClearCache} />
          )}
        </main>
      </div>

      {/* App Details Modal */}
      {selectedRepo && (
        <AppDetailModal
          repo={selectedRepo}
          installedApp={installedApps.find(
            (a) => a.id.toLowerCase() === selectedRepo.full_name.toLowerCase()
          )}
          onClose={() => setSelectedRepo(null)}
          onInstall={handleModalInstall}
          onOpenApp={handleOpenApp}
        />
      )}

      {/* Persistent / Floating Download & Install Drawer */}
      <InstallProgressDrawer
        progress={downloadProgress}
        onCancel={handleCancelInstall}
        onOpenApp={handleOpenApp}
        onDismiss={() => setDownloadProgress(null)}
      />
    </div>
  );
};
