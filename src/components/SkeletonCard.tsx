import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-xs animate-pulse flex flex-col justify-between h-52">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-slate-200" />
          <div className="w-16 h-5 rounded-full bg-slate-100" />
        </div>
        <div className="w-3/4 h-5 bg-slate-200 rounded mb-2" />
        <div className="w-full h-3.5 bg-slate-100 rounded mb-1.5" />
        <div className="w-2/3 h-3.5 bg-slate-100 rounded" />
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="w-20 h-4 bg-slate-100 rounded" />
        <div className="w-20 h-8 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
};
