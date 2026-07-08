import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { EthiopianFlag } from '../common/EthiopianFlag';
import { UserRole } from '../../types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  disabled?: boolean;
  lockHint?: string;
}

interface SidebarProps {
  user: {
    full_name: string;
    email: string;
    role: UserRole;
  };
  navigationLinks: NavItem[];
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, navigationLinks, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getRoleDisplay = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'System Administrator';
      case UserRole.UNIVERSITY:
        return 'University Coordinator';
      case UserRole.SUPERVISOR:
        return 'Internship Supervisor';
      case UserRole.STUDENT:
        return 'Intern Student';
      default:
        return role;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-mint-navy';
      case UserRole.SUPERVISOR:
        return 'bg-mint-blue';
      case UserRole.STUDENT:
        return 'bg-mint-light';
      case UserRole.UNIVERSITY:
        return 'bg-eth-green';
      default:
        return 'bg-mint-navy';
    }
  };

  return (
    <aside className="w-[220px] bg-mint-navy text-white flex flex-col h-screen fixed left-0 top-0">
      {/* Ethiopian Flag Stripe */}
      <EthiopianFlag variant="header" />

      {/* Logo Area */}
      <div className="px-[18px] pt-5 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <img 
            src="/assets/images/mint logo6.png" 
            alt="MInT Logo" 
            className="w-10 h-10 object-contain"
          />
          <div>
            <h2 className="text-sm font-bold leading-tight">Internship</h2>
            <h2 className="text-sm font-bold leading-tight">Management System</h2>
          </div>
        </div>
        <p className="text-[11px] text-white/45 leading-tight">Ministry of Innovation</p>
        <p className="text-[11px] text-white/45 leading-tight">and Technology</p>
        <span className="inline-block mt-1 text-[10px] text-white/30">v2.0</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <div className="px-[18px] py-2">
          <p className="text-[10px] font-semibold uppercase text-white/35 tracking-wider mb-1">
            Navigation
          </p>
        </div>
        
        {navigationLinks.map((link) => {
          const isActive = location.pathname === link.href;
          const isDisabled = !!link.disabled;
          return (
            <button
              key={link.href}
              onClick={() => {
                if (!isDisabled) {
                  navigate(link.href);
                }
              }}
              disabled={isDisabled}
              className={`
                w-full flex items-center gap-2.5 px-[18px] py-2.5 text-left
                border-l-[3px] transition-all duration-150
                ${isDisabled
                  ? 'border-transparent text-white/35 cursor-not-allowed'
                  : isActive
                    ? 'bg-white/10 border-eth-yellow text-white'
                    : 'border-transparent text-white/65 hover:bg-white/6 hover:text-white/90'
                }
              `}
            >
              <span className={`text-base ${isActive ? 'text-white' : 'text-white/55'}`}>
                {link.icon}
              </span>
              <span className="flex-1 text-[13px]">{link.label}</span>
              {isDisabled && (
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-white/10 text-white/60 rounded-full px-2 py-0.5">
                  Locked
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="border-t border-white/10 p-[14px]">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full ${getAvatarColor(user.role)} flex items-center justify-center text-white text-xs font-semibold`}>
            {getInitials(user.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user.full_name}</p>
            <p className="text-[10px] text-white/40 truncate">{getRoleDisplay(user.role)}</p>
          </div>
          <button
            onClick={onLogout}
            className="text-white/55 hover:text-white transition-colors"
            title="Sign out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};
