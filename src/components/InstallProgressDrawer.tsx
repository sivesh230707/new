import React from 'react';
import { DownloadCloud, Play, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { DownloadProgress } from '../types';

interface InstallProgressDrawerProps {
  progress: DownloadProgress | null;
  onCancel: (repoFullName: string) => void;
  onOpenApp: (appId: string) => void;
  onDismiss: () => void;
}

export const InstallProgressDrawer: React.FC<InstallProgressDrawerProps> = ({
  progress,
  onCancel,
  onOpenApp,
  onDismiss,
}) => {
  if (!progress) return null;

  const isDownloading = progress.status === 'downloading';
  const isInstalling = progress.status === 'installing';
  const isCompleted = progress.status === 'completed';
  const isError = progress.status === 'error';
  const isCancelled = progress.status === 'cancelled';

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-lg w-full animate-fade-in">
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xl p-4.5 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isCompleted
                  ? 'bg-emerald-100 text-emerald-600'
                  : isError
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-brand-50 text-brand-600'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : isError ? (
                <AlertCircle className="w-5 h-5" />
              ) : isInstalling ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <DownloadCloud className="w-5 h-5 animate-bounce" />
              )}
            </div>

            <div className="overflow-hidden">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                {isCompleted
                  ? 'Installation Complete'
                  : isError
                  ? 'Installation Issue'
                  : isInstalling
                  ? 'Installing Application...'
                  : 'Downloading Software...'}
              </h4>
              <p className="text-[11px] text-slate-500 truncate">{progress.message}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isDownloading && (
              <button
                onClick={() => onCancel(progress.id)}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-xs font-medium hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}

            {isCompleted && (
              <button
                onClick={() => onOpenApp(progress.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Open</span>
              </button>
            )}

            {(isCompleted || isError || isCancelled) && (
              <button
                onClick={onDismiss}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar & Speed */}
        {isDownloading && (
          <div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-brand-600 h-full transition-all duration-200 rounded-full"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1 font-medium">
              <span>{progress.percent}%</span>
              <span>{progress.speedMBs > 0 ? `${progress.speedMBs} MB/s` : 'Connecting...'}</span>
            </div>
          </div>
        )}

        {isInstalling && (
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-brand-500 h-full w-2/3 animate-pulse rounded-full" />
          </div>
        )}

        {isError && progress.error && (
          <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100">
            {progress.error}
          </p>
        )}
      </div>
    </div>
  );
};
