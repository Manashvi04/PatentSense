import React from 'react';
import { FileSearch } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  title = 'No patent analyses yet',
  description = 'Start your first analysis to discover patent novelty and relevant prior art.',
  actionLabel = 'Start Analysis',
  onAction,
  icon: Icon = FileSearch,
  className = ''
}) {
  return (
    <div className={`p-12 text-center border border-[#262626] rounded-2xl bg-[#1A1A1A]/50 flex flex-col items-center justify-center ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-[#262626] border border-[#404040] flex items-center justify-center text-[#A3A3A3] mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-display font-bold text-lg text-white mb-1.5">{title}</h3>
      <p className="text-xs text-[#A3A3A3] max-w-md leading-relaxed mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
