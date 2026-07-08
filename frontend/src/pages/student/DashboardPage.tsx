// Student - Dashboard Page (FR-STU-001 to FR-STU-004)
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { ROUTES } from '../../constants';
import { LoadingSpinner, Card, Button, StatusBadge, EmptyState } from '../../components/common';
import { InternshipAssignment, Evaluation } from '../../types';
import { StudentGroupStatus } from '../../types/student-group.types';
import { assignmentService, evaluationService, milestoneService, studentGroupService } from '../../services';
import { formatDate } from '../../utils/format';
import { EvaluationDisplay } from '../../components/supervisor';

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const [assignment, setAssignment]       = useState<InternshipAssignment | null>(null);
  const [evaluation, setEvaluation]       = useState<Evaluation | null>(null);
  const [group, setGroup]                 = useState<StudentGroupStatus | null>(null);
  const [isEvaluationPublished, setIsEvaluationPublished] = useState(false);
  const [progressSummary, setProgressSummary] = useState({
    total: 0, accepted: 0, pending_review: 0, pending_revision: 0, rejected: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const groupData = await studentGroupService.getMyGroup();
      setGroup(groupData);
      if (groupData.has_group && !groupData.is_team_leader) {
        navigate(ROUTES.STUDENT_MEMBER_DASHBOARD, { replace: true });
        return;
      }

      const assignmentData = await assignmentService.getMyAssignment();
      setAssignment(assignmentData);
      if (assignmentData) {
        const [evalData, progressData, isPublished] = await Promise.all([
          evaluationService.getEvaluationByStudent(String(assignmentData.student_id)),
          milestoneService.getMyMilestones(),
          evaluationService.checkPublishedStatus(),
        ]);
        setEvaluation(evalData);
        setIsEvaluationPublished(isPublished);
        setProgressSummary({
          total:            progressData.length,
          accepted:         progressData.filter(m => m.status === 'accepted').length,
          pending_review:   progressData.filter(m => m.status === 'pending_review').length,
          pending_revision: progressData.filter(m => m.status === 'pending_revision').length,
          rejected:         progressData.filter(m => m.status === 'rejected').length,
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" text="Loading dashboard..." /></div>
      </DashboardLayout>
    );
  }

  if (!assignment) {
    return (
      <DashboardLayout title="Dashboard">
        <Card>
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-mint-pale rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-mint-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-h2 text-text-primary mb-2">Welcome to MInT Internship System</h2>
            <p className="text-body-sm text-text-muted">Your internship assignment will appear here once it has been set up by the administrator.</p>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  const acceptedPct = progressSummary.total > 0
    ? Math.round((progressSummary.accepted / progressSummary.total) * 100)
    : 0;

  const milestoneStats = [
    { label: 'Total',         value: progressSummary.total,            color: 'text-mint-navy',              bg: 'bg-mint-pale'              },
    { label: 'Accepted',      value: progressSummary.accepted,         color: 'text-status-approved-text',   bg: 'bg-status-approved-bg'     },
    { label: 'Pending Review',value: progressSummary.pending_review,   color: 'text-status-pending-text',    bg: 'bg-status-pending-bg'      },
    { label: 'Needs Revision',value: progressSummary.pending_revision, color: 'text-status-hold-text',       bg: 'bg-status-hold-bg'         },
    { label: 'Rejected',      value: progressSummary.rejected,         color: 'text-status-rejected-text',   bg: 'bg-status-rejected-bg'     },
  ];

  return (
    <DashboardLayout title="My Dashboard" breadcrumb={['Student', 'Dashboard']}>
      <div className="space-y-6">

        {/* Internship Details */}
        <Card>
          <div className="flex flex-col sm:flex-row justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-mint-navy flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-caption text-text-muted uppercase tracking-wider">Supervisor</p>
                  <p className="text-body font-semibold text-text-primary">{assignment.supervisor_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-page rounded-lg p-3">
                  <p className="text-caption text-text-muted uppercase tracking-wider mb-0.5">Start Date</p>
                  <p className="text-body-sm font-semibold text-text-primary">{formatDate(assignment.start_date)}</p>
                </div>
                <div className="bg-surface-page rounded-lg p-3">
                  <p className="text-caption text-text-muted uppercase tracking-wider mb-0.5">End Date</p>
                  <p className="text-body-sm font-semibold text-text-primary">{formatDate(assignment.end_date)}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 sm:border-l sm:pl-6 border-border-subtle">
              <div className="text-center">
                <p className="text-caption text-text-muted uppercase tracking-wider">Supervisor Status</p>
                <StatusBadge status={isEvaluationPublished ? 'complete' : assignment.status} />
              </div>
              {!isEvaluationPublished && (
                <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.STUDENT_MESSAGES)}>
                  Message Supervisor
                </Button>
              )}
            </div>
          </div>
        </Card>

        {group?.has_group && group.group && (
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <p className="text-caption uppercase tracking-wider text-text-muted">Your Group</p>
                <h3 className="text-h3 text-text-primary mt-1">{group.group.team_name || 'Student Group'}</h3>
                <p className="text-body-sm text-text-muted mt-1">Leader: {group.group.leader_student_name || 'Not assigned'}</p>
                
                {group.group.start_date && group.group.end_date && (
                  <div className="mt-3 bg-surface-page rounded-lg p-3 border border-border-subtle">
                    <div className="grid grid-cols-2 gap-3 text-body-sm">
                      <div>
                        <p className="text-caption text-text-muted uppercase tracking-wider mb-0.5">Period</p>
                        <p className="text-text-primary font-medium">
                          {formatDate(group.group.start_date)} – {formatDate(group.group.end_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-caption text-text-muted uppercase tracking-wider mb-0.5">Schedule</p>
                        <p className="text-text-primary font-medium capitalize">
                          {group.group.attendance_days ? group.group.attendance_days.split(',').join(', ') : 'Not set'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-start sm:items-end gap-3">
                <div className="flex items-center gap-2">
                  <p className="text-caption text-text-muted uppercase tracking-wider">Status</p>
                  <StatusBadge status={isEvaluationPublished ? 'complete' : (group.group.status || 'active')} />
                </div>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => navigate(ROUTES.STUDENT_MESSAGES)}
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Message Group
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Milestone Progress */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-h3 text-text-primary">Milestone Progress</h2>
            <span className="text-body-sm text-text-muted">{acceptedPct}% complete</span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-border-subtle rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-mint-navy rounded-full transition-all duration-500"
              style={{ width: `${acceptedPct}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {milestoneStats.map((stat) => (
              <div key={stat.label} className={`rounded-lg p-4 text-center ${stat.bg}`}>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className={`text-caption font-medium mt-1 ${stat.color}`}>{stat.label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Evaluation Details */}
        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-h3 text-text-primary">Evaluation Details</h2>
            {evaluation ? <StatusBadge status={evaluation.status} /> : <StatusBadge status="pending" />}
          </div>
          {evaluation ? (
            <EvaluationDisplay evaluation={evaluation} showSectionTotals />
          ) : (
            <EmptyState
              title="Pending"
              description="Your evaluation details will appear here once your supervisor submits them."
            />
          )}
        </Card>

        {/* Quick Actions (only show if evaluation is not published) */}
        <Card>
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-h3 text-text-primary">Quick Actions</h2>
            {isEvaluationPublished && (
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-status-pending-bg text-status-pending-text">
                Locked after evaluation
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              variant={isEvaluationPublished ? 'secondary' : 'primary'}
              fullWidth
              onClick={() => { if (!isEvaluationPublished) navigate(ROUTES.STUDENT_MILESTONES); }}
              disabled={isEvaluationPublished}
            >
              {isEvaluationPublished ? 'Submit New Milestone (Locked)' : 'Submit New Milestone'}
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => { if (!isEvaluationPublished) navigate(ROUTES.STUDENT_MESSAGES); }}
              disabled={isEvaluationPublished}
            >
              {isEvaluationPublished ? 'Message Supervisor (Locked)' : 'Message Supervisor'}
            </Button>
            <Button
              variant={isEvaluationPublished ? 'secondary' : 'secondary'}
              fullWidth
              onClick={() => { if (!isEvaluationPublished) navigate(ROUTES.STUDENT_MILESTONES); }}
              disabled={isEvaluationPublished}
            >
              {isEvaluationPublished ? 'View All Milestones (Locked)' : 'View All Milestones'}
            </Button>
          </div>
        </Card>

      </div>
    </DashboardLayout>
  );
}