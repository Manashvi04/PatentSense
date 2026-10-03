import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  icon: Icon,
  className = '',
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-sm font-bold gap-2'
  };

  const variantClasses = {
    primary: 'bg-white text-black hover:bg-[#E5E5E5] active:bg-[#D4D4D4] border border-white font-bold shadow-sm',
    secondary: 'bg-[#1A1A1A] text-white hover:bg-[#262626] border border-[#404040]',
    outline: 'bg-transparent text-white border border-[#404040] hover:bg-[#1A1A1A] hover:border-[#666666]',
    ghost: 'bg-transparent text-[#A3A3A3] hover:text-white hover:bg-[#1A1A1A]',
    danger: 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/20'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
