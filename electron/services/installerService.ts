import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { shell } from 'electron';
import AdmZip from 'adm-zip';
import type { GitHubRepo, GitHubRelease, GitHubAsset, InstalledApp } from '../../src/types';
import type { StoreService } from './storeService';

export class InstallerService {
  constructor(private store: StoreService) {}

  private sanitize(name: string): string {
    return name.replace(/[^a-zA-Z0-9_\-]/g, '_');
  }

  async install(
    repo: GitHubRepo,
    release: GitHubRelease,
    asset: GitHubAsset,
    downloadedFilePath: string,
    onStatus: (status: string) => void
  ): Promise<InstalledApp> {
    const settings = this.store.getSettings();
    const appDirName = this.sanitize(repo.name);
    const targetAppFolder = path.join(settings.managedAppsDir, appDirName);

    if (!fs.existsSync(settings.managedAppsDir)) {
      fs.mkdirSync(settings.managedAppsDir, { recursive: true });
    }

    const lowerName = asset.name.toLowerCase();
    const isZip = lowerName.endsWith('.zip');
    const isMsi = lowerName.endsWith('.msi');
    const isExe = lowerName.endsWith('.exe');

    let installedApp: InstalledApp;

    if (isZip) {
      onStatus('Extracting application files...');
      if (!fs.existsSync(targetAppFolder)) {
        fs.mkdirSync(targetAppFolder, { recursive: true });
      }

      const zip = new AdmZip(downloadedFilePath);
      zip.extractAllTo(targetAppFolder, true);

      // Search for primary executable
      onStatus('Configuring shortcuts and launch targets...');
      const primaryExe = this.findExecutable(targetAppFolder, repo.name);
      const exePath = primaryExe || targetAppFolder;

      if (primaryExe) {
        await this.createWindowsShortcuts(repo.name, primaryExe);
      }

      installedApp = {
        id: repo.full_name,
        name: repo.name,
        owner: repo.owner.login,
        avatar_url: repo.owner.avatar_url,
        installedVersion: release.tag_name,
        installDate: new Date().toISOString(),
        installPath: exePath,
        installerType: 'portable',
        repoUrl: repo.html_url,
        sizeBytes: asset.size,
      };
    } else if (isMsi) {
      onStatus('Running Windows Installer (MSI)...');
      await this.runProcess('msiexec', ['/i', downloadedFilePath, '/qn', '/norestart']);

      installedApp = {
        id: repo.full_name,
        name: repo.name,
        owner: repo.owner.login,
        avatar_url: repo.owner.avatar_url,
        installedVersion: release.tag_name,
        installDate: new Date().toISOString(),
        installPath: downloadedFilePath,
        installerType: 'msi',
        repoUrl: repo.html_url,
        sizeBytes: asset.size,
      };
    } else {
      // isExe
      const isSetup = lowerName.includes('setup') || lowerName.includes('install');
      if (isSetup) {
        onStatus('Running installer in unattended mode...');
        // Try running silent or interactive if silent is unsupported
        try {
          await this.runProcess(downloadedFilePath, ['/S', '/VERYSILENT', '/SUPPRESSMSGBOXES', '/NORESTART']);
        } catch {
          // If silent flag returns error, trigger regular installation for user
          await this.runProcess(downloadedFilePath, []);
        }

        installedApp = {
          id: repo.full_name,
          name: repo.name,
          owner: repo.owner.login,
          avatar_url: repo.owner.avatar_url,
          installedVersion: release.tag_name,
          installDate: new Date().toISOString(),
          installPath: downloadedFilePath,
          installerType: 'exe',
          repoUrl: repo.html_url,
          sizeBytes: asset.size,
        };
      } else {
        // Standalone portable executable: Move to managed app folder and create shortcuts!
        onStatus('Setting up portable application...');
        if (!fs.existsSync(targetAppFolder)) {
          fs.mkdirSync(targetAppFolder, { recursive: true });
        }
        const targetExePath = path.join(targetAppFolder, asset.name);
        fs.copyFileSync(downloadedFilePath, targetExePath);

        await this.createWindowsShortcuts(repo.name, targetExePath);

        installedApp = {
          id: repo.full_name,
          name: repo.name,
          owner: repo.owner.login,
          avatar_url: repo.owner.avatar_url,
          installedVersion: release.tag_name,
          installDate: new Date().toISOString(),
          installPath: targetExePath,
          installerType: 'portable',
          repoUrl: repo.html_url,
          sizeBytes: asset.size,
        };
      }
    }

    // Save to store
    this.store.saveInstalledApp(installedApp);
    this.store.addHistory({
      repoFullName: repo.full_name,
      name: repo.name,
      version: release.tag_name,
      status: 'success',
    });

    return installedApp;
  }

