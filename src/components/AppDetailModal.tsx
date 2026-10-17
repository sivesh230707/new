import React, { useState, useEffect } from 'react';
import { 
  X, ExternalLink, Star, GitFork, ShieldCheck, AlertTriangle, 
  Download, Play, CheckCircle2, FileCode, Hash, RefreshCw, ChevronDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { 
  GitHubRepo, 
  GitHubRelease, 
  GitHubAsset, 
  ResolvedAssetMatch, 
  SafetyReport, 
  InstalledApp 
} from '../types';

interface AppDetailModalProps {
  repo: GitHubRepo | null;
  installedApp?: InstalledApp;
  onClose: () => void;
  onInstall: (repo: GitHubRepo, release: GitHubRelease, asset: GitHubAsset) => void;
  onOpenApp: (appId: string) => void;
}

export const AppDetailModal: React.FC<AppDetailModalProps> = ({
  repo,
  installedApp,
  onClose,
  onInstall,
  onOpenApp,
}) => {
  const [loading, setLoading] = useState(true);
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<GitHubRelease | null>(null);
  const [resolvedAsset, setResolvedAsset] = useState<ResolvedAssetMatch | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<GitHubAsset | null>(null);
  const [readme, setReadme] = useState<string>('');
  const [safetyReport, setSafetyReport] = useState<SafetyReport | null>(null);
  const [activeTab, setActiveTab] = useState<'readme' | 'release' | 'assets'>('readme');
  const [showUnverifiedWarning, setShowUnverifiedWarning] = useState(false);

  useEffect(() => {
    if (!repo) return;
    let isCancelled = false;
    setLoading(true);

    const loadData = async () => {
      try {
        const [relList, readmeText] = await Promise.all([
          window.electronAPI.getReleases(repo.owner.login, repo.name),
          window.electronAPI.getReadme(repo.owner.login, repo.name),
        ]);

        if (isCancelled) return;

        setReleases(relList);
        setReadme(readmeText);

        const latestRel = relList[0] || null;
        setSelectedRelease(latestRel);

        if (latestRel && latestRel.assets.length > 0) {
          const match = await window.electronAPI.resolveAsset(latestRel.assets);
          if (!isCancelled) {
            setResolvedAsset(match);
            setSelectedAsset(match ? match.asset : latestRel.assets[0]);
          }
        }

        const safety = await window.electronAPI.evaluateSafety(repo, latestRel || undefined);
        if (!isCancelled) {
          setSafetyReport(safety);
        }
      } catch (err) {
        console.error('Failed to load repo details:', err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadData();
    return () => {
      isCancelled = true;
    };
  }, [repo]);

  // When release changes, re-resolve asset
  const handleReleaseChange = async (rel: GitHubRelease) => {
    setSelectedRelease(rel);
    if (rel.assets && rel.assets.length > 0) {
      const match = await window.electronAPI.resolveAsset(rel.assets);
      setResolvedAsset(match);
      setSelectedAsset(match ? match.asset : rel.assets[0]);
    } else {
      setResolvedAsset(null);
      setSelectedAsset(null);
    }
  };

  const handleInstallClick = () => {
    if (!repo || !selectedRelease || !selectedAsset) return;

    // Check safety
    if (safetyReport && !safetyReport.isVerified && !showUnverifiedWarning) {
      setShowUnverifiedWarning(true);
      return;
    }

    setShowUnverifiedWarning(false);
    onInstall(repo, selectedRelease, selectedAsset);
    onClose();
  };

  if (!repo) return null;

  const isInstalled = !!installedApp;
  const formatMB = (bytes: number) => (bytes / (1024 * 1024)).toFixed(1) + ' MB';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <img
              src={repo.owner.avatar_url}
              alt={repo.name}
              className="w-16 h-16 rounded-2xl bg-white shadow-xs border border-slate-200 object-cover"
            />
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{repo.name}</h2>
                {safetyReport?.isVerified ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Safe
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-100/70 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Community App
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5 flex-wrap font-medium">
                <span>by {repo.owner.login}</span>
                <span className="flex items-center gap-1 text-slate-700">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {repo.stargazers_count.toLocaleString()} stars
                </span>
                <span className="flex items-center gap-1">
                  <GitFork className="w-3.5 h-3.5" />
                  {repo.forks_count.toLocaleString()} forks
                </span>
                {repo.license && (
                  <span className="bg-slate-200/60 text-slate-700 px-2 py-0.5 rounded">
                    {repo.license.name}
                  </span>
                )}
                <button
                  onClick={() => window.electronAPI.openExternal(repo.html_url)}
                  className="flex items-center gap-1 text-brand-600 hover:text-brand-700 font-semibold"
                >
                  <span>View on GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety Warning confirmation modal if unverified */}
        {showUnverifiedWarning && safetyReport && (
          <div className="bg-amber-50 border-b border-amber-200 p-4 px-6 flex items-start gap-4">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-amber-900">
              <h4 className="font-bold text-amber-950 text-sm mb-1">Notice before installing</h4>
              <p className="mb-2">
                This repository is a community-driven project that has not achieved our automatic verification threshold.
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-amber-800">
                {safetyReport.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
              {safetyReport.hasChecksum && safetyReport.checksumValue && (
                <div className="mt-2 text-[11px] font-mono bg-amber-100 p-1.5 rounded text-amber-900 break-all">
                  SHA256: {safetyReport.checksumValue}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowUnverifiedWarning(false)}
                className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 rounded-lg text-xs font-semibold hover:bg-amber-100"
              >
                Cancel
              </button>
              <button
                onClick={handleInstallClick}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                Install Anyway
              </button>
            </div>
          </div>
        )}

        {/* Body content with tabs */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Version & Asset Selector Bar */}
          <div className="p-4 px-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            {/* Version picker */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Version:</span>
              <div className="relative">
                <select
                  value={selectedRelease?.id || ''}
                  onChange={(e) => {
                    const rel = releases.find((r) => r.id === Number(e.target.value));
                    if (rel) handleReleaseChange(rel);
                  }}
                  className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  {releases.map((rel, idx) => (
                    <option key={rel.id} value={rel.id}>
                      {rel.tag_name} {idx === 0 ? '(Latest)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Resolved Asset Banner */}
            {resolvedAsset ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Detected file:</span>
                <span className="font-semibold text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                  {resolvedAsset.asset.name} ({formatMB(resolvedAsset.asset.size)})
                </span>
                <span className="text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded font-medium text-[11px]">
                  {resolvedAsset.recommendedReason}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">No pre-compiled Windows binary detected for this release</span>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 px-6 gap-6 text-xs font-semibold text-slate-500">
            <button
              onClick={() => setActiveTab('readme')}
              className={`py-3 border-b-2 transition-all ${
                activeTab === 'readme'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent hover:text-slate-800'
              }`}
            >
              Readme & Overview
            </button>
            <button
              onClick={() => setActiveTab('release')}
              className={`py-3 border-b-2 transition-all ${
                activeTab === 'release'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent hover:text-slate-800'
              }`}
            >
              Release Notes ({selectedRelease?.tag_name || 'Latest'})
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className={`py-3 border-b-2 transition-all ${
                activeTab === 'assets'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent hover:text-slate-800'
              }`}
            >
              All Release Files ({selectedRelease?.assets?.length || 0})
            </button>
          </div>

          {/* Tab Contents */}
          <div className="p-6 flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-4 py-8">
                <div className="w-1/3 h-6 bg-slate-200 rounded animate-pulse" />
                <div className="w-full h-4 bg-slate-100 rounded animate-pulse" />
                <div className="w-5/6 h-4 bg-slate-100 rounded animate-pulse" />
                <div className="w-2/3 h-4 bg-slate-100 rounded animate-pulse" />
              </div>
            ) : activeTab === 'readme' ? (
              <div className="prose prose-slate prose-sm max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-brand-600 prose-img:rounded-xl prose-img:max-h-96">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {readme || 'No documentation found in this repository.'}
                </ReactMarkdown>
              </div>
            ) : activeTab === 'release' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedRelease?.name || selectedRelease?.tag_name || 'Release Notes'}
                  </h3>
                  <span className="text-xs text-slate-400">
                    Published on {selectedRelease?.published_at ? new Date(selectedRelease.published_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="prose prose-slate prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selectedRelease?.body || 'No release notes were provided for this version.'}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 mb-3">
                  Select a specific binary file if you would prefer a non-default installer:
                </p>
                {selectedRelease?.assets?.map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id;
                  return (
                    <div
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/50 text-brand-900'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileCode className={`w-4 h-4 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                        <div>
                          <p className="text-xs font-semibold">{asset.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {formatMB(asset.size)} • {asset.download_count.toLocaleString()} downloads
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="text-xs font-semibold text-brand-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Selected
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer with Big Action Button */}
        <div className="p-5 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {safetyReport?.hasChecksum && (
              <span className="flex items-center gap-1 text-slate-600">
                <Hash className="w-3.5 h-3.5 text-brand-600" />
                Checksum Available
              </span>
            )}
            {selectedAsset && (
              <span>
                Download size: <strong className="text-slate-800">{formatMB(selectedAsset.size)}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-all"
            >
              Close
            </button>

            {isInstalled ? (
              <button
                onClick={() => onOpenApp(installedApp.id)}
                className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Open Application</span>
              </button>
            ) : (
              <button
                disabled={!selectedAsset}
                onClick={handleInstallClick}
                className="flex items-center gap-2 px-6 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs shadow-brand-500/20 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Install Now</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
