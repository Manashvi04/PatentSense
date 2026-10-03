import React from 'react';

export default function LoadingState({ type = 'table', count = 4 }) {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-6 rounded-2xl border border-[#262626] bg-[#1A1A1A] space-y-3">
            <div className="h-3 bg-[#262626] rounded w-1/2" />
            <div className="h-8 bg-[#262626] rounded w-3/4" />
            <div className="h-3 bg-[#262626] rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'report') {
    return (
      <div className="space-y-6 animate-pulse p-8">
        <div className="h-8 bg-[#262626] rounded w-2/3" />
        <div className="h-4 bg-[#262626] rounded w-1/3" />
        <div className="grid lg:grid-cols-3 gap-8 pt-4">
          <div className="h-64 bg-[#1A1A1A] rounded-2xl border border-[#262626]" />
          <div className="lg:col-span-2 h-64 bg-[#1A1A1A] rounded-2xl border border-[#262626]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border border-[#262626] bg-[#1A1A1A] space-y-4 animate-pulse">
      <div className="h-4 bg-[#262626] rounded w-1/4" />
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-10 bg-[#262626]/60 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
