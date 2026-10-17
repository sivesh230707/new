import React, { useState } from 'react';
import { 
  HardDrive, Play, RefreshCw, Trash2, CheckCircle2, 
  AlertCircle, ExternalLink, ArrowUpCircle, Loader2 
} from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import type { InstalledApp } from '../types';

interface MyAppsViewProps {
  installedApps: InstalledApp[];
  onOpenApp: (appId: string) => void;
  onUpdateApp: (app: InstalledApp) => void;
  onUpdateAll: () => void;
  onUninstallApp: (appId: string) => void;
  onCheckUpdates: () => Promise<void>;
  onExplore: () => void;
}

export const MyAppsView: React.FC<MyAppsViewProps> = ({
  installedApps,
  onOpenApp,
  onUpdateApp,
  onUpdateAll,
  onUninstallApp,
  onCheckUpdates,
  onExplore,
}) => {
  const [checking, setChecking] = useState(false);
  const [confirmUninstallId, setConfirmUninstallId] = useState<string | null>(null);

  const appsWithUpdates = installedApps.filter((a) => a.hasUpdate);

  const handleCheck = async () => {
    setChecking(true);
    try {
      await onCheckUpdates();
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Installed Applications</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your installed GitHub software, check for updates, and launch apps.
          </p>
        </div>

        {installedApps.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              disabled={checking}
              onClick={handleCheck}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-brand-600' : 'text-slate-500'}`} />
              <span>{checking ? 'Checking Updates...' : 'Check for Updates'}</span>
            </button>

            {appsWithUpdates.length > 0 && (
              <button
                onClick={onUpdateAll}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95"
              >
                <ArrowUpCircle className="w-4 h-4" />
                <span>Update All ({appsWithUpdates.length})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {installedApps.length === 0 ? (
        <EmptyState
          icon={HardDrive}
          title="No software installed yet"
          description="You haven't installed any applications through GitHub Installer yet. Head over to Explore to discover amazing free tools and apps."
          actionText="Explore Software"
          onAction={onExplore}
        />
      ) : (
        <div className="space-y-3">
          {installedApps.map((app) => {
            const isConfirming = confirmUninstallId === app.id;
            return (
              <div
                key={app.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-all"
              >
                {/* Left: Avatar + Details */}
                <div className="flex items-center gap-4">
                  <img
                    src={app.avatar_url}
                    alt={app.name}
                    className="w-12 h-12 rounded-xl bg-slate-100 object-cover border border-slate-100 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-slate-900 text-sm">{app.name}</h3>
                      {app.hasUpdate ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 font-semibold text-[11px] rounded-full flex items-center gap-1">
                          <ArrowUpCircle className="w-3 h-3" />
                          Update to {app.latestVersion}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-medium text-[11px] rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Up to date
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                      <span>by {app.owner}</span>
                      <span>•</span>
                      <span>Version: <strong className="text-slate-600 font-medium">{app.installedVersion}</strong></span>
                      <span>•</span>
                      <span>Installed on {new Date(app.installDate).toLocaleDateString()}</span>
                      <span>•</span>
                      <button
                        onClick={() => window.electronAPI.openExternal(app.repoUrl)}
                        className="text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium"
                      >
                        <span>GitHub</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  {/* Uninstall Confirm state */}
                  {isConfirming ? (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 p-1.5 px-3 rounded-xl">
                      <span className="text-xs font-semibold text-rose-800">Uninstall {app.name}?</span>
                      <button
                        onClick={() => {
                          onUninstallApp(app.id);
                          setConfirmUninstallId(null);
                        }}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmUninstallId(null)}
                        className="px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs hover:bg-slate-100"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      {app.hasUpdate && (
                        <button
                          onClick={() => onUpdateApp(app)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Update</span>
                        </button>
                      )}

                      <button
                        onClick={() => onOpenApp(app.id)}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Open</span>
                      </button>

                      <button
                        onClick={() => setConfirmUninstallId(app.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Uninstall"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
