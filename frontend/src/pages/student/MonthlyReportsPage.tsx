// Student - Monthly Reports Page (SDD §5.3.5)
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner, Card, Button, Textarea, EmptyState, StatusBadge, Modal } from '../../components/common';
import { MonthlyReport } from '../../types/monthly-report.types';
import { monthlyReportService } from '../../services/monthly-report.service';
import { evaluationService } from '../../services/evaluation.service';
import { useAuthStore } from '../../store/auth.store';
import { extractErrorMessage } from '../../utils/error-handler';

export default function StudentMonthlyReportsPage() {
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluationPublished, setIsEvaluationPublished] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState('');
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
      const [data, isPublished] = await Promise.all([
        monthlyReportService.getMyReports(),
        evaluationService.checkPublishedStatus(),
      ]);
      setReports(data.sort((a: MonthlyReport, b: MonthlyReport) => b.year - a.year || b.month - a.month));
      setIsEvaluationPublished(isPublished);
    } catch (error) {
      setError('Failed to load monthly reports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    
    if (!summary.trim() || summary.length < 100) {
      setError('Summary must be at least 100 characters');
      return;
    }

    // Check if report already exists for this month/year
    const exists = reports.some(r => r.month === selectedMonth && r.year === selectedYear);
    if (exists) {
      setError('Report already submitted for this period');
      return;
    }

    try {
      setIsSubmitting(true);
      await monthlyReportService.submitReport({
        month: selectedMonth,
        year: selectedYear,
        summary,
      });
      setSuccess('Monthly report submitted successfully');
      setShowSubmitModal(false);
      setSummary('');
      loadReports();
    } catch (error: any) {
      setError(extractErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMonthName = (month: number): string => {
    return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Monthly Progress Reports" breadcrumb={['Student', 'Monthly Reports']}>
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" text="Loading reports..." />
        </div>
      </DashboardLayout>
    );
  }

  // Show locked message if evaluation is published
  if (isEvaluationPublished) {
    return (
      <DashboardLayout title="Monthly Progress Reports" breadcrumb={['Student', 'Monthly Reports']}>
        <Card>
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-status-rejected-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-status-rejected-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-h2 text-text-primary mb-2">Submissions Locked</h2>
            <p className="text-body-sm text-text-muted">Your evaluation has been published. You can no longer submit monthly reports. If you have questions, please contact your supervisor.</p>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Monthly Progress Reports" breadcrumb={['Student', 'Monthly Reports']}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-body-sm text-text-muted">
            {reports.length} report{reports.length !== 1 ? 's' : ''} submitted
          </p>
          <Button variant="primary" onClick={() => setShowSubmitModal(true)}>
            Submit New Report
          </Button>
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
            title="No Reports Submitted"
            description="You haven't submitted any monthly reports yet. Click 'Submit New Report' to get started."
            action={<Button variant="primary" onClick={() => setShowSubmitModal(true)}>Submit First Report</Button>}
          />
        ) : (
          <div className="grid gap-4">
            {reports.map((report) => (
              <Card key={report.report_id}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-body font-semibold text-text-primary">
                      {getMonthName(report.month)} {report.year}
                    </h3>
                    <p className="text-caption text-text-muted mt-0.5">
                      Submitted: {new Date(report.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={report.status} />
                </div>

                <p className="text-body-sm text-text-muted whitespace-pre-wrap leading-relaxed">{report.summary}</p>

                {report.feedback && (
                  <div className="mt-4 bg-mint-pale border-l-4 border-mint-blue rounded-lg p-4">
                    <p className="text-body-sm font-semibold text-mint-navy mb-1">Supervisor Feedback</p>
                    <p className="text-body-sm text-text-muted">{report.feedback}</p>
                    {report.reviewer_name && (
                      <p className="text-caption text-text-hint mt-2">— {report.reviewer_name}</p>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Submit Report Modal */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => { setShowSubmitModal(false); setError(''); }}
        title="Submit Monthly Report"
        subtitle="Summarise your internship progress for the selected period."
        size="lg"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
                Month <span className="text-eth-red">*</span>
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {getMonthName(month)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
                Year <span className="text-eth-red">*</span>
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
              >
                {[2025, 2026, 2027].map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
              Progress Summary <span className="text-eth-red">*</span>
            </label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe your progress, completed tasks, challenges faced, and learnings from this month... (minimum 100 characters)"
              rows={8}
              showCharCount
              maxLength={2000}
            />
            <p className={`text-caption mt-1 ${summary.length < 100 ? 'text-status-pending-text' : 'text-status-approved-text'}`}>
              {summary.length} / 100 characters minimum
            </p>
          </div>

          <div className="flex items-start gap-3 bg-status-pending-bg border border-[#FDE68A] rounded-lg px-4 py-3">
            <svg className="w-4 h-4 text-status-pending-text flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-body-sm text-status-pending-text">
              Once submitted, you cannot edit this report. Make sure all information is accurate.
            </p>
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
            <Button
              variant="secondary"
              onClick={() => { setShowSubmitModal(false); setError(''); }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={summary.length < 100}
            >
              Submit Report
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
