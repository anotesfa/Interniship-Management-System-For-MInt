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

const accentBorderMap: Record<string, string> = {
  green: 'border-l-[3px] border-l-[#078930]',
  blue:  'border-l-[3px] border-l-[#2E5B8A]',
  amber: 'border-l-[3px] border-l-[#C47900]',
  red:   'border-l-[3px] border-l-[#B91C1C]',
  none:  '',
};

const paddingMap: Record<string, string> = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
};

export const Card: React.FC<CardProps> = ({
  children, className = '', title, subtitle, actions,
  padding = 'md', accentColor = 'none',
}) => (
  <div className={`card ${accentBorderMap[accentColor]} ${className}`}>
    {(title || actions) && (
      <div className="card-header">
        <div style={{ minWidth: 0 }}>
          {title && (
            <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: '#0F2040', lineHeight: 1.3 }}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p style={{ margin: '3px 0 0', fontSize: 12, color: '#8898B4' }}>{subtitle}</p>
          )}
        </div>
        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {actions}
          </div>
        )}
      </div>
    )}
    <div className={paddingMap[padding]}>{children}</div>
  </div>
);
