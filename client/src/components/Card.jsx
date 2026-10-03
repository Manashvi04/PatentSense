import React from 'react';

export default function Card({ children, className = '', header, actions, padding = 'p-6' }) {
  return (
    <div className={`mono-card bg-[#1A1A1A] border border-[#262626] rounded-2xl ${className}`}>
      {(header || actions) && (
        <div className="px-6 py-4 border-b border-[#262626] flex items-center justify-between flex-wrap gap-3">
          {header && <div>{header}</div>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padding}>{children}</div>
    </div>
  );
}
