import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import os from 'os';
import { GitHubService } from './services/githubService';
import { DownloadService } from './services/downloadService';
import { StoreService } from './services/storeService';
import { InstallerService } from './services/installerService';
import { resolveWindowsAsset } from './services/assetResolver';
import { evaluateRepoSafety } from './services/safetyService';
import type { GitHubRepo, GitHubRelease, GitHubAsset } from '../src/types';

let mainWindow: BrowserWindow | null = null;

const storeService = new StoreService();
const githubService = new GitHubService();
const downloadService = new DownloadService();
const installerService = new InstallerService(storeService);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 980,
    minHeight: 650,
    backgroundColor: '#f8fafc',
    titleBarStyle: 'default',
    autoHideMenuBar: true,
    title: 'GitHub Installer',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function setupIpcHandlers() {
  // GitHub APIs
  ipcMain.handle('github:search', async (_event, { query, page }) => {
    const settings = storeService.getSettings();
    return githubService.searchRepos(query, page, settings.githubToken);
  });

  ipcMain.handle('github:get-repo', async (_event, { owner, repo }) => {
    const settings = storeService.getSettings();
    return githubService.getRepo(owner, repo, settings.githubToken);
  });

  ipcMain.handle('github:get-releases', async (_event, { owner, repo }) => {
    const settings = storeService.getSettings();
    return githubService.getReleases(owner, repo, settings.githubToken);
  });

  ipcMain.handle('github:get-readme', async (_event, { owner, repo }) => {
    const settings = storeService.getSettings();
    return githubService.getReadme(owner, repo, settings.githubToken);
  });

  // Asset Resolver
  ipcMain.handle('asset:resolve', async (_event, assets: GitHubAsset[]) => {
    const arch = process.arch === 'arm64' ? 'arm64' : process.arch === 'ia32' ? 'x86' : 'x64';
    return resolveWindowsAsset(assets, arch);
  });

  // Safety Evaluator
  ipcMain.handle('safety:evaluate', async (_event, { repo, release }: { repo: GitHubRepo; release?: GitHubRelease }) => {
    return evaluateRepoSafety(repo, release);
  });

  // Installation Flow
  ipcMain.handle(
    'install:start',
    async (
      _event,
      { repo, release, asset }: { repo: GitHubRepo; release: GitHubRelease; asset: GitHubAsset }
    ) => {
      const repoFullName = repo.full_name;
      const settings = storeService.getSettings();

      try {
        mainWindow?.webContents.send('install:progress', {
          id: repoFullName,
          status: 'downloading',
          bytesDownloaded: 0,
          totalBytes: asset.size || 0,
          percent: 0,
          speedMBs: 0,
          message: `Preparing to download ${asset.name}...`,
        });

        // 1. Download Asset
        const { filePath } = await downloadService.download(
          repoFullName,
          asset,
          settings.githubToken,
          (progress) => {
            mainWindow?.webContents.send('install:progress', progress);
          }
        );

        // 2. Installing
        mainWindow?.webContents.send('install:progress', {
          id: repoFullName,
          status: 'installing',
          bytesDownloaded: asset.size,
          totalBytes: asset.size,
          percent: 100,
          speedMBs: 0,
          message: 'Installing application...',
        });

        await installerService.install(repo, release, asset, filePath, (statusMsg) => {
          mainWindow?.webContents.send('install:progress', {
            id: repoFullName,
            status: 'installing',
            bytesDownloaded: asset.size,
            totalBytes: asset.size,
            percent: 100,
            speedMBs: 0,
            message: statusMsg,
          });
        });

        // 3. Completed
        mainWindow?.webContents.send('install:progress', {
          id: repoFullName,
          status: 'completed',
          bytesDownloaded: asset.size,
          totalBytes: asset.size,
          percent: 100,
          speedMBs: 0,
          message: 'Installation complete! Ready to open.',
        });

        return { success: true };
      } catch (err: any) {
        mainWindow?.webContents.send('install:progress', {
          id: repoFullName,
          status: 'error',
          bytesDownloaded: 0,
          totalBytes: 0,
          percent: 0,
          speedMBs: 0,
          message: 'Installation failed',
          error: err?.message || 'Unexpected installation error',
        });
        return { success: false, error: err?.message || 'Installation error' };
      }
    }
  );

  ipcMain.handle('install:cancel', async (_event, repoFullName: string) => {
    downloadService.cancel(repoFullName);
  });

  // Apps Management
  ipcMain.handle('apps:get-all', async () => {
    return storeService.getInstalledApps();
  });

  ipcMain.handle('apps:open', async (_event, appId: string) => {
    return installerService.openApp(appId);
  });

  ipcMain.handle('apps:uninstall', async (_event, appId: string) => {
    return installerService.uninstall(appId);
  });

  ipcMain.handle('apps:check-updates', async () => {
    const apps = storeService.getInstalledApps();
    const settings = storeService.getSettings();
    let updatedCount = 0;
    const appsWithUpdates: any[] = [];

    for (const appItem of apps) {
      try {
        const [owner, repoName] = appItem.id.split('/');
        const releases = await githubService.getReleases(owner, repoName, settings.githubToken);
        if (releases && releases.length > 0) {
          const latest = releases[0];
          if (latest.tag_name !== appItem.installedVersion) {
            appItem.hasUpdate = true;
            appItem.latestVersion = latest.tag_name;
            updatedCount++;
            appsWithUpdates.push(appItem);
            storeService.saveInstalledApp(appItem);
          }
        }
      } catch (e) {
        console.warn(`Could not check update for ${appItem.id}:`, e);
      }
    }

    return { updatedCount, appsWithUpdates };
  });

  // Favorites & History
  ipcMain.handle('favorites:get-all', async () => {
    return storeService.getFavorites();
  });

  ipcMain.handle('favorites:toggle', async (_event, repo: GitHubRepo) => {
    return storeService.toggleFavorite(repo);
  });

  ipcMain.handle('history:get-recent', async () => {
    return storeService.getHistory();
  });

  // Settings
  ipcMain.handle('settings:get', async () => {
    return storeService.getSettings();
  });

  ipcMain.handle('settings:save', async (_event, partial) => {
    return storeService.saveSettings(partial);
  });

  ipcMain.handle('system:clear-cache', async () => {
    githubService.clearCache();
    downloadService.clearCache();
  });

  ipcMain.handle('system:open-external', async (_event, url: string) => {
    shell.openExternal(url);
  });

  ipcMain.handle('system:get-info', async () => {
    const settings = storeService.getSettings();
    return {
      platform: process.platform,
      arch: process.arch,
      appsDir: settings.managedAppsDir,
      osVersion: `${os.type()} ${os.release()}`,
    };
  });
}
