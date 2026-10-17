import React from 'react';
import { LucideIcon, PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = PackageOpen,
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in max-w-md mx-auto my-8">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-4 shadow-2xs">
        <Icon className="w-8 h-8 text-slate-500" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed mb-6">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
