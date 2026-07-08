// Card component — MInT IMS Design System
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  accentColor?: 'green' | 'blue' | 'amber' | 'red' | 'none';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  actions,
  padding = 'md',
  accentColor = 'none',
}) => {
  const paddingStyles: Record<string, string> = {
    none: '',
    sm:   'p-4',
    md:   'p-5',
    lg:   'p-6',
  };

  const accentStyles: Record<string, string> = {
    green: 'border-l-[3px] border-l-eth-green',
    blue:  'border-l-[3px] border-l-mint-steel',
    amber: 'border-l-[3px] border-l-status-pending-dot',
    red:   'border-l-[3px] border-l-eth-red',
    none:  '',
  };

  return (
    <div className={`bg-surface-white rounded-md border border-border-default shadow-level-1 overflow-hidden ${accentStyles[accentColor]} ${className}`}>
      {(title || actions) && (
        <div className="px-5 py-3.5 border-b border-border-subtle flex items-center justify-between gap-4">
          <div className="min-w-0">
            {title && (
              <h3 className="text-[0.9375rem] font-semibold text-text-primary leading-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-caption text-text-hint mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
    </div>
  );
};
