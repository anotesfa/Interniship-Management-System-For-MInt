// StatCard — MInT IMS Design System
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
  };
  accentColor?: 'green' | 'blue' | 'amber' | 'red' | 'orange';
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  delta,
  accentColor = 'blue',
  icon,
  className = '',
}) => {
  const accentBorder: Record<string, string> = {
    green: 'border-l-eth-green',
    blue:  'border-l-mint-steel',
    amber: 'border-l-status-pending-dot',
    red:   'border-l-eth-red',
    orange: 'border-l-status-hold-dot',
  };

  const deltaColor: Record<string, string> = {
    positive: 'text-status-approved-text',
    negative: 'text-status-rejected-text',
    neutral:  'text-text-hint',
  };

  const deltaPrefix: Record<string, string> = {
    positive: '↑ ',
    negative: '↓ ',
    neutral:  '',
  };

  return (
    <div
      className={`
        bg-surface-white rounded-md border border-border-default shadow-level-1
        border-l-[3px] ${accentBorder[accentColor]}
        p-5 flex flex-col gap-3 ${className}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-caption font-semibold uppercase tracking-wider text-text-hint">
          {label}
        </p>
        {icon && (
          <div className="text-text-hint w-4 h-4 flex-shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div>
        <p className="text-[1.75rem] font-bold text-text-primary leading-none">
          {value}
        </p>
        {delta && (
          <p className={`text-caption mt-1.5 font-medium ${deltaColor[delta.type]}`}>
            {deltaPrefix[delta.type]}{delta.value}
          </p>
        )}
      </div>
    </div>
  );
};
