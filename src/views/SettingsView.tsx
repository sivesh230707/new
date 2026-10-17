import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, FolderOpen, Key, Trash2, 
  RefreshCw, Check, ShieldCheck, Laptop, ExternalLink 
} from 'lucide-react';
import type { AppSettings } from '../types';

interface SettingsViewProps {
  onClearCache: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onClearCache }) => {
  const [settings, setSettings] = useState<AppSettings>({
    managedAppsDir: '',
    autoCheckUpdates: true,
    githubToken: '',
  });
  const [systemInfo, setSystemInfo] = useState<{ platform: string; arch: string; appsDir: string; osVersion?: string }>({
    platform: 'win32',
    arch: 'x64',
    appsDir: '',
  });
  const [tokenInput, setTokenInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  useEffect(() => {
    const load = async () => {
      const s = await window.electronAPI.getSettings();
      const info = await window.electronAPI.getSystemInfo();
      setSettings(s);
      setTokenInput(s.githubToken || '');
      setSystemInfo(info);
    };
    load();
  }, []);

  const handleSaveToken = async () => {
    const updated = await window.electronAPI.saveSettings({
      githubToken: tokenInput.trim(),
    });
    setSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleToggleAutoCheck = async () => {
    const updated = await window.electronAPI.saveSettings({
      autoCheckUpdates: !settings.autoCheckUpdates,
    });
    setSettings(updated);
  };

  const handleClear = async () => {
    await onClearCache();
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 2500);
  };

  const handleOpenFolder = () => {
    if (systemInfo.appsDir) {
      window.electronAPI.openExternal(`file://${systemInfo.appsDir}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-brand-600" />
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Application Settings</h2>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure installation paths, update preferences, and GitHub connectivity.
        </p>
      </div>

      <div className="space-y-5">
        {/* Managed Folder Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Application Storage Location</h3>
              <p className="text-xs text-slate-500 mt-1">
                Portable software and desktop shortcuts are managed inside your local user data directory.
              </p>
            </div>
            <button
              onClick={handleOpenFolder}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Open Folder</span>
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl font-mono text-xs text-slate-700 select-all truncate">
            {systemInfo.appsDir || settings.managedAppsDir}
          </div>
        </div>

        {/* GitHub Token Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-900">GitHub API Access (Optional)</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              GitHub limits guest searches to 60 requests per hour. If you run into rate limits, paste a free GitHub Personal Access Token (classic or fine-grained) to increase your limit to 5,000 requests per hour. No special permissions are required.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white rounded-xl text-xs font-mono text-slate-900 focus:outline-none"
            />
            <button
              onClick={handleSaveToken}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95 shrink-0"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Token</span>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Leave blank to use anonymous public API mode.</span>
            <button
              onClick={() => window.electronAPI.openExternal('https://github.com/settings/tokens')}
              className="text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium"
            >
              <span>Create GitHub Token</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Updates and Maintenance */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-slate-900">Preferences & Maintenance</h3>

          {/* Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-900">Automatic Update Checks</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically check if newer releases are available for your installed software.
              </p>
            </div>
            <button
              onClick={handleToggleAutoCheck}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.autoCheckUpdates ? 'bg-brand-600' : 'bg-slate-200'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                  settings.autoCheckUpdates ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-900">Clear Download & API Cache</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Frees up disk space by removing cached installer archives and refreshing catalog data.
              </p>
            </div>
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all"
            >
              {cacheCleared ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cleared!</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Clear Cache</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900">System Environment</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs pt-1">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[11px]">Platform</span>
              <span className="font-semibold text-slate-800">Windows ({systemInfo.arch})</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[11px]">Version</span>
              <span className="font-semibold text-slate-800">{systemInfo.osVersion || 'Windows 11'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[11px]">Installer Engine</span>
              <span className="font-semibold text-slate-800">Silent NSIS / Portable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
