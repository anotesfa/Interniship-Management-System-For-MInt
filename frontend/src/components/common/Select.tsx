// Reusable Select component — MInT IMS Design System
import React from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  placeholder,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-body-sm font-semibold text-text-primary mb-1.5">
          {label}
          {props.required && <span className="text-eth-red ml-1">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`
          w-full h-[42px] rounded-lg border transition-all
          text-body text-text-primary
          focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue
          disabled:bg-surface-page disabled:text-text-hint disabled:cursor-not-allowed
          px-3.5
          ${error
            ? 'border-eth-red bg-surface-white'
            : 'border-border-default bg-surface-input'
          }
          ${className}
        `}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <svg className="w-3.5 h-3.5 text-eth-red flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-caption text-eth-red">{error}</p>
        </div>
      )}
      {helperText && !error && <p className="mt-1 text-caption text-text-muted">{helperText}</p>}
    </div>
  );
};