  async openApp(appId: string): Promise<{ success: boolean; error?: string }> {
    const list = this.store.getInstalledApps();
    const appItem = list.find((a) => a.id.toLowerCase() === appId.toLowerCase());
    if (!appItem) return { success: false, error: 'App not found in installed catalog' };

    try {
      if (fs.existsSync(appItem.installPath)) {
        const error = await shell.openPath(appItem.installPath);
        if (error) {
          // try spawn if openPath returned error
          spawn(appItem.installPath, [], { detached: true, stdio: 'ignore' }).unref();
        }
        return { success: true };
      } else {
        return { success: false, error: 'Installed file no longer exists at path.' };
      }
    } catch (e: any) {
      return { success: false, error: e?.message || 'Failed to open application' };
    }
  }

  async uninstall(appId: string): Promise<{ success: boolean; error?: string }> {
    const appItem = this.store.removeInstalledApp(appId);
    if (!appItem) return { success: false, error: 'App not found' };

    try {
      // Remove Desktop and Start Menu shortcuts
      this.removeShortcuts(appItem.name);

      // If portable directory exists, delete folder
      if (appItem.installerType === 'portable') {
        const dir = path.dirname(appItem.installPath);
        const settings = this.store.getSettings();
        if (dir.startsWith(settings.managedAppsDir) && fs.existsSync(dir)) {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Error cleaning app files' };
    }
  }

  private findExecutable(dir: string, preferredName: string): string | null {
    try {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      const exes: string[] = [];

      for (const file of files) {
        if (file.isFile() && file.name.toLowerCase().endsWith('.exe')) {
          exes.push(path.join(dir, file.name));
        } else if (file.isDirectory() && !file.name.startsWith('.')) {
          // Check 1 level deep subfolder
          const subFiles = fs.readdirSync(path.join(dir, file.name));
          for (const sf of subFiles) {
            if (sf.toLowerCase().endsWith('.exe')) {
              exes.push(path.join(dir, file.name, sf));
            }
          }
        }
      }

      if (exes.length === 0) return null;

      // Match closest to preferredName
      const cleanPreferred = preferredName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const match = exes.find((p) => {
        const base = path.basename(p, '.exe').toLowerCase().replace(/[^a-z0-9]/g, '');
        return base.includes(cleanPreferred) || cleanPreferred.includes(base);
      });

      return match || exes[0];
    } catch (e) {
      console.error('Error finding executable:', e);
      return null;
    }
  }

  private async createWindowsShortcuts(name: string, targetPath: string): Promise<void> {
    const workingDir = path.dirname(targetPath);
    const cleanName = name.replace(/[/\\?%*:|"<>]/g, ' ');

    const desktopPath = path.join(process.env.USERPROFILE || 'C:\\Users\\Default', 'Desktop', `${cleanName}.lnk`);
    const startMenuDir = path.join(
      process.env.APPDATA || '',
      'Microsoft',
      'Windows',
      'Start Menu',
      'Programs'
    );
    const startMenuPath = path.join(startMenuDir, `${cleanName}.lnk`);

    const psScript = `
      $WScriptShell = New-Object -ComObject WScript.Shell;
      
      $s1 = $WScriptShell.CreateShortcut('${desktopPath.replace(/'/g, "''")}');
      $s1.TargetPath = '${targetPath.replace(/'/g, "''")}';
      $s1.WorkingDirectory = '${workingDir.replace(/'/g, "''")}';
      $s1.Save();

      if (Test-Path '${startMenuDir.replace(/'/g, "''")}') {
        $s2 = $WScriptShell.CreateShortcut('${startMenuPath.replace(/'/g, "''")}');
        $s2.TargetPath = '${targetPath.replace(/'/g, "''")}';
        $s2.WorkingDirectory = '${workingDir.replace(/'/g, "''")}';
        $s2.Save();
      }
    `;

    try {
      await this.runProcess('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript]);
    } catch (e) {
      console.warn('Could not create desktop/start menu shortcuts:', e);
    }
  }

  private removeShortcuts(name: string): void {
    const cleanName = name.replace(/[/\\?%*:|"<>]/g, ' ');
    const desktopPath = path.join(process.env.USERPROFILE || 'C:\\Users\\Default', 'Desktop', `${cleanName}.lnk`);
    const startMenuPath = path.join(
      process.env.APPDATA || '',
      'Microsoft',
      'Windows',
      'Start Menu',
      'Programs',
      `${cleanName}.lnk`
    );

    if (fs.existsSync(desktopPath)) {
      try { fs.unlinkSync(desktopPath); } catch {}
    }
    if (fs.existsSync(startMenuPath)) {
      try { fs.unlinkSync(startMenuPath); } catch {}
    }
  }

  private runProcess(cmd: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd, args, {
        windowsHide: true,
        stdio: 'ignore',
      });
      child.on('error', (err) => reject(err));
      child.on('close', (code) => {
        if (code === 0 || code === 3010) {
          // 3010 is Windows ERROR_SUCCESS_REBOOT_REQUIRED
          resolve();
        } else {
          // Some installers return non-zero even on success, so we resolve to avoid blocking
          resolve();
        }
      });
    });
  }
}
