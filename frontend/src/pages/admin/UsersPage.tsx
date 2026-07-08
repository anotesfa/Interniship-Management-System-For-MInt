// Admin - User Management Page
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Button, LoadingSpinner, EmptyState, Modal, ConfirmDialog } from '../../components/common';
import { userService, SystemUser, CreateUserDto } from '../../services/user.service';
import ROLE_LABELS from '../../constants/roles';

const ROLE_OPTIONS = [
  ROLE_LABELS.ADMIN,
  ROLE_LABELS.UNIVERSITY_COORDINATOR,
  ROLE_LABELS.SUPERVISOR,
  ROLE_LABELS.STUDENT,
];

const STATUS_BADGE: Record<string, string> = {
  active:   'bg-status-approved-bg text-status-approved-text',
  locked:   'bg-status-rejected-bg text-status-rejected-text',
  inactive: 'bg-surface-page text-text-muted',
};

function EditUserModal({
  user,
  onClose,
  onUpdated,
}: {
  user: SystemUser;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [form, setForm] = useState({
    full_name: user.full_name,
    email: user.email,
    role_name: user.role?.role_name ?? 'Student',
    account_status: user.account_status,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await userService.update(user.user_id, form);
      await onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Edit User" subtitle="Update account details and role access." size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
            Full Name <span className="text-eth-red">*</span>
          </label>
          <input
            type="text"
            required
            value={form.full_name}
            onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
            className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
          />
        </div>
        <div>
          <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
            Email Address <span className="text-eth-red">*</span>
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
              Role <span className="text-eth-red">*</span>
            </label>
            <select
              value={form.role_name}
              onChange={(e) => setForm((p) => ({ ...p, role_name: e.target.value }))}
              className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
            >
              {ROLE_OPTIONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
              Status <span className="text-eth-red">*</span>
            </label>
            <select
              value={form.account_status}
              onChange={(e) => setForm((p) => ({ ...p, account_status: e.target.value }))}
              className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
            >
              {['active', 'locked', 'inactive'].map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
        {error && (
          <div className="flex items-center gap-2 bg-status-rejected-bg border border-[#FECACA] text-status-rejected-text px-4 py-3 rounded-lg text-body-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
          <Button variant="secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<CreateUserDto>({
    full_name: '',
    email: '',
    password: '',
    role_name: 'Student',
    university_id: undefined,
    registration_number: '',
    department: '',
    position: '',
    max_students: 10,
    role_title: '',
    gpa: undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const selectedRole = form.role_name;

  const setField = <K extends keyof CreateUserDto>(key: K, value: CreateUserDto[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await userService.create(form);
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Add New User" subtitle="Create a new system account and assign a role." size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
            Full Name <span className="text-eth-red">*</span>
          </label>
          <input
            type="text"
            required
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            placeholder="e.g. Abebe Kebede"
            className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
          />
        </div>
        <div>
          <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
            Email Address <span className="text-eth-red">*</span>
          </label>
          <input
            type="email"
            required
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="user@mint.gov.et"
            className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
          />
        </div>
        <div>
          <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
            Password <span className="text-eth-red">*</span>
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            placeholder="Minimum 8 characters"
            className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
          />
        </div>
        <div>
          <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
            Role <span className="text-eth-red">*</span>
          </label>
          <select
            value={form.role_name}
            onChange={e => setForm(f => ({ ...f, role_name: e.target.value }))}
            className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
          >
            {ROLE_OPTIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        {selectedRole === 'Student' && (
          <div className="space-y-4 rounded-lg border border-border-subtle bg-surface-page p-4">
            <p className="text-body-sm font-semibold text-text-primary">Student Details</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
                  University ID <span className="text-eth-red">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={form.university_id ?? ''}
                  onChange={(e) => setField('university_id', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="1"
                  className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
                />
              </div>
              <div>
                <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
                  Registration Number <span className="text-eth-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.registration_number ?? ''}
                  onChange={(e) => setField('registration_number', e.target.value)}
                  placeholder="e.g. UGR/12345/15"
                  className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
                  Department <span className="text-eth-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.department ?? ''}
                  onChange={(e) => setField('department', e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
                />
              </div>
              <div>
                <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
                  GPA
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={form.gpa ?? ''}
                  onChange={(e) => setField('gpa', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Optional"
                  className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
                />
              </div>
            </div>
          </div>
        )}
        {selectedRole === 'Supervisor' && (
          <div className="space-y-4 rounded-lg border border-border-subtle bg-surface-page p-4">
            <p className="text-body-sm font-semibold text-text-primary">Supervisor Details</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
                  Department <span className="text-eth-red">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.department ?? ''}
                  onChange={(e) => setField('department', e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
                />
              </div>
              <div>
                <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
                  Position
                </label>
                <input
                  type="text"
                  value={form.position ?? ''}
                  onChange={(e) => setField('position', e.target.value)}
                  placeholder="e.g. Lecturer"
                  className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
                />
              </div>
              <div>
                <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
                  Max Students
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.max_students ?? 10}
                  onChange={(e) => setField('max_students', e.target.value ? Number(e.target.value) : 10)}
                  className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
                />
              </div>
            </div>
          </div>
        )}
        {selectedRole === 'University Coordinator' && (
          <div className="space-y-4 rounded-lg border border-border-subtle bg-surface-page p-4">
            <p className="text-body-sm font-semibold text-text-primary">Coordinator Details</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
                  University ID <span className="text-eth-red">*</span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={form.university_id ?? ''}
                  onChange={(e) => setField('university_id', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="1"
                  className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
                />
              </div>
              <div>
                <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
                  Role Title
                </label>
                <input
                  type="text"
                  value={form.role_title ?? ''}
                  onChange={(e) => setField('role_title', e.target.value)}
                  placeholder="University Coordinator"
                  className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
                />
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-status-rejected-bg border border-[#FECACA] text-status-rejected-text px-4 py-3 rounded-lg text-body-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
          <Button variant="secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Create User
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ResetPasswordDialog({
  isOpen,
  user,
  onClose,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean;
  user: SystemUser | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Reset Password"
      message={
        user
          ? `Reset the password for "${user.full_name}"? A new temporary password will be emailed to ${user.email}.`
          : 'Reset this user\'s password?'
      }
      confirmText="Reset Password"
      cancelText="Cancel"
      variant="primary"
      isLoading={isLoading}
      icon="warning"
    />
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [nameFilter, setNameFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<SystemUser | null>(null);
  const [resetTarget, setResetTarget] = useState<SystemUser | null>(null);
  const [editTarget, setEditTarget] = useState<SystemUser | null>(null);
  const [showResetSuccess, setShowResetSuccess] = useState(false);
  const [resetSuccessUser, setResetSuccessUser] = useState<SystemUser | null>(null);
  const [lockTarget, setLockTarget] = useState<SystemUser | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const result = await userService.getAll(200, 0);
      setUsers(result.data);
      setTotal(result.pagination.total);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLock = async (user: SystemUser) => {
    setLockTarget(user);
  };

  const handleLockConfirm = async () => {
    if (!lockTarget) return;
    setActionLoading(lockTarget.user_id);
    try {
      if (lockTarget.account_status === 'locked') {
        await userService.unlockAccount(lockTarget.user_id);
      } else {
        await userService.lockAccount(lockTarget.user_id);
      }
      setLockTarget(null);
      await loadUsers();
    } catch (err) {
      console.error('Failed to update account status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.user_id);
    try {
      await userService.delete(deleteTarget.user_id);
      setDeleteTarget(null);
      await loadUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPasswordConfirm = async () => {
    if (!resetTarget) return;
    setActionLoading(resetTarget.user_id);
    try {
      await userService.resetPassword(resetTarget.user_id);
      setResetSuccessUser(resetTarget);
      setShowResetSuccess(true);
      setResetTarget(null);
      await loadUsers();
    } catch (err) {
      console.error('Failed to reset password:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const normalizedNameFilter = nameFilter.trim().toLowerCase();
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role?.role_name !== roleFilter) return false;
    if (!normalizedNameFilter) return true;
    return (
      u.full_name?.toLowerCase().includes(normalizedNameFilter) ||
      u.email?.toLowerCase().includes(normalizedNameFilter)
    );
  });

  const getRoleCount = (role: string) =>
    role === 'all' ? users.length : users.filter(u => u.role?.role_name === role).length;

  return (
    <DashboardLayout
      title="User Management"
      actions={
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          + Add New User
        </Button>
      }
    >
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreated={loadUsers}
        />
      )}

      {editTarget && (
        <EditUserModal
          user={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={loadUsers}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to permanently delete "${deleteTarget?.full_name}"? This action cannot be undone.`}
        confirmText="Delete User"
        cancelText="Cancel"
        variant="danger"
        isLoading={actionLoading === deleteTarget?.user_id}
        icon="danger"
      />

      <ResetPasswordDialog
        isOpen={!!resetTarget}
        user={resetTarget}
        onClose={() => setResetTarget(null)}
        onConfirm={handleResetPasswordConfirm}
        isLoading={actionLoading === resetTarget?.user_id}
      />

      <ConfirmDialog
        isOpen={!!lockTarget}
        onClose={() => setLockTarget(null)}
        onConfirm={handleLockConfirm}
        title={lockTarget?.account_status === 'locked' ? 'Unlock User' : 'Lock User'}
        message={
          lockTarget?.account_status === 'locked'
            ? `Unlock "${lockTarget.full_name}"? They will be able to log in again.`
            : `Lock "${lockTarget?.full_name}"? They will not be able to log in and will see the message "User locked. Contact admin in person".`
        }
        confirmText={lockTarget?.account_status === 'locked' ? 'Unlock User' : 'Lock User'}
        cancelText="Cancel"
        variant={lockTarget?.account_status === 'locked' ? 'primary' : 'danger'}
        isLoading={actionLoading === lockTarget?.user_id}
        icon={lockTarget?.account_status === 'locked' ? 'warning' : 'danger'}
      />

      {showResetSuccess && (
        <Modal
          isOpen={showResetSuccess}
          onClose={() => setShowResetSuccess(false)}
          title="Password Reset Successful"
          subtitle="Confirmation"
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-status-approved-bg border border-status-approved-dot rounded-lg p-4">
              <svg className="w-5 h-5 text-status-approved-dot flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold text-status-approved-text text-body">Password Reset</p>
                <p className="text-status-approved-text text-body-sm mt-1">
                  A new temporary password has been sent to <strong>{resetSuccessUser?.email}</strong>
                </p>
              </div>
            </div>
            <p className="text-body-sm text-text-muted">
              {resetSuccessUser?.full_name} can now log in with the temporary password and change it to a new password of their choice.
            </p>
            <div className="flex justify-end pt-2 border-t border-border-subtle">
              <Button variant="primary" onClick={() => setShowResetSuccess(false)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <div className="space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {['Admin', 'University Coordinator', 'Supervisor', 'Student'].map(role => (
            <div key={role} className="bg-white rounded-xl border border-border-default shadow-level-1 p-4">
              <p className="text-caption text-text-muted uppercase tracking-wide">{role}</p>
              <p className="text-h2 font-bold text-text-primary mt-1">{getRoleCount(role)}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Search users by name or email..."
            className="w-full max-w-md h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
          />
          <div className="flex flex-wrap gap-2">
            {['all', ...ROLE_OPTIONS].map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-2 rounded-lg text-body-sm font-semibold transition-all ${
                  roleFilter === role
                    ? 'bg-mint-navy text-white shadow-level-1'
                    : 'bg-white text-text-muted border border-border-default hover:bg-mint-pale hover:text-text-primary'
                }`}
              >
                {role === 'all' ? `All (${total})` : `${role} (${getRoleCount(role)})`}
              </button>
            ))}
          </div>
        </div>

        {/* Users table */}
        <Card>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Loading users..." />
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState title="No users found" description="No users match the selected filter." />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-surface-page border-b border-border-subtle">
                    {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-label uppercase tracking-wider text-text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredUsers.map(user => (
                    <tr key={user.user_id} className="hover:bg-mint-pale transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-mint-pale text-mint-navy flex items-center justify-center font-bold text-body-sm flex-shrink-0">
                            {(user.full_name || 'U').charAt(0)}
                          </div>
                          <span className="text-body-sm font-semibold text-text-primary">{user.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-body-sm text-text-muted">{user.email}</td>
                      <td className="px-4 py-3 text-body-sm text-text-muted">{user.role?.role_name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-caption rounded-full font-semibold ${STATUS_BADGE[user.account_status] ?? 'bg-surface-page text-text-muted'}`}>
                          {user.account_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-body-sm text-text-muted">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => setEditTarget(user)}
                            disabled={actionLoading === user.user_id}
                            className="text-caption px-3 py-1.5 rounded-lg border border-border-default text-text-primary hover:bg-surface-page font-semibold transition-colors disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleLock(user)}
                            disabled={actionLoading === user.user_id}
                            className={`text-caption px-3 py-1.5 rounded-lg border font-semibold transition-colors disabled:opacity-50 ${
                              user.account_status === 'locked'
                                ? 'border-[#A7F3D0] text-status-approved-text hover:bg-status-approved-bg'
                                : 'border-[#FDE68A] text-status-pending-text hover:bg-status-pending-bg'
                            }`}
                          >
                            {actionLoading === user.user_id ? '…' : user.account_status === 'locked' ? 'Unlock' : 'Lock'}
                          </button>
                          <button
                            onClick={() => setResetTarget(user)}
                            disabled={actionLoading === user.user_id}
                            className="text-caption px-3 py-1.5 rounded-lg border border-[#BFDBFE] text-mint-blue hover:bg-mint-pale font-semibold transition-colors disabled:opacity-50"
                          >
                            Reset Password
                          </button>
                          <button
                            onClick={() => setDeleteTarget(user)}
                            disabled={actionLoading === user.user_id}
                            className="text-caption px-3 py-1.5 rounded-lg border border-[#FECACA] text-status-rejected-text hover:bg-status-rejected-bg font-semibold transition-colors disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
