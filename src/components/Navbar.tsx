import React, { useRef, useEffect } from 'react';
import { Search, X, Link as LinkIcon, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit?: () => void;
  hasCustomToken?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  hasCustomToken,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isUrl = searchQuery.includes('github.com/');

  return (
    <header className="h-16 px-8 bg-white border-b border-slate-200 flex items-center justify-between gap-6 shrink-0">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-2xl">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          {isUrl ? <LinkIcon className="w-4 h-4 text-brand-600" /> : <Search className="w-4 h-4" />}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onSearchSubmit) {
              onSearchSubmit();
            }
          }}
          placeholder="Search apps on GitHub or paste repo link (e.g. obsproject/obs-studio)..."
          className="w-full pl-10 pr-24 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-brand-500/10 rounded-xl text-sm text-slate-900 placeholder-slate-400 transition-all"
        />

        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-16 pr-2 flex items-center text-slate-400 hover:text-slate-600"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <kbd className="inline-flex items-center px-1.5 py-0.5 border border-slate-200 bg-white text-[11px] font-medium text-slate-400 rounded-md shadow-2xs">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Right side status indicator */}
      <div className="flex items-center gap-3">
        {hasCustomToken ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-50 border border-brand-100 text-brand-700 rounded-full text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            <span>GitHub Connected</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>Public API Mode</span>
          </div>
        )}
      </div>
    </header>
  );
};
