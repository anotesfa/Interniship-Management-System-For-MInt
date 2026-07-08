// Admin - Applications Page
// Tab 1: Student Applications (bulk applications from universities)
// Tab 2: University Requests (approve / reject university registrations)
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
  LoadingSpinner,
  Card,
  Button,
  StatusBadge,
  Modal,
  Textarea,
  EmptyState,
} from '../../components/common';
import { ApplicationReviewCard } from '../../components/admin';
import { InternshipApplication } from '../../types';
import { applicationService } from '../../services';
import { universityService, University } from '../../services/university.service';
import { formatDate } from '../../utils/format';

type AppFilter = 'all' | 'pending' | 'approved' | 'rejected';
type MainTab = 'applications' | 'universities';

// ─── University Detail Modal ──────────────────────────────────────────────────
function UniversityDetailModal({
  university,
  onClose,
  onApprove,
  onReject,
  isProcessing,
}: {
  university: University;
  onClose: () => void;
  onApprove: (uni: University) => void;
  onReject: (uni: University) => void;
  isProcessing: boolean;
}) {
  return (
    <Modal isOpen onClose={onClose} title="University Details" size="lg">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-border-subtle">
          <div className="w-14 h-14 rounded-xl bg-mint-pale flex items-center justify-center text-mint-navy font-bold text-xl flex-shrink-0">
            {university.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-h3 font-bold text-text-primary truncate">{university.name}</h3>
            <p className="text-body-sm text-text-muted">{university.contact_email}</p>
          </div>
          <StatusBadge status={university.approval_status} />
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-surface-page rounded-lg p-4 space-y-3">
            <p className="text-caption font-semibold text-text-muted uppercase tracking-wider">University Info</p>
            <div className="space-y-2">
              <div>
                <p className="text-caption text-text-muted">Name</p>
                <p className="text-body-sm font-medium text-text-primary">{university.name}</p>
              </div>
              <div>
                <p className="text-caption text-text-muted">Contact Email</p>
                <p className="text-body-sm font-medium text-text-primary">{university.contact_email}</p>
              </div>
              <div>
                <p className="text-caption text-text-muted">Address</p>
                <p className="text-body-sm font-medium text-text-primary">{university.address}</p>
              </div>
              <div>
                <p className="text-caption text-text-muted">Registered</p>
                <p className="text-body-sm font-medium text-text-primary">{formatDate(university.created_at)}</p>
              </div>
            </div>
          </div>

          {university.contact_person && (
            <div className="bg-surface-page rounded-lg p-4 space-y-3">
              <p className="text-caption font-semibold text-text-muted uppercase tracking-wider">Contact Person</p>
              <div className="space-y-2">
                <div>
                  <p className="text-caption text-text-muted">Name</p>
                  <p className="text-body-sm font-medium text-text-primary">{university.contact_person.full_name}</p>
                </div>
                <div>
                  <p className="text-caption text-text-muted">Email</p>
                  <p className="text-body-sm font-medium text-text-primary">{university.contact_person.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rejection reason if any */}
        {university.rejected_reason && (
          <div className="bg-status-rejected-bg border border-[#FECACA] rounded-lg p-4">
            <p className="text-body-sm font-semibold text-status-rejected-text mb-1">Rejection Reason</p>
            <p className="text-body-sm text-status-rejected-text/80">{university.rejected_reason}</p>
          </div>
        )}

        {/* Actions */}
        {university.approval_status === 'pending' && (
          <div className="flex gap-3 pt-2 border-t border-border-subtle">
            <Button
              variant="success"
              onClick={() => onApprove(university)}
              disabled={isProcessing}
              className="flex-1"
            >
              Approve University
            </Button>
            <Button
              variant="danger"
              onClick={() => onReject(university)}
              disabled={isProcessing}
              className="flex-1"
            >
              Reject University
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── University Card ──────────────────────────────────────────────────────────
function UniversityCard({
  university,
  onClick,
}: {
  university: University;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left group"
    >
      <Card className="hover:shadow-md hover:border-mint-blue/40 transition-all cursor-pointer group-hover:bg-mint-pale/20">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-xl bg-mint-pale flex items-center justify-center text-mint-navy font-bold text-lg flex-shrink-0">
            {university.name.charAt(0)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-body font-semibold text-text-primary truncate">{university.name}</h3>
              <StatusBadge status={university.approval_status} />
            </div>
            <p className="text-caption text-text-muted truncate mt-0.5">{university.contact_email}</p>
            {university.contact_person && (
              <p className="text-caption text-text-muted mt-0.5">
                Contact: {university.contact_person.full_name}
              </p>
            )}
          </div>

          {/* Meta + chevron */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="hidden sm:block text-right">
              <p className="text-caption text-text-muted">Registered</p>
              <p className="text-caption font-medium text-text-primary">{formatDate(university.created_at)}</p>
            </div>
            <svg className="w-5 h-5 text-text-muted group-hover:text-mint-navy transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Card>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminApplicationsPage() {
  const [mainTab, setMainTab] = useState<MainTab>('applications');

  // Applications tab state
  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [appFilter, setAppFilter] = useState<AppFilter>('pending');

  // Universities tab state
  const [universities, setUniversities] = useState<University[]>([]);
  const [uniLoading, setUniLoading] = useState(true);
  const [uniFilter, setUniFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedUni, setSelectedUni] = useState<University | null>(null);
  const [showUniDetail, setShowUniDetail] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<University | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uniError, setUniError] = useState('');
  const [uniSuccess, setUniSuccess] = useState('');

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    loadUniversities();
  }, [uniFilter]);

  const loadApplications = async () => {
    setAppsLoading(true);
    try {
      const data = await applicationService.getAllApplications();
      setApplications(data);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setAppsLoading(false);
    }
  };

  const loadUniversities = async () => {
    setUniLoading(true);
    setUniError('');
    try {
      const data = await universityService.getAllUniversities(uniFilter);
      setUniversities(data);
    } catch (err) {
      setUniError(err instanceof Error ? err.message : 'Failed to load universities');
    } finally {
      setUniLoading(false);
    }
  };

  // ── Application helpers ──
  const filteredApps = applications.filter(
    (a) => appFilter === 'all' || a.status === appFilter,
  );
  const appCount = (f: AppFilter) =>
    f === 'all' ? applications.length : applications.filter((a) => a.status === f).length;

  // ── University helpers ──
  const pendingCount = universities.filter((u) => u.approval_status === 'pending').length;

  const handleUniClick = (uni: University) => {
    setSelectedUni(uni);
    setShowUniDetail(true);
  };

  const handleApprove = async (uni: University) => {
    setIsProcessing(true);
    setUniError('');
    try {
      await universityService.approveUniversity(uni.university_id);
      setUniSuccess(`${uni.name} approved successfully`);
      setShowUniDetail(false);
      loadUniversities();
    } catch (err) {
      setUniError(err instanceof Error ? err.message : 'Failed to approve university');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectClick = (uni: University) => {
    setRejectTarget(uni);
    setRejectReason('');
    setShowUniDetail(false);
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setIsProcessing(true);
    setUniError('');
    try {
      await universityService.rejectUniversity(rejectTarget.university_id, rejectReason);
      setUniSuccess(`${rejectTarget.name} rejected`);
      setShowRejectModal(false);
      setRejectTarget(null);
      loadUniversities();
    } catch (err) {
      setUniError(err instanceof Error ? err.message : 'Failed to reject university');
    } finally {
      setIsProcessing(false);
    }
  };

  const APP_FILTER_TABS: { value: AppFilter; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'all', label: 'All' },
  ];

  const UNI_FILTER_TABS: { value: typeof uniFilter; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'all', label: 'All' },
  ];

  return (
    <DashboardLayout title="Applications" breadcrumb={['Admin', 'Applications']}>
      <div className="space-y-6">

        {/* ── Main Tabs ── */}
        <div className="flex gap-1 p-1 bg-surface-page rounded-xl w-fit">
          <button
            onClick={() => setMainTab('applications')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-body-sm font-semibold transition-all ${
              mainTab === 'applications'
                ? 'bg-white text-mint-navy shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Student Applications
            {appCount('pending') > 0 && (
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${mainTab === 'applications' ? 'bg-mint-navy text-white' : 'bg-border-subtle text-text-muted'}`}>
                {appCount('pending')}
              </span>
            )}
          </button>
          <button
            onClick={() => setMainTab('universities')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-body-sm font-semibold transition-all ${
              mainTab === 'universities'
                ? 'bg-white text-mint-navy shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            University Requests
            {pendingCount > 0 && (
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${mainTab === 'universities' ? 'bg-mint-navy text-white' : 'bg-border-subtle text-text-muted'}`}>
                {pendingCount}
              </span>
            )}
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1 — STUDENT APPLICATIONS
        ══════════════════════════════════════════════════════════════════ */}
        {mainTab === 'applications' && (
          <div className="space-y-5">
            {/* Filter sub-tabs */}
            <div className="flex items-center gap-1 border-b border-border-default overflow-x-auto">
              {APP_FILTER_TABS.map((tab) => {
                const count = appCount(tab.value);
                const isActive = appFilter === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setAppFilter(tab.value)}
                    className={`flex items-center gap-2 px-4 py-3 text-body-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                      isActive
                        ? 'border-mint-navy text-mint-navy'
                        : 'border-transparent text-text-muted hover:text-text-primary hover:border-border-default'
                    }`}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-mint-navy text-white' : 'bg-surface-page text-text-muted'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {appsLoading ? (
              <div className="flex justify-center py-16">
                <LoadingSpinner size="lg" text="Loading applications..." />
              </div>
            ) : filteredApps.length === 0 ? (
              <EmptyState
                title="No applications found"
                description={`There are no ${appFilter === 'all' ? '' : appFilter} applications at this time.`}
              />
            ) : (
              <div className="grid gap-4">
                {filteredApps.map((application) => (
                  <ApplicationReviewCard
                    key={application.application_id}
                    application={application}
                    onUpdate={loadApplications}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2 — UNIVERSITY REQUESTS
        ══════════════════════════════════════════════════════════════════ */}
        {mainTab === 'universities' && (
          <div className="space-y-5">
            {/* Success / Error banners */}
            {uniSuccess && (
              <div className="flex items-center gap-3 bg-status-approved-bg border border-[#A7F3D0] text-status-approved-text px-4 py-3 rounded-lg">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-body-sm font-medium flex-1">{uniSuccess}</p>
                <button onClick={() => setUniSuccess('')}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            {uniError && (
              <div className="flex items-center gap-3 bg-status-rejected-bg border border-[#FECACA] text-status-rejected-text px-4 py-3 rounded-lg">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-body-sm font-medium flex-1">{uniError}</p>
                <button onClick={() => setUniError('')}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Filter sub-tabs */}
            <div className="flex items-center gap-1 border-b border-border-default overflow-x-auto">
              {UNI_FILTER_TABS.map((tab) => {
                const count = tab.value === 'all'
                  ? universities.length
                  : universities.filter((u) => u.approval_status === tab.value).length;
                const isActive = uniFilter === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setUniFilter(tab.value)}
                    className={`flex items-center gap-2 px-4 py-3 text-body-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
                      isActive
                        ? 'border-mint-navy text-mint-navy'
                        : 'border-transparent text-text-muted hover:text-text-primary hover:border-border-default'
                    }`}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-mint-navy text-white' : 'bg-surface-page text-text-muted'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {uniLoading ? (
              <div className="flex justify-center py-16">
                <LoadingSpinner size="lg" text="Loading universities..." />
              </div>
            ) : universities.length === 0 ? (
              <EmptyState
                title="No universities found"
                description={`No ${uniFilter === 'all' ? '' : uniFilter} university requests at this time.`}
              />
            ) : (
              <div className="grid gap-3">
                {universities.map((uni) => (
                  <UniversityCard
                    key={uni.university_id}
                    university={uni}
                    onClick={() => handleUniClick(uni)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── University Detail Modal ── */}
      {showUniDetail && selectedUni && (
        <UniversityDetailModal
          university={selectedUni}
          onClose={() => setShowUniDetail(false)}
          onApprove={handleApprove}
          onReject={handleRejectClick}
          isProcessing={isProcessing}
        />
      )}

      {/* ── Reject Reason Modal ── */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject University"
        subtitle={`Provide a reason for rejecting ${rejectTarget?.name}`}
        size="md"
      >
        <div className="space-y-4">
          <Textarea
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explain why this university is being rejected..."
            rows={4}
          />
          <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
            <Button variant="secondary" onClick={() => setShowRejectModal(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || isProcessing}
              isLoading={isProcessing}
            >
              Reject University
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
