// Status badge — MInT IMS Design System
import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

type BadgeConfig = {
  bg:    string;
  text:  string;
  dot:   string;
  label: string;
};

const getConfig = (s: string): BadgeConfig => {
  switch (s) {
    case 'approved':
    case 'active':
    case 'published':
    case 'accepted':
      return { bg: 'bg-status-approved-bg', text: 'text-status-approved-text', dot: 'bg-status-approved-dot', label: s === 'active' ? 'ACTIVE' : s === 'published' ? 'PUBLISHED' : s === 'accepted' ? 'ACCEPTED' : 'APPROVED' };

    case 'pending':
    case 'pending-review':
    case 'pending_review':
      return { bg: 'bg-status-pending-bg', text: 'text-status-pending-text', dot: 'bg-status-pending-dot', label: s === 'pending' ? 'PENDING' : 'PENDING REVIEW' };

    case 'on-hold':
    case 'hold':
    case 'on_hold':
    case 'pending-revision':
    case 'pending_revision':
      return { bg: 'bg-status-hold-bg', text: 'text-status-hold-text', dot: 'bg-status-hold-dot', label: s.includes('revision') ? 'NEEDS REVISION' : 'ON HOLD' };

    case 'rejected':
      return { bg: 'bg-status-rejected-bg', text: 'text-status-rejected-text', dot: 'bg-status-rejected-dot', label: 'REJECTED' };

    case 'complete':
    case 'completed':
    case 'submitted':
      return { bg: 'bg-status-completed-bg', text: 'text-status-completed-text', dot: 'bg-status-completed-dot', label: s === 'submitted' ? 'SUBMITTED' : 'COMPLETED' };

    case 'draft':
      return { bg: 'bg-surface-page', text: 'text-text-hint', dot: 'bg-border-strong', label: 'DRAFT' };

    default:
      return { bg: 'bg-surface-page', text: 'text-text-hint', dot: 'bg-border-strong', label: s?.toUpperCase() || '—' };
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalised = status?.toLowerCase().replace(/[\s_-]+/g, '-') || '';
  const { bg, text, dot, label } = getConfig(normalised);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-semibold tracking-wider ${bg} ${text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {label}
    </span>
  );
};