import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />,
    info: <Info className="w-4 h-4 text-white shrink-0" />
  };

  const borders = {
    success: 'border-[#10B981]/30 bg-[#10B981]/10',
    error: 'border-[#EF4444]/30 bg-[#EF4444]/10',
    info: 'border-[#404040] bg-[#1A1A1A]'
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-semibold text-white shadow-2xl backdrop-blur-md animate-fade-in ${borders[type]}`}>
      {icons[type]}
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-[#A3A3A3] hover:text-white ml-2">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
