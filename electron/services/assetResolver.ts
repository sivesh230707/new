import type { GitHubAsset, ResolvedAssetMatch } from '../../src/types';

export function resolveWindowsAsset(assets: GitHubAsset[], preferredArch = 'x64'): ResolvedAssetMatch | null {
  if (!assets || assets.length === 0) return null;

  // Filter out definitely non-Windows or source-code assets
  const windowsCandidates = assets.filter((asset) => {
    const name = asset.name.toLowerCase();
    // Exclude Mac/Linux/Source archives
    if (
      name.endsWith('.dmg') ||
      name.endsWith('.pkg') ||
      name.endsWith('.deb') ||
      name.endsWith('.rpm') ||
      name.endsWith('.tar.gz') ||
      name.endsWith('.tgz') ||
      name.endsWith('.tar.xz') ||
      name.endsWith('.appimage') ||
      name.includes('darwin') ||
      name.includes('macos') ||
      name.includes('linux') ||
      name.includes('ubuntu') ||
      name.includes('android') ||
      name.includes('source') ||
      name.endsWith('.apk')
    ) {
      return false;
    }

    // Windows extensions
    return name.endsWith('.exe') || name.endsWith('.msi') || name.endsWith('.zip');
  });

  if (windowsCandidates.length === 0) {
    // If no explicit candidates, check if any .exe or .msi exists at all
    const anyExeOrMsi = assets.find(
      (a) => a.name.toLowerCase().endsWith('.exe') || a.name.toLowerCase().endsWith('.msi')
    );
    if (anyExeOrMsi) {
      return {
        asset: anyExeOrMsi,
        recommendedReason: 'Windows binary detected',
        isPortable: false,
        fileExtension: anyExeOrMsi.name.toLowerCase().endsWith('.msi') ? 'msi' : 'exe',
      };
    }
    return null;
  }

  // Score candidates
  let bestAsset: GitHubAsset | null = null;
  let bestScore = -1;
  let isPortable = false;
  let reason = 'Recommended Windows release';

  for (const asset of windowsCandidates) {
    const name = asset.name.toLowerCase();
    let score = 0;

    // Check file type
    const isExe = name.endsWith('.exe');
    const isMsi = name.endsWith('.msi');
    const isZip = name.endsWith('.zip');

    if (isExe) score += 50;
    if (isMsi) score += 45;
    if (isZip) score += 20;

    // Keywords
    if (name.includes('win') || name.includes('windows')) score += 30;
    if (name.includes('setup') || name.includes('installer')) score += 25;
    if (name.includes('x64') || name.includes('x86_64') || name.includes('amd64') || name.includes('win64')) {
      score += (preferredArch === 'x64' ? 25 : 10);
    } else if (name.includes('ia32') || name.includes('x86') || name.includes('win32')) {
      score += (preferredArch === 'x86' ? 25 : 10);
    } else if (name.includes('arm64')) {
      score += (preferredArch === 'arm64' ? 30 : -20);
    }

    // Portable
    const isPort = name.includes('portable') || name.includes('standalone') || isZip;
    if (name.includes('portable')) {
      score += 15;
    }

    // Penalize debug/symbols or update packages
    if (name.includes('debug') || name.includes('pdb') || name.includes('symbols')) score -= 50;
    if (name.includes('update-only') || name.includes('patch')) score -= 20;

    if (score > bestScore) {
      bestScore = score;
      bestAsset = asset;
      isPortable = isPort;
      if (isExe && (name.includes('setup') || name.includes('install'))) {
        reason = 'Standard Windows 64-bit installer';
      } else if (isMsi) {
        reason = 'Windows Installer Package (.msi)';
      } else if (isPort) {
        reason = 'Portable package (auto-extracted to Apps folder)';
      } else {
        reason = 'Windows executable';
      }
    }
  }

  if (!bestAsset) return null;

  const ext = bestAsset.name.toLowerCase().endsWith('.msi')
    ? 'msi'
    : bestAsset.name.toLowerCase().endsWith('.zip')
    ? 'zip'
    : 'exe';

  return {
    asset: bestAsset,
    recommendedReason: reason,
    isPortable: isPortable || ext === 'zip',
    fileExtension: ext,
  };
}
