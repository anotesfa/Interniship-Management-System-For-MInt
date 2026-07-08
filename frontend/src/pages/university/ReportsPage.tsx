// University User - Reports Page (FR-EVAL-006)
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner, Button, EmptyState, StatusBadge } from '../../components/common';
import { InternshipApplication } from '../../types';
import { applicationService, reportService } from '../../services';
import {
  StudentRosterTab, StudentRosterFilters,
  filterStudentRoster, getAvailableYears,
} from '../../utils/student-roster';

export default function UniversityReportsPage() {
  const [allStudents, setAllStudents]   = useState<InternshipApplication[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [tab, setTab]                   = useState<StudentRosterTab>('enrolled');
  const [filters, setFilters]           = useState<StudentRosterFilters>({ name: '', year: 'all' });
  const [downloading, setDownloading]   = useState<string | null>(null);
  const [error, setError]               = useState('');
  const [evaluationSubmissionByStudent, setEvaluationSubmissionByStudent] = useState<Record<string, {
    submitted_by_admin: boolean;
    submitted_at: string | null;
  }>>({});

  useEffect(() => { loadStudents(); }, []);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const data = await applicationService.getMyApplications();
      setAllStudents(data);

      const ids = data
        .map((student) => Number(student.student_id))
        .filter((id) => Number.isInteger(id) && id > 0);

      if (ids.length > 0) {
        const submissionStatus = await reportService.getStudentEvaluationSubmissionStatus(ids);
        const statusMap = submissionStatus.reduce((acc, row) => {
          acc[String(row.student_id)] = {
            submitted_by_admin: row.submitted_by_admin,
            submitted_at: row.submitted_at,
          };
          return acc;
        }, {} as Record<string, { submitted_by_admin: boolean; submitted_at: string | null }>);
        setEvaluationSubmissionByStudent(statusMap);
      } else {
        setEvaluationSubmissionByStudent({});
      }
    }
    catch (error) { console.error('Failed to load students:', error); }
    finally { setIsLoading(false); }
  };

  const handleDownload = async (studentId: string, name: string) => {
    setDownloading(studentId);
    setError('');
    try {
      await reportService.downloadStudentEvaluationPDF(studentId, name);
      console.log(`Downloaded evaluation report for ${name}`);
    } catch (downloadError: any) {
      setError(downloadError?.message || 'Report not submitted by evaluator yet.');
    } finally {
      setDownloading(null);
    }
  };

  const filtered = filterStudentRoster(allStudents, tab, filters);
  const years    = getAvailableYears(allStudents);

  const TABS: { value: StudentRosterTab; label: string }[] = [
    { value: 'enrolled', label: 'Current Students' },
    { value: 'past',     label: 'Past Students'    },
  ];

  return (
    <DashboardLayout title="Grade Reports" breadcrumb={['University', 'Reports']}>
      <div className="space-y-6">

        {error && (
          <div className="flex items-center gap-2 bg-status-pending-bg border border-[#FDE68A] text-status-pending-text px-4 py-3 rounded-lg text-body-sm font-medium">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border-default overflow-x-auto">
          {TABS.map((t) => {
            const count    = filterStudentRoster(allStudents, t.value, { name: '', year: 'all' }).length;
            const isActive = tab === t.value;
            return (
              <button key={t.value} onClick={() => setTab(t.value)}
                className={`flex items-center gap-2 px-4 py-3 text-body-sm font-semibold border-b-2 whitespace-nowrap transition-all ${isActive ? 'border-mint-navy text-mint-navy' : 'border-transparent text-text-muted hover:text-text-primary'}`}
              >
                {t.label}
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-mint-navy text-white' : 'bg-surface-page text-text-muted'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <input
            type="text"
            placeholder="Search by name..."
            value={filters.name}
            onChange={(e) => setFilters(f => ({ ...f, name: e.target.value }))}
            className="w-full sm:flex-1 min-w-0 bg-surface-input border border-border-default rounded-lg px-4 py-2.5 text-body focus:outline-none focus:ring-2 focus:ring-mint-blue"
          />
          <select
            value={filters.year}
            onChange={(e) => setFilters(f => ({ ...f, year: e.target.value }))}
            className="w-full sm:w-auto bg-surface-input border border-border-default rounded-lg px-4 py-2.5 text-body focus:outline-none focus:ring-2 focus:ring-mint-blue"
          >
            <option value="all">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" text="Loading reports..." /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={tab === 'enrolled' ? 'No reports for enrolled students' : 'No reports for past students'}
            description="Grade reports will appear here once evaluations are published."
          />
        ) : (
          <div className="bg-white rounded-xl border border-border-default shadow-level-1 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-surface-page">
                    {['Student', 'Department', 'Year', 'Status', 'Evaluation', 'Report'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-label uppercase tracking-wider text-text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => {
                    const id = s.student_id || s.application_id || String(i);
                    const evalStatus = s.student_id
                      ? evaluationSubmissionByStudent[String(s.student_id)]
                      : undefined;
                    const isSubmittedByAdmin = Boolean(evalStatus?.submitted_by_admin);
                    return (
                      <tr key={id} className="border-b border-border-subtle hover:bg-mint-pale transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-mint-pale text-mint-navy flex items-center justify-center font-bold text-body-sm flex-shrink-0">
                              {(s.student_name || 'S').charAt(0)}
                            </div>
                            <div>
                              <p className="text-body-sm font-semibold text-text-primary">{s.student_name}</p>
                              <p className="text-caption text-text-muted">{s.student_email || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-body-sm text-text-muted">{s.department || '—'}</td>
                        <td className="px-5 py-4 text-body-sm text-text-muted">{s.academic_year || '—'}</td>
                        <td className="px-5 py-4"><StatusBadge status={s.status} /></td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-caption font-semibold ${isSubmittedByAdmin ? 'bg-status-approved-bg text-status-approved-text' : 'bg-status-pending-bg text-status-pending-text'}`}>
                            {isSubmittedByAdmin ? 'Submitted by Admin' : 'Not Submitted by Admin'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <Button
                            size="sm"
                            variant="primary"
                            isLoading={downloading === id}
                            disabled={!!downloading || !s.student_id || !isSubmittedByAdmin}
                            onClick={() => s.student_id && handleDownload(String(s.student_id), s.student_name || '')}
                            icon={
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            }
                          >
                            {isSubmittedByAdmin ? 'Download' : 'Awaiting Submission'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}