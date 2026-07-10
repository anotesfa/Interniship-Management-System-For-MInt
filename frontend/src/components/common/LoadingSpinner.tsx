import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizeMap = { sm: 20, md: 32, lg: 48 };

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
  const px = sizeMap[size];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 24px', gap: 12 }}>
      <div style={{ position: 'relative', width: px, height: px }}>
        {/* Track */}
        <svg width={px} height={px} viewBox="0 0 48 48" fill="none"
          style={{ position: 'absolute', top: 0, left: 0 }}>
          <circle cx="24" cy="24" r="20" stroke="#e8edf5" strokeWidth="4" />
        </svg>
        {/* Spinner */}
        <svg width={px} height={px} viewBox="0 0 48 48" fill="none"
          className="spin" style={{ position: 'absolute', top: 0, left: 0 }}>
          <circle cx="24" cy="24" r="20"
            stroke="url(#spinGrad)" strokeWidth="4"
            strokeLinecap="round" strokeDasharray="80 52" />
          <defs>
            <linearGradient id="spinGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor="#0F2040" />
              <stop offset="100%" stopColor="#2E5B8A" />
            </linearGradient>
          </defs>
        </svg>
        {/* Centre dot */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: px * 0.25, height: px * 0.25, borderRadius: '50%',
          background: 'linear-gradient(135deg,#1A3D6B,#0F2040)',
        }} />
      </div>
      {text && (
        <p style={{ margin: 0, fontSize: 12.5, color: '#8898B4', fontWeight: 500 }}>{text}</p>
      )}
    </div>
  );
};
