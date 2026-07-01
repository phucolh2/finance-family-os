import React from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  className = '',
  id,
  ...props
}) => {
  return (
    <div className="space-y-1 w-full">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-family-textMuted uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`block w-full rounded-xl border border-family-accent/20 bg-white/60 py-2.5 px-3 text-sm text-family-text focus:border-family-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-family-accent ${
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
    </div>
  );
};
