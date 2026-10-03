import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'Unable to complete analysis',
  description = "We couldn't process this request right now. Please check your data and try again.",
  onRetry,
  className = ''
}) {
  return (
    <div className={`p-8 rounded-2xl border border-[#EF4444]/30 bg-[#EF4444]/5 flex flex-col items-center justify-center text-center ${className}`}>
      <div className="w-12 h-12 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444] mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="font-bold text-base text-white mb-1">{title}</h3>
      <p className="text-xs text-[#A3A3A3] max-w-sm leading-relaxed mb-5">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} icon={RefreshCw}>
          Try Again
        </Button>
      )}
    </div>
  );
}
