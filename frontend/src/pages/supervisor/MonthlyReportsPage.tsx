// Supervisor - Monthly Reports Review Page (SDD §5.3.5)
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner, Card, Button, Textarea, EmptyState, StatusBadge, Modal } from '../../components/common';
import { MonthlyReport, MonthlyReportStatus } from '../../types/monthly-report.types';
import { monthlyReportService } from '../../services/monthly-report.service';
import { useAuthStore } from '../../store/auth.store';
import { extractErrorMessage } from '../../utils/error-handler';

export default function SupervisorMonthlyReportsPage() {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MonthlyReport | null>(null);
  const [feedback, setFeedback] = useState('');
  const [reviewStatus, setReviewStatus] = useState<MonthlyReportStatus>(MonthlyReportStatus.REVIEWED);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    loadReports();
  }, [user]);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      if (user?.user_id) {
        const data = await monthlyReportService.getMySupervisorReports();
        setReports(data.sort((a, b) => {
          // Sort by status (submitted first), then by date
          const statusOrder = { submitted: 0, reviewed: 1, approved: 2, returned: 3 };
          const statusDiff = statusOrder[a.status] - statusOrder[b.status];
          if (statusDiff !== 0) return statusDiff;
          return b.year - a.year || b.month - a.month;
        }));
      }
    } catch (error) {
      setError(extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = (report: MonthlyReport) => {
    setSelectedReport(report);
    setFeedback(report.feedback || '');
    setReviewStatus(MonthlyReportStatus.REVIEWED);
    setShowReviewModal(true);
    setError('');
    setSuccess('');
  };

  const handleSubmitReview = async () => {
    if (!selectedReport) return;

    if (reviewStatus === MonthlyReportStatus.RETURNED && !feedback.trim()) {
      setError('Feedback is required when returning a report');
      return;
    }

    try {
      setIsSubmitting(true);
      await monthlyReportService.reviewReport({
        report_id: selectedReport.report_id,
        status: reviewStatus,
        feedback: feedback.trim() || undefined,
      });
      setSuccess('Report reviewed successfully');
      setShowReviewModal(false);
      setSelectedReport(null);
      setFeedback('');
      loadReports();
    } catch (error) {
      setError(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMonthName = (month: number): string => {
    return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
  };

  const pendingCount = reports.filter(r => r.status === MonthlyReportStatus.SUBMITTED).length;

  if (isLoading) {
    return (
      <DashboardLayout title="Monthly Reports Review" breadcrumb={['Supervisor', 'Monthly Reports']}>
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" text="Loading reports..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Monthly Reports Review" breadcrumb={['Supervisor', 'Monthly Reports']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-body-sm text-text-muted">
            Review and provide feedback on student monthly reports
          </p>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 bg-status-pending-bg border border-[#FDE68A] text-status-pending-text px-4 py-2 rounded-lg text-body-sm font-semibold">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {pendingCount} Pending Review
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-status-rejected-bg border border-[#FECACA] text-status-rejected-text px-4 py-3 rounded-lg text-body-sm font-medium">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 bg-status-approved-bg border border-[#A7F3D0] text-status-approved-text px-4 py-3 rounded-lg text-body-sm font-medium">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </div>
        )}

        {reports.length === 0 ? (
          <EmptyState
            title="No Reports to Review"
            description="No monthly reports have been submitted by your students yet."
          />
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.report_id}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-body font-semibold text-text-primary">{report.group_name || report.student_name}</h3>
                    <p className="text-body-sm text-text-muted">
                      {getMonthName(report.month)} {report.year}
                    </p>
                    <p className="text-caption text-text-hint mt-0.5">
                      Submitted: {new Date(report.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={report.status} />
                    {report.status === MonthlyReportStatus.SUBMITTED ? (
                      <Button variant="primary" size="sm" onClick={() => handleReview(report)}>
                        Review
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => handleReview(report)}>
                        View
                      </Button>
                    )}
                  </div>
                </div>

                <p className="text-body-sm text-text-muted whitespace-pre-wrap line-clamp-3 leading-relaxed">
                  {report.summary}
                </p>

                {report.feedback && (
                  <div className="mt-4 bg-status-approved-bg border-l-4 border-eth-green rounded-lg p-4">
                    <p className="text-body-sm font-semibold text-status-approved-text mb-1">Your Feedback</p>
                    <p className="text-body-sm text-status-approved-text">{report.feedback}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Summary Statistics */}
        {reports.length > 0 && (
          <Card>
            <h3 className="text-h3 text-text-primary mb-4">Review Summary</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Total Reports', value: reports.length, color: 'text-text-primary' },
                { label: 'Pending', value: reports.filter(r => r.status === MonthlyReportStatus.SUBMITTED).length, color: 'text-status-pending-text' },
                { label: 'Approved', value: reports.filter(r => r.status === MonthlyReportStatus.APPROVED).length, color: 'text-status-approved-text' },
                { label: 'Returned', value: reports.filter(r => r.status === MonthlyReportStatus.RETURNED).length, color: 'text-status-rejected-text' },
              ].map(stat => (
                <div key={stat.label} className="text-center bg-surface-page rounded-lg p-4">
                  <div className={`text-h2 font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-caption text-text-muted mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => { setShowReviewModal(false); setError(''); }}
        title="Review Monthly Report"
        subtitle={selectedReport ? `${selectedReport.group_name || selectedReport.student_name} · ${getMonthName(selectedReport.month)} ${selectedReport.year}` : ''}
        size="lg"
      >
        {selectedReport && (
          <div className="space-y-5">
            <div className="bg-surface-page rounded-lg p-4 border border-border-subtle">
              <p className="text-body-sm font-semibold text-text-primary mb-2">Progress Summary</p>
              <p className="text-body-sm text-text-muted whitespace-pre-wrap leading-relaxed">
                {selectedReport.summary}
              </p>
            </div>

            <div>
              <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
                Review Status <span className="text-eth-red">*</span>
              </label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value as MonthlyReportStatus)}
                className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selectedReport.status !== MonthlyReportStatus.SUBMITTED}
              >
                <option value={MonthlyReportStatus.REVIEWED}>Reviewed</option>
                <option value={MonthlyReportStatus.APPROVED}>Approved</option>
                <option value={MonthlyReportStatus.RETURNED}>Return for Revision</option>
              </select>
            </div>

            <div>
              <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
                Feedback {reviewStatus === MonthlyReportStatus.RETURNED && <span className="text-eth-red">*</span>}
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide constructive feedback on the student's progress..."
                rows={6}
                disabled={selectedReport.status !== MonthlyReportStatus.SUBMITTED}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-status-rejected-bg border border-[#FECACA] text-status-rejected-text px-4 py-3 rounded-lg text-body-sm">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {selectedReport.status === MonthlyReportStatus.SUBMITTED && (
              <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
                <Button
                  variant="secondary"
                  onClick={() => { setShowReviewModal(false); setError(''); }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmitReview}
                  isLoading={isSubmitting}
                  disabled={reviewStatus === MonthlyReportStatus.RETURNED && !feedback.trim()}
                >
                  Submit Review
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
