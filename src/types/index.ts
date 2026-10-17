export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
  pushed_at: string;
  topics?: string[];
  license?: {
    name: string;
    spdx_id: string;
  } | null;
  default_branch?: string;
}

export interface GitHubAsset {
  id: number;
  name: string;
  size: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  browser_download_url: string;
  content_type: string;
  is_windows_compatible?: boolean;
  installer_type?: 'exe' | 'msi' | 'portable' | 'other';
  arch?: 'x64' | 'x86' | 'arm64' | 'universal';
  sha256?: string;
}

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  assets: GitHubAsset[];
}

export interface ResolvedAssetMatch {
  asset: GitHubAsset;
  recommendedReason: string;
  isPortable: boolean;
  fileExtension: string;
}

export interface InstalledApp {
  id: string; // repo full_name, e.g. "obsproject/obs-studio"
  name: string;
  owner: string;
  avatar_url: string;
  installedVersion: string;
  latestVersion?: string;
  hasUpdate?: boolean;
  installDate: string;
  installPath: string; // executable path or directory
  installerType: 'exe' | 'msi' | 'portable';
  repoUrl: string;
  sizeBytes?: number;
}

export interface DownloadProgress {
  id: string; // repo full_name
  status: 'downloading' | 'installing' | 'completed' | 'error' | 'cancelled';
  bytesDownloaded: number;
  totalBytes: number;
  percent: number;
  speedMBs: number;
  message: string;
  error?: string;
}

export interface FavoriteApp {
  repoFullName: string;
  name: string;
  owner: string;
  avatar_url: string;
  description: string;
  stars: number;
  addedAt: string;
}

export interface RecentDownload {
  id: string;
  repoFullName: string;
  name: string;
  version: string;
  date: string;
  status: 'success' | 'failed';
}

export interface AppSettings {
  managedAppsDir: string;
  autoCheckUpdates: boolean;
  githubToken?: string;
}

export interface SafetyReport {
  isVerified: boolean;
  score: number; // 0-100
  reasons: string[];
  warnings: string[];
  hasChecksum: boolean;
  checksumValue?: string;
}
