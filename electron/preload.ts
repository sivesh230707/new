import { contextBridge, ipcRenderer } from 'electron';
import type { 
  GitHubRepo, 
  GitHubRelease, 
  GitHubAsset, 
  ResolvedAssetMatch, 
  InstalledApp, 
  DownloadProgress, 
  FavoriteApp, 
  RecentDownload, 
  AppSettings, 
  SafetyReport 
} from '../src/types';

export const electronAPI = {
  // GitHub API operations
  githubSearch: (query: string, page = 1): Promise<{ items: GitHubRepo[]; total: number }> =>
    ipcRenderer.invoke('github:search', { query, page }),
  
  getRepoDetails: (owner: string, repo: string): Promise<GitHubRepo> =>
    ipcRenderer.invoke('github:get-repo', { owner, repo }),

  getReleases: (owner: string, repo: string): Promise<GitHubRelease[]> =>
    ipcRenderer.invoke('github:get-releases', { owner, repo }),

  getReadme: (owner: string, repo: string): Promise<string> =>
    ipcRenderer.invoke('github:get-readme', { owner, repo }),

  resolveAsset: (assets: GitHubAsset[]): Promise<ResolvedAssetMatch | null> =>
    ipcRenderer.invoke('asset:resolve', assets),

  evaluateSafety: (repo: GitHubRepo, release?: GitHubRelease): Promise<SafetyReport> =>
    ipcRenderer.invoke('safety:evaluate', { repo, release }),

  // Installation & Download flow
  startInstall: (
    repo: GitHubRepo, 
    release: GitHubRelease, 
    asset: GitHubAsset
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('install:start', { repo, release, asset }),

  cancelInstall: (repoFullName: string): Promise<void> =>
    ipcRenderer.invoke('install:cancel', repoFullName),

  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => {
    const subscription = (_event: unknown, data: DownloadProgress) => callback(data);
    ipcRenderer.on('install:progress', subscription);
    return () => {
      ipcRenderer.removeListener('install:progress', subscription);
    };
  },

  // My Apps Management
  getInstalledApps: (): Promise<InstalledApp[]> =>
    ipcRenderer.invoke('apps:get-all'),

  openApp: (appId: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('apps:open', appId),

  uninstallApp: (appId: string): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('apps:uninstall', appId),

  checkForUpdates: (): Promise<{ updatedCount: number; appsWithUpdates: InstalledApp[] }> =>
    ipcRenderer.invoke('apps:check-updates'),

  // Favorites & History
  getFavorites: (): Promise<FavoriteApp[]> =>
    ipcRenderer.invoke('favorites:get-all'),

  toggleFavorite: (repo: GitHubRepo): Promise<boolean> =>
    ipcRenderer.invoke('favorites:toggle', repo),

  getRecentDownloads: (): Promise<RecentDownload[]> =>
    ipcRenderer.invoke('history:get-recent'),

  // Settings & System
  getSettings: (): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:get'),

  saveSettings: (settings: Partial<AppSettings>): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:save', settings),

  clearCache: (): Promise<void> =>
    ipcRenderer.invoke('system:clear-cache'),

  openExternal: (url: string): Promise<void> =>
    ipcRenderer.invoke('system:open-external', url),

  getSystemInfo: (): Promise<{ platform: string; arch: string; appsDir: string }> =>
    ipcRenderer.invoke('system:get-info'),
};

export type ElectronAPI = typeof electronAPI;

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
