import React from 'react';

interface TopBarProps {
  title: string;
  breadcrumb?: string[];
  actions?: React.ReactNode;
  unreadCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({ title, breadcrumb, actions, unreadCount = 0 }) => {
  return (
    <header className="topbar">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            {breadcrumb.map((crumb, i) => (
              <React.Fragment key={i}>
                <span style={{ fontSize: 11, color: '#8898B4', fontWeight: 500 }}>{crumb}</span>
                {i < breadcrumb.length - 1 && (
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    style={{ color: '#c5cdd9' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0F2040', lineHeight: 1.2 }}>
          {title}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Notification bell */}
        <button style={{
          position: 'relative', background: '#f0f4fa', border: '1px solid #e8edf5',
          borderRadius: 10, width: 36, height: 36, display: 'flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          color: '#4A5568', transition: 'all 0.18s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#e8edf5'; e.currentTarget.style.color = '#0F2040'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#f0f4fa'; e.currentTarget.style.color = '#4A5568'; }}
        >
          <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 6, right: 6,
              width: 8, height: 8, borderRadius: '50%',
              background: '#DA121A', border: '1.5px solid white',
            }} />
          )}
        </button>

        {/* Divider */}
        {actions && (
          <div style={{ width: 1, height: 24, background: '#e8edf5' }} />
        )}

        {actions}
      </div>
    </header>
  );
};
