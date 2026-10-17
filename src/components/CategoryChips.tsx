import React from 'react';
import { Sparkles, Wrench, Gamepad2, Film, Code2, Shield, LayoutGrid } from 'lucide-react';

export interface Category {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  query: string;
}

export const CATEGORIES: Category[] = [
  { id: 'all', label: 'All Apps', icon: Sparkles, query: '' },
  { id: 'tools', label: 'Tools', icon: Wrench, query: 'topic:tools OR topic:productivity' },
  { id: 'media', label: 'Media', icon: Film, query: 'topic:media OR topic:video OR topic:audio OR topic:player' },
  { id: 'developer', label: 'Developer', icon: Code2, query: 'topic:developer-tools OR topic:ide OR topic:terminal' },
  { id: 'security', label: 'Security', icon: Shield, query: 'topic:security OR topic:privacy OR topic:antivirus' },
  { id: 'games', label: 'Games', icon: Gamepad2, query: 'topic:game OR topic:emulator' },
  { id: 'utilities', label: 'Utilities', icon: LayoutGrid, query: 'topic:utility OR topic:system-tool' },
];

interface CategoryChipsProps {
  selectedCategory: string;
  onSelectCategory: (category: Category) => void;
}

export const CategoryChips: React.FC<CategoryChipsProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isSelected = selectedCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              isSelected
                ? 'bg-slate-900 text-white shadow-xs font-semibold'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-brand-300' : 'text-slate-400'}`} />
            <span>{cat.label}</span>
          </button>
        );
      })}
    </div>
  );
};
