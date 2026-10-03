import React from 'react';

export default function Badge({ children, variant = 'neutral', size = 'sm', className = '' }) {
  const baseClasses = 'inline-flex items-center font-semibold rounded-md uppercase tracking-wider transition-colors';
  
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-xs font-bold'
  };

  const variantClasses = {
    neutral: 'bg-[#262626] text-[#D4D4D4] border border-[#404040]',
    completed: 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30',
    processing: 'bg-white/10 text-white border border-white/30 animate-pulse',
    failed: 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30',
    highNovelty: 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/40',
    mediumNovelty: 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/40',
    lowNovelty: 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/40',
    outline: 'border border-[#404040] text-[#A3A3A3]',
    white: 'bg-white text-black font-bold'
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant] || variantClasses.neutral} ${className}`}>
      {children}
    </span>
  );
}
