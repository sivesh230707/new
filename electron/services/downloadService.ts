import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { app } from 'electron';
import type { DownloadProgress, GitHubAsset } from '../../src/types';

export class DownloadService {
  private activeControllers = new Map<string, AbortController>();
  private cacheDir: string;

  constructor() {
    this.cacheDir = path.join(app.getPath('userData'), 'cache', 'downloads');
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  cancel(repoFullName: string): void {
    const controller = this.activeControllers.get(repoFullName);
    if (controller) {
      controller.abort();
      this.activeControllers.delete(repoFullName);
    }
  }

  clearCache(): void {
    try {
      if (fs.existsSync(this.cacheDir)) {
        fs.rmSync(this.cacheDir, { recursive: true, force: true });
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
    } catch (e) {
      console.error('Error clearing download cache:', e);
    }
  }

  async download(
    repoFullName: string,
    asset: GitHubAsset,
    token?: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<{ filePath: string; sha256: string }> {
    const controller = new AbortController();
    this.activeControllers.set(repoFullName, controller);

    const safeName = asset.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const targetFilePath = path.join(this.cacheDir, `${Date.now()}_${safeName}`);

    const headers: Record<string, string> = {
      'User-Agent': 'GitHub-Installer-Desktop-App',
      'Accept': 'application/octet-stream',
    };
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    try {
      const response = await fetch(asset.browser_download_url, {
        signal: controller.signal,
        headers,
      });

      if (!response.ok) {
        throw new Error(`Download failed with status HTTP ${response.status}: ${response.statusText}`);
      }

      const totalBytes = Number(response.headers.get('content-length')) || asset.size || 0;
      let downloadedBytes = 0;
      let lastTime = Date.now();
      let lastBytes = 0;
      let speedMBs = 0;

      const fileStream = fs.createWriteStream(targetFilePath);
      const hash = crypto.createHash('sha256');

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (value) {
          fileStream.write(Buffer.from(value));
          hash.update(value);
          downloadedBytes += value.length;

          const now = Date.now();
          const timeDiff = now - lastTime;
          if (timeDiff >= 200 || downloadedBytes === totalBytes) {
            const bytesDiff = downloadedBytes - lastBytes;
            speedMBs = timeDiff > 0 ? (bytesDiff / (timeDiff / 1000)) / (1024 * 1024) : 0;
            lastTime = now;
            lastBytes = downloadedBytes;

            const percent = totalBytes > 0 ? Math.min(100, Math.round((downloadedBytes / totalBytes) * 100)) : 0;

            onProgress?.({
              id: repoFullName,
              status: 'downloading',
              bytesDownloaded: downloadedBytes,
              totalBytes,
              percent,
              speedMBs: parseFloat(speedMBs.toFixed(2)),
              message: `Downloading ${asset.name} (${(downloadedBytes / (1024 * 1024)).toFixed(1)} MB / ${(totalBytes / (1024 * 1024)).toFixed(1)} MB)`,
            });
          }
        }
      }

      await new Promise<void>((resolve, reject) => {
        fileStream.end(() => resolve());
        fileStream.on('error', reject);
      });

      this.activeControllers.delete(repoFullName);
      const computedSha256 = hash.digest('hex');

      return {
        filePath: targetFilePath,
        sha256: computedSha256,
      };
    } catch (err: any) {
      this.activeControllers.delete(repoFullName);
      // Clean up incomplete file
      if (fs.existsSync(targetFilePath)) {
        try { fs.unlinkSync(targetFilePath); } catch {}
      }

      if (controller.signal.aborted) {
        onProgress?.({
          id: repoFullName,
          status: 'cancelled',
          bytesDownloaded: 0,
          totalBytes: 0,
          percent: 0,
          speedMBs: 0,
          message: 'Download cancelled',
        });
        throw new Error('Download was cancelled by user');
      }

      onProgress?.({
        id: repoFullName,
        status: 'error',
        bytesDownloaded: 0,
        totalBytes: 0,
        percent: 0,
        speedMBs: 0,
        message: 'Download failed',
        error: err?.message || 'Network download error',
      });
      throw err;
    }
  }
}
