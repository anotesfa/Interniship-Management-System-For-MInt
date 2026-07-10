import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserRole } from '../../types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  disabled?: boolean;
  lockHint?: string;
}

interface SidebarProps {
  user: { full_name: string; email: string; role: UserRole };
  navigationLinks: NavItem[];
  onLogout: () => void;
}

const roleLabel: Record<UserRole, string> = {
  [UserRole.ADMIN]:      'System Administrator',
  [UserRole.UNIVERSITY]: 'University Coordinator',
  [UserRole.SUPERVISOR]: 'Internship Supervisor',
  [UserRole.STUDENT]:    'Intern Student',
};

const avatarClass: Record<UserRole, string> = {
  [UserRole.ADMIN]:      'avatar-navy',
  [UserRole.UNIVERSITY]: 'avatar-green',
  [UserRole.SUPERVISOR]: 'avatar-steel',
  [UserRole.STUDENT]:    'avatar-amber',
};

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export const Sidebar: React.FC<SidebarProps> = ({ user, navigationLinks, onLogout }) => {
  const navigate  = useNavigate();
  const location  = useLocation();

  return (
    <aside className="sidebar">
      {/* Ethiopian flag stripe */}
      <div className="sidebar-flag">
        <span /><span /><span />
      </div>

      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <img src="/assets/images/mint logo6.png" alt="MInT"
              style={{ width: 26, height: 26, objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.92)', lineHeight: 1.3 }}>
              Internship<br />Management
            </div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}>
          Ministry of Innovation &amp; Technology
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        <div className="sidebar-nav-label">Main Menu</div>
        {navigationLinks.map((link) => {
          const isActive   = location.pathname === link.href || location.pathname.startsWith(link.href + '/');
          const isDisabled = !!link.disabled;
          return (
            <button
              key={link.href}
              onClick={() => { if (!isDisabled) navigate(link.href); }}
              disabled={isDisabled}
              className={`nav-item${isActive ? ' active' : ''}${isDisabled ? ' opacity-40 cursor-not-allowed' : ''}`}
              title={isDisabled ? link.lockHint : undefined}
            >
              <span className="nav-item-icon">{link.icon}</span>
              <span style={{ flex: 1, fontSize: 13 }}>{link.label}</span>
              {isDisabled && (
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                  background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)',
                  padding: '2px 7px', borderRadius: 20, textTransform: 'uppercase',
                }}>Locked</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(0,0,0,0.15)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className={`avatar avatar-sm ${avatarClass[user.role]}`}>
            {initials(user.full_name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.full_name}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {roleLabel[user.role]}
            </div>
          </div>
          <button onClick={onLogout} title="Sign out" style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.4)', padding: 6, borderRadius: 8,
            transition: 'all 0.18s', flexShrink: 0,
          }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};
