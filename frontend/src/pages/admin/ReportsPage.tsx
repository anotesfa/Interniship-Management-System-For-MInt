// Admin - Reports Page (FR-RPT-001 to FR-RPT-004)
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, Button, LoadingSpinner, StatCard } from '../../components/common';
import { applicationService, userService } from '../../services';
import { reportService } from '../../services/report.service';
import { SystemUser } from '../../services/user.service';

export default function AdminReportsPage() {
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, on_hold: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isDownloading, setIsDownloading]   = useState<string | null>(null);
  const [error, setError]                   = useState('');
  const [students, setStudents]             = useState<SystemUser[]>([]);
  const [studentReportId, setStudentReportId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  useEffect(() => {
    loadStats();
    loadStudents();
  }, []);

  const loadStats = async () => {
    setIsLoadingStats(true);
    try { const data = await applicationService.getApplicationStats(); setStats(data); }
    catch (error) { console.error('Failed to load stats:', error); }
    finally { setIsLoadingStats(false); }
  };

  const loadStudents = async () => {
    setIsLoadingStudents(true);
    try {
      const result = await userService.getStudents(200, 0);
      setStudents(result.data);
      if (result.data.length > 0 && !studentReportId) {
        const firstStudentId = result.data[0].student?.student_id;
        if (firstStudentId) {
          setStudentReportId(String(firstStudentId));
        }
      }
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleDownload = async (type: string, downloadFn: () => Promise<void>) => {
    try {
      setIsDownloading(type);
      setError('');
      await downloadFn();
    } catch {
      setError('Failed to download report. Please try again.');
    } finally {
      setIsDownloading(null);
    }
  };

  const statCards = [
    {
      label: 'Total Applications',
      value: stats.total,
      accentColor: 'blue' as const,
      icon: (
        <svg className="w-5 h-5 text-mint-steel" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      label: 'Pending',
      value: stats.pending,
      accentColor: 'amber' as const,
      icon: (
        <svg className="w-5 h-5 text-status-pending-dot" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: 'Approved',
      value: stats.approved,
      accentColor: 'green' as const,
      icon: (
        <svg className="w-5 h-5 text-status-approved-dot" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: 'Rejected',
      value: stats.rejected,
      accentColor: 'red' as const,
      icon: (
        <svg className="w-5 h-5 text-status-rejected-dot" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: 'On Hold',
      value: stats.on_hold,
      accentColor: 'orange' as const,
      icon: (
        <svg className="w-5 h-5 text-status-hold-dot" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      )
    },
  ];

  const reports = [
    {
      id:          'app-status-pdf',
      title:       'Application Status Report',
      description: 'Detailed breakdown of all applications by status and university',
      actions: [
        { label: 'Download PDF', type: 'app-status-pdf', fn: () => reportService.downloadApplicationStatusPDF(), variant: 'primary' as const },
      ],
    },
    {
      id:          'cohort',
      title:       'Cohort Grade Report',
      description: 'Consolidated grades for all students in a cohort',
      actions: [
        { label: 'PDF',  type: 'cohort-pdf', fn: () => reportService.downloadCohortGradePDF(), variant: 'primary' as const },
        { label: 'CSV',  type: 'cohort-csv', fn: () => reportService.downloadCohortGradeCSV(), variant: 'secondary' as const },
      ],
    },
    {
      id:          'supervisor-pdf',
      title:       'Supervisor Assignment Report',
      description: 'Overview of supervisor workload and student assignments',
      actions: [
        { label: 'Download PDF', type: 'supervisor-pdf', fn: () => reportService.downloadSupervisorAssignmentPDF(), variant: 'primary' as const },
      ],
    },
    {
      id:          'activity-pdf',
      title:       'System Activity Report',
      description: 'User activity and system usage statistics (Last 30 days)',
      actions: [
        { label: 'Download PDF', type: 'activity-pdf', fn: () => reportService.downloadSystemActivityPDF(), variant: 'primary' as const },
      ],
    },
  ];

  const selectedStudent = students.find((student) => String(student.student?.student_id ?? '') === studentReportId) || null;
  const normalizedStudentSearch = studentSearch.trim().toLowerCase();
  const searchableStudents = students.filter((student) => !!student.student?.student_id);
  const filteredStudents = normalizedStudentSearch
    ? searchableStudents.filter((student) => {
      const reg = student.student?.registration_number ?? '';
      return (
        student.full_name?.toLowerCase().includes(normalizedStudentSearch) ||
        reg.toLowerCase().includes(normalizedStudentSearch)
      );
    })
    : searchableStudents;

  return (
    <DashboardLayout title="System Reports" breadcrumb={['Admin', 'Reports']}>
      <div className="space-y-6">

        {error && (
          <div className="flex items-center gap-2 bg-status-rejected-bg border border-[#FECACA] text-status-rejected-text px-4 py-3 rounded-lg text-body-sm font-medium">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Application Statistics */}
        <div>
          <h2 className="text-h3 text-text-primary mb-4">Application Statistics</h2>
          {isLoadingStats ? (
            <div className="flex justify-center py-8"><LoadingSpinner size="md" text="Loading stats..." /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {statCards.map((s) => (
                <StatCard
                  key={s.label}
                  label={s.label}
                  value={s.value}
                  accentColor={s.accentColor}
                  icon={s.icon}
                />
              ))}
            </div>
          )}
        </div>

        {/* Report Generation */}
        <div>
          <h2 className="text-h3 text-text-primary mb-4">Generate Reports</h2>
          <div className="grid gap-3">
            <Card>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-body-sm font-semibold text-text-primary">Student Evaluation Report</h3>
                  <p className="text-caption text-text-muted truncate">Download a published evaluation PDF for any student.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full lg:w-auto">
                  <div className="w-full sm:w-[320px] relative">
                    <input
                      type="text"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      disabled={isLoadingStudents || students.length === 0}
                      placeholder={students.length === 0 ? 'No students available' : 'Search student by name...'}
                      className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all disabled:opacity-60"
                    />
                    {!isLoadingStudents && students.length > 0 && normalizedStudentSearch && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-border-default rounded-lg shadow-level-2 max-h-64 overflow-auto">
                        {filteredStudents.slice(0, 12).map((student) => (
                          <button
                            key={student.student!.student_id}
                            type="button"
                            onClick={() => {
                              setStudentReportId(String(student.student!.student_id));
                              setStudentSearch(student.full_name);
                            }}
                            className={`w-full text-left px-3.5 py-2 text-body-sm hover:bg-mint-pale transition-colors ${
                              String(student.student!.student_id) === String(studentReportId) ? 'bg-mint-pale' : ''
                            }`}
                          >
                            <span className="font-semibold text-text-primary">{student.full_name}</span>
                            {student.student?.registration_number ? (
                              <span className="text-text-muted"> ({student.student.registration_number})</span>
                            ) : null}
                          </button>
                        ))}
                        {filteredStudents.length === 0 && (
                          <div className="px-3.5 py-2 text-body-sm text-text-muted">No matches</div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!studentReportId || isLoadingStudents}
                    isLoading={isDownloading === 'student-report'}
                    onClick={() => {
                      const selected = students.find((student) => String(student.student?.student_id ?? '') === studentReportId);
                      return handleDownload(
                        'student-report',
                        () => reportService.downloadStudentEvaluationPDF(studentReportId, selected?.full_name),
                      );
                    }}
                  >
                    Download PDF
                  </Button>
                </div>
              </div>
              {selectedStudent && (
                <p className="text-caption text-text-muted mt-3">
                  Selected: <span className="font-semibold text-text-primary">{selectedStudent.full_name}</span>
                  {selectedStudent.student?.department ? ` · ${selectedStudent.student.department}` : ''}
                </p>
              )}
            </Card>

            {reports.map((report) => (
              <Card key={report.id}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-mint-pale flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-mint-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-body-sm font-semibold text-text-primary">{report.title}</h3>
                      <p className="text-caption text-text-muted truncate">{report.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {report.actions.map((action) => (
                      <Button
                        key={action.type}
                        variant={action.variant}
                        size="sm"
                        isLoading={isDownloading === action.type}
                        disabled={!!isDownloading}
                        onClick={() => handleDownload(action.type, action.fn)}
                        icon={
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        }
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
