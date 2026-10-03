import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  icon: Icon,
  helperText,
  className = '',
  rows,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const isTextArea = type === 'textarea';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-bold text-[#A3A3A3] uppercase tracking-wider block">
          {label} {required && <span className="text-[#EF4444]">*</span>}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-3.5 text-[#666666] pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}

        {isTextArea ? (
          <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            rows={rows || 4}
            className={`w-full px-4 py-3 rounded-xl border bg-[#0A0A0A] text-white placeholder-[#525252] outline-none text-sm transition-all focus:border-white focus:ring-1 focus:ring-white/20 ${
              error ? 'border-[#EF4444]' : 'border-[#262626]'
            }`}
            {...props}
          />
        ) : (
          <input
            type={inputType}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className={`w-full ${Icon ? 'pl-10' : 'px-4'} ${
              isPassword ? 'pr-10' : 'pr-4'
            } py-3 rounded-xl border bg-[#0A0A0A] text-white placeholder-[#525252] outline-none text-sm transition-all focus:border-white focus:ring-1 focus:ring-white/20 ${
              error ? 'border-[#EF4444]' : 'border-[#262626]'
            }`}
            {...props}
          />
        )}

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#666666] hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {error && <p className="text-xs font-medium text-[#EF4444] mt-1">{error}</p>}
      {helperText && !error && <p className="text-xs text-[#666666] mt-1">{helperText}</p>}
    </div>
  );
}
