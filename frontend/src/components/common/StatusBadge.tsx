import React from 'react';

interface StatusBadgeProps { status: string; className?: string; }

type Cfg = { cls: string; label: string };

function getConfig(s: string): Cfg {
  switch (s) {
    case 'approved': case 'active': case 'published': case 'accepted':
      return { cls: 'badge badge-green', label: s === 'active' ? 'Active' : s === 'published' ? 'Published' : s === 'accepted' ? 'Accepted' : 'Approved' };
    case 'pending': case 'pending-review': case 'pending_review':
      return { cls: 'badge badge-amber', label: s === 'pending' ? 'Pending' : 'Pending Review' };
    case 'on-hold': case 'hold': case 'on_hold': case 'pending-revision': case 'pending_revision':
      return { cls: 'badge badge-orange', label: s.includes('revision') ? 'Needs Revision' : 'On Hold' };
    case 'rejected':
      return { cls: 'badge badge-red', label: 'Rejected' };
    case 'complete': case 'completed': case 'submitted':
      return { cls: 'badge badge-blue', label: s === 'submitted' ? 'Submitted' : 'Completed' };
    case 'draft':
      return { cls: 'badge badge-gray', label: 'Draft' };
    default:
      return { cls: 'badge badge-gray', label: s?.replace(/_/g, ' ') || '—' };
  }
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const normalised = status?.toLowerCase().replace(/[\s]+/g, '-') || '';
  const { cls, label } = getConfig(normalised);
  return (
    <span className={`${cls} ${className}`}>
      <span className="badge-dot" />
      {label}
    </span>
  );
};
