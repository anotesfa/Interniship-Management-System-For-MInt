// Button component — MInT IMS Design System
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}


export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded transition-colors duration-150 ' +
    'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-mint-blue ' +
    'active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants: Record<string, string> = {
    primary:
      'bg-mint-navy text-white border border-mint-navy hover:bg-mint-blue hover:border-mint-blue',
    secondary:
      'bg-white text-text-primary border border-border-default hover:bg-surface-page hover:border-border-strong',
    danger:
      'bg-status-rejected-bg text-status-rejected-text border border-status-rejected-dot ' +
      'hover:bg-eth-red hover:text-white hover:border-eth-red',
    ghost:
      'bg-transparent text-mint-steel border border-transparent hover:bg-mint-pale hover:border-border-default',
    success:
      'bg-status-approved-bg text-status-approved-text border border-status-approved-dot ' +
      'hover:bg-eth-green hover:text-white hover:border-eth-green',
  };

  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-body-sm h-[32px]',
    md: 'px-4 py-2 text-body-sm h-[38px]',
    lg: 'px-5 py-2.5 text-body h-[44px]',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Processing…
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0 w-4 h-4">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};