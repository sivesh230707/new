import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import type { InstalledApp, FavoriteApp, RecentDownload, AppSettings, GitHubRepo } from '../../src/types';

export class StoreService {
  private dataDir: string;
  private installedAppsFile: string;
  private favoritesFile: string;
  private historyFile: string;
  private settingsFile: string;

  constructor() {
    this.dataDir = path.join(app.getPath('userData'), 'data');
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    this.installedAppsFile = path.join(this.dataDir, 'installed-apps.json');
    this.favoritesFile = path.join(this.dataDir, 'favorites.json');
    this.historyFile = path.join(this.dataDir, 'history.json');
    this.settingsFile = path.join(this.dataDir, 'settings.json');
  }

  private readJson<T>(filePath: string, defaultValue: T): T {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error(`Error reading ${filePath}:`, e);
    }
    return defaultValue;
  }

  private writeJson<T>(filePath: string, data: T): void {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error(`Error writing ${filePath}:`, e);
    }
  }

  // --- Settings ---
  getSettings(): AppSettings {
    const defaultAppsDir = path.join(
      process.env.LOCALAPPDATA || app.getPath('appData'),
      'GitHubInstaller',
      'Apps'
    );
    const defaults: AppSettings = {
      managedAppsDir: defaultAppsDir,
      autoCheckUpdates: true,
      githubToken: '',
    };
    return { ...defaults, ...this.readJson<Partial<AppSettings>>(this.settingsFile, {}) };
  }

  saveSettings(partial: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    this.writeJson(this.settingsFile, updated);
    return updated;
  }

  // --- Installed Apps ---
  getInstalledApps(): InstalledApp[] {
    return this.readJson<InstalledApp[]>(this.installedAppsFile, []);
  }

  saveInstalledApp(appData: InstalledApp): void {
    const list = this.getInstalledApps();
    const index = list.findIndex((a) => a.id.toLowerCase() === appData.id.toLowerCase());
    if (index >= 0) {
      list[index] = { ...list[index], ...appData };
    } else {
      list.push(appData);
    }
    this.writeJson(this.installedAppsFile, list);
  }

  removeInstalledApp(appId: string): InstalledApp | null {
    const list = this.getInstalledApps();
    const found = list.find((a) => a.id.toLowerCase() === appId.toLowerCase());
    const remaining = list.filter((a) => a.id.toLowerCase() !== appId.toLowerCase());
    this.writeJson(this.installedAppsFile, remaining);
    return found || null;
  }

  // --- Favorites ---
  getFavorites(): FavoriteApp[] {
    return this.readJson<FavoriteApp[]>(this.favoritesFile, []);
  }

  toggleFavorite(repo: GitHubRepo): boolean {
    const list = this.getFavorites();
    const index = list.findIndex((f) => f.repoFullName.toLowerCase() === repo.full_name.toLowerCase());
    let isFav = false;
    if (index >= 0) {
      list.splice(index, 1);
      isFav = false;
    } else {
      list.unshift({
        repoFullName: repo.full_name,
        name: repo.name,
        owner: repo.owner.login,
        avatar_url: repo.owner.avatar_url,
        description: repo.description || 'No description provided.',
        stars: repo.stargazers_count,
        addedAt: new Date().toISOString(),
      });
      isFav = true;
    }
    this.writeJson(this.favoritesFile, list);
    return isFav;
  }

  // --- History ---
  getHistory(): RecentDownload[] {
    return this.readJson<RecentDownload[]>(this.historyFile, []);
  }

  addHistory(item: Omit<RecentDownload, 'id' | 'date'>): void {
    const list = this.getHistory();
    list.unshift({
      ...item,
      id: `${item.repoFullName}-${Date.now()}`,
      date: new Date().toISOString(),
    });
    // keep max 50
    this.writeJson(this.historyFile, list.slice(0, 50));
  }

  clearHistory(): void {
    this.writeJson(this.historyFile, []);
  }
}
