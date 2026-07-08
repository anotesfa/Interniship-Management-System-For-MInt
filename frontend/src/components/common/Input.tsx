// Input component — MInT IMS Design System
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-caption font-semibold text-text-secondary mb-1.5 tracking-wide uppercase">
          {label}
          {props.required && <span className="text-eth-red ml-1 font-normal normal-case">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-hint pointer-events-none">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          className={`
            w-full h-[40px] rounded border text-body-sm text-text-primary
            placeholder:text-text-hint bg-surface-input
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-mint-blue focus:ring-offset-0 focus:bg-white
            disabled:bg-surface-page disabled:text-text-hint disabled:cursor-not-allowed
            ${leftIcon  ? 'pl-9 pr-3.5' : 'px-3.5'}
            ${rightIcon ? 'pr-9'        : ''}
            ${error
              ? 'border-eth-red focus:border-eth-red focus:ring-eth-red/20'
              : 'border-border-default focus:border-mint-steel'
            }
            ${className}
          `}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-hint">
            {rightIcon}
          </div>
        )}
      </div>

      {error      && <p className="mt-1 text-caption text-eth-red">{error}</p>}
      {helperText && !error && <p className="mt-1 text-caption text-text-hint">{helperText}</p>}
    </div>
  );
};
