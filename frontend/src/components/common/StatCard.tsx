import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: { value: string; type: 'positive' | 'negative' | 'neutral' };
  accentColor?: 'green' | 'blue' | 'amber' | 'red' | 'orange' | 'navy';
  icon?: React.ReactNode;
  className?: string;
}

const colorMap: Record<string, { border: string; iconBg: string; iconColor: string; valueColor: string }> = {
  navy:   { border: '#0F2040', iconBg: 'rgba(15,32,64,0.08)',  iconColor: '#0F2040', valueColor: '#0F2040' },
  blue:   { border: '#2E5B8A', iconBg: 'rgba(46,91,138,0.08)', iconColor: '#2E5B8A', valueColor: '#0F2040' },
  green:  { border: '#078930', iconBg: 'rgba(7,137,48,0.08)',  iconColor: '#078930', valueColor: '#0F2040' },
  amber:  { border: '#C47900', iconBg: 'rgba(196,121,0,0.08)', iconColor: '#C47900', valueColor: '#0F2040' },
  red:    { border: '#B91C1C', iconBg: 'rgba(185,28,28,0.08)', iconColor: '#B91C1C', valueColor: '#0F2040' },
  orange: { border: '#C04A00', iconBg: 'rgba(192,74,0,0.08)',  iconColor: '#C04A00', valueColor: '#0F2040' },
};

const deltaStyle = {
  positive: { color: '#065F36' },
  negative: { color: '#8B1A1A' },
  neutral:  { color: '#8898B4' },
};
const deltaPrefix = { positive: '↑ ', negative: '↓ ', neutral: '' };

export const StatCard: React.FC<StatCardProps> = ({
  label, value, delta, accentColor = 'blue', icon, className = '',
}) => {
  const c = colorMap[accentColor] || colorMap.blue;
  return (
    <div className={`stat-card ${className}`}
      style={{ borderLeft: `3px solid ${c.border}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.07em', color: '#8898B4' }}>
          {label}
        </p>
        {icon && (
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: c.iconBg, color: c.iconColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {icon}
          </div>
        )}
      </div>
      <div style={{ marginTop: 12 }}>
        <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: c.valueColor, lineHeight: 1 }}>
          {value}
        </p>
        {delta && (
          <p style={{ margin: '6px 0 0', fontSize: 12, fontWeight: 600, ...deltaStyle[delta.type] }}>
            {deltaPrefix[delta.type]}{delta.value}
          </p>
        )}
      </div>
    </div>
  );
};
