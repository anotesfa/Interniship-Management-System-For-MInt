// Admin - Audit Logs Page (FR-RPT-003, FR-RPT-004)
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, LoadingSpinner, Button, EmptyState, ConfirmDialog } from '../../components/common';
import { activityLogService } from '../../services/activity-log.service';
import { formatDateTime } from '../../utils/format';

const ROLE_COLORS: Record<string, string> = {
  Admin:                  'bg-status-eval-bg text-status-eval-text',
  Supervisor:             'bg-mint-pale text-mint-navy',
  Student:                'bg-status-approved-bg text-status-approved-text',
  'University Coordinator': 'bg-status-pending-bg text-status-pending-text',
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-status-approved-bg text-status-approved-text',
  UPDATE: 'bg-mint-pale text-mint-navy',
  DELETE: 'bg-status-rejected-bg text-status-rejected-text',
  LOGIN:  'bg-status-eval-bg text-status-eval-text',
  LOGOUT: 'bg-surface-page text-text-muted',
};

const getActionColor = (action: string) => {
  const key = Object.keys(ACTION_COLORS).find(k => action?.toUpperCase().includes(k));
  return key ? ACTION_COLORS[key] : 'bg-surface-page text-text-muted';
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, limit: 100, offset: 0 });
  const [filters, setFilters] = useState({ action: '', userName: '', startDate: '', endDate: '' });
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => { 
    loadLogs(filters, 0); 
  }, []);

  const loadLogs = async (filtersArg: any, offsetArg: number) => {
    setIsLoading(true);
    try {
      const result = await activityLogService.getAll(100, offsetArg, filtersArg) as any;
      setLogs(result?.data || []);
      setPagination(result?.pagination || { total: 0, limit: 100, offset: offsetArg });
    } catch (error) {
      console.error('Failed to load activity logs:', error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    const updatedFilters = { ...filters, [field]: value };
    setFilters(updatedFilters);
    loadLogs(updatedFilters, 0);
  };

  const handleClearFilters = () => {
    const cleared = { action: '', userName: '', startDate: '', endDate: '' };
    setFilters(cleared);
    loadLogs(cleared, 0);
  };

  const handlePreviousPage = () => {
    const newOffset = Math.max(0, pagination.offset - pagination.limit);
    loadLogs(filters, newOffset);
  };

  const handleNextPage = () => {
    const newOffset = pagination.offset + pagination.limit;
    loadLogs(filters, newOffset);
  };

  const handleClearLogs = async () => {
    setIsClearing(true);
    try {
      await activityLogService.clearAll();
      setShowClearConfirm(false);
      setLogs([]);
      setPagination(prev => ({ ...prev, total: 0, offset: 0 }));
    } catch (error) {
      console.error('Failed to clear logs:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages  = Math.ceil(pagination.total / pagination.limit);

  return (
    <DashboardLayout title="System Audit Trail" breadcrumb={['Admin', 'Audit Log']}>
      <div className="space-y-6">

        {/* Filters Card */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <h2 className="text-h3 text-text-primary">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-body-sm font-semibold text-text-primary mb-1.5">Action</label>
              <input
                type="text"
                placeholder="e.g. LOGIN, CREATE..."
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
              />
            </div>
            <div>
              <label className="block text-body-sm font-semibold text-text-primary mb-1.5">User</label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={filters.userName}
                onChange={(e) => handleFilterChange('userName', e.target.value)}
                className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
              />
            </div>
            <div>
              <label className="block text-body-sm font-semibold text-text-primary mb-1.5">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
              />
            </div>
            <div>
              <label className="block text-body-sm font-semibold text-text-primary mb-1.5">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-5 pt-4 border-t border-border-subtle">
            <Button variant="secondary" onClick={handleClearFilters}>Clear Filters</Button>
          </div>
        </Card>

        {/* Logs Table */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h3 text-text-primary">Activity Logs</h2>
            <div className="flex items-center gap-3">
              <span className="text-body-sm text-text-muted">{pagination.total.toLocaleString()} total entries</span>
              <Button variant="danger" size="sm" onClick={() => setShowClearConfirm(true)} disabled={isLoading || pagination.total === 0}>
                Clear Logs
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" text="Loading audit logs..." /></div>
          ) : logs.length === 0 ? (
            <EmptyState title="No activity logs" description="No logs match your filter criteria." />
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-border-subtle">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-surface-page border-b border-border-subtle">
                      {['Timestamp', 'User', 'Role', 'Action', 'Entity', 'IP Address'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-label uppercase tracking-wider text-text-muted whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {logs.map((log) => (
                      <tr key={log.log_id} className="hover:bg-mint-pale transition-colors">
                        <td className="px-4 py-3 text-caption text-text-muted whitespace-nowrap font-mono">
                          {formatDateTime(log.timestamp)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-body-sm font-semibold text-text-primary">{log.user_name}</p>
                          <p className="text-caption text-text-muted">{log.user_email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-caption font-semibold ${ROLE_COLORS[log.user_role] ?? 'bg-surface-page text-text-muted'}`}>
                            {log.user_role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-caption font-semibold ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-body-sm text-text-primary">{log.entity_type || '—'}</p>
                          {log.entity_id && <p className="text-caption text-text-muted">ID: {log.entity_id}</p>}
                        </td>
                        <td className="px-4 py-3 text-caption text-text-muted font-mono whitespace-nowrap">
                          {log.ip_address || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-5 pt-4 border-t border-border-subtle">
                <p className="text-body-sm text-text-muted">
                  Showing <span className="font-semibold text-text-primary">{pagination.offset + 1}</span>–<span className="font-semibold text-text-primary">{Math.min(pagination.offset + pagination.limit, pagination.total)}</span> of <span className="font-semibold text-text-primary">{pagination.total.toLocaleString()}</span>
                  {totalPages > 1 && <> · Page <span className="font-semibold text-text-primary">{currentPage}</span> of <span className="font-semibold text-text-primary">{totalPages}</span></>}
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handlePreviousPage} disabled={pagination.offset === 0}>
                    ← Previous
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleNextPage} disabled={pagination.offset + pagination.limit >= pagination.total}>
                    Next →
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>

      </div>

      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearLogs}
        title="Clear Audit Logs"
        message="This will permanently delete all audit log entries from the database. This action cannot be undone."
        confirmText="Clear Logs"
        cancelText="Cancel"
        variant="danger"
        isLoading={isClearing}
        icon="danger"
      />
    </DashboardLayout>
  );
}
