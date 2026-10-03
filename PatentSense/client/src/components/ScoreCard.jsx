import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function ScoreCard({
  title,
  value,
  subtitle,
  change,
  isPositive = true,
  icon: Icon,
  className = ''
}) {
  return (
    <div className={`p-6 rounded-2xl border border-[#262626] bg-[#1A1A1A] hover:border-[#404040] transition-all duration-200 ${className}`}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#A3A3A3]">{title}</span>
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-[#262626] border border-[#404040] flex items-center justify-center text-white">
            <Icon className="w-4 h-4 text-[#D4D4D4]" />
          </div>
        )}
      </div>
      
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display font-extrabold text-3xl text-white tracking-tight">{value}</h2>
        {change && (
          <div className={`flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${
            isPositive 
              ? 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/20' 
              : 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20'
          }`}>
            {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {change}
          </div>
        )}
      </div>

      {subtitle && <p className="text-xs text-[#666666] mt-1.5">{subtitle}</p>}
    </div>
  );
}
