import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  suffix?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  suffix,
  error,
  className = '',
  id,
  type,
  ...props
}) => {
  // Hide number spinners using Tailwind arbitrary variants
  const hideSpinnersClass = type === 'number' 
    ? '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
    : '';

  // Determine padding based on suffix length to prevent text overlap
  let paddingRightClass = '';
  if (suffix) {
    if (suffix.length >= 12) paddingRightClass = 'pr-32';
    else if (suffix.length > 8) paddingRightClass = 'pr-24';
    else if (suffix.length > 4) paddingRightClass = 'pr-20';
    else paddingRightClass = 'pr-12';
  }

  return (
    <div className="space-y-1 w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-family-textMuted uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative rounded-xl shadow-sm">
        <input
          id={id}
          type={type}
          className={`block w-full rounded-xl border border-family-accent/20 bg-white/60 py-2.5 px-3 text-sm text-family-text placeholder-family-textLight/50 focus:border-family-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-family-accent ${paddingRightClass} ${hideSpinnersClass} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
          {...props}
        />
        {suffix && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-xs font-semibold text-family-textLight uppercase tracking-wider">{suffix}</span>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
    </div>
  );
};
