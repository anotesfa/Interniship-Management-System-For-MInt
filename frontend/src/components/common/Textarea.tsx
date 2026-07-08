// Reusable Textarea component — MInT IMS Design System
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCharCount?: boolean;
  maxLength?: number;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  showCharCount = false,
  maxLength,
  className = '',
  id,
  value,
  ...props
}) => {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-body-sm font-semibold text-text-primary mb-1.5">
          {label}
          {props.required && <span className="text-eth-red ml-1">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        value={value}
        maxLength={maxLength}
        className={`
          w-full rounded-lg border transition-all resize-none
          text-body text-text-primary placeholder:text-text-hint
          px-3.5 py-2.5
          focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue
          disabled:bg-surface-page disabled:text-text-hint disabled:cursor-not-allowed
          ${error
            ? 'border-eth-red bg-surface-white'
            : 'border-border-default bg-surface-input focus:bg-surface-white'
          }
          ${className}
        `}
        {...props}
      />
      <div className="flex justify-between items-start mt-1.5">
        <div>
          {error && (
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-eth-red flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-caption text-eth-red">{error}</p>
            </div>
          )}
          {helperText && !error && <p className="text-caption text-text-muted">{helperText}</p>}
        </div>
        {showCharCount && maxLength && (
          <p className="text-caption text-text-muted flex-shrink-0 ml-2">
            {currentLength} / {maxLength}
          </p>
        )}
      </div>
    </div>
  );
};
