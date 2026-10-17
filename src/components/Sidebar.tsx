import React from 'react';
import { Compass, HardDrive, Bookmark, Settings, DownloadCloud } from 'lucide-react';

export type NavTab = 'explore' | 'my-apps' | 'favorites' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  installedCount: number;
  updatesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  installedCount,
  updatesCount,
}) => {
  const navItems = [
    {
      id: 'explore' as NavTab,
      label: 'Explore',
      icon: Compass,
      badge: null,
    },
    {
      id: 'my-apps' as NavTab,
      label: 'My Apps',
      icon: HardDrive,
      badge: updatesCount > 0 ? `${updatesCount} update` : installedCount > 0 ? `${installedCount}` : null,
      badgeColor: updatesCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600',
    },
    {
      id: 'favorites' as NavTab,
      label: 'Favorites',
      icon: Bookmark,
      badge: null,
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-brand-500/20">
          <DownloadCloud className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">GitHub Installer</h1>
          <p className="text-xs text-slate-500 mt-1">One-Click Windows Apps</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-brand-600' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`px-2 py-0.5 text-xs rounded-full font-medium ${item.badgeColor || 'bg-slate-100 text-slate-600'}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Info */}
      <div className="p-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium text-slate-600">Windows Ready</span>
        </div>
        <span className="text-[11px] text-slate-400">v1.0.0</span>
      </div>
    </aside>
  );
};
