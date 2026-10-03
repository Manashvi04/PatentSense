import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = 'Search by title, number, keywords...',
  filters,
  className = ''
}) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <div className="flex-1 min-w-[240px] relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#262626] bg-[#0A0A0A] text-white placeholder-[#525252] outline-none text-sm transition-all focus:border-white focus:ring-1 focus:ring-white/20"
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {filters && <div className="flex items-center gap-2">{filters}</div>}
    </div>
  );
}
