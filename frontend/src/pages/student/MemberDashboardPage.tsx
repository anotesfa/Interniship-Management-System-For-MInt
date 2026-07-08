import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner, Card, Button, StatusBadge } from '../../components/common';
import { assignmentService, evaluationService, studentGroupService } from '../../services';
import { InternshipAssignment } from '../../types';
import { StudentGroupStatus } from '../../types/student-group.types';
import { formatDate } from '../../utils/format';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants';

export default function StudentMemberDashboardPage() {
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<InternshipAssignment | null>(null);
  const [group, setGroup] = useState<StudentGroupStatus | null>(null);
  const [isEvaluationPublished, setIsEvaluationPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const [assignmentData, groupData, isPublished] = await Promise.all([
        assignmentService.getMyAssignment(),
        studentGroupService.getMyGroup(),
        evaluationService.checkPublishedStatus(),
      ]);
      if (!groupData.has_group || groupData.is_team_leader) {
        navigate(ROUTES.STUDENT_DASHBOARD, { replace: true });
        return;
      }
      setAssignment(assignmentData);
      setGroup(groupData);
      setIsEvaluationPublished(isPublished);
    } catch (error) {
      console.error('Failed to load member dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Student Dashboard" breadcrumb={['Student', 'Dashboard']}>
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" text="Loading dashboard..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Dashboard" breadcrumb={['Student', 'Dashboard']}>
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-caption uppercase tracking-wider text-text-muted">Team Member Dashboard</p>
              <h2 className="text-h2 text-text-primary mt-1">Keep up with your team updates</h2>
              <p className="text-body-sm text-text-muted mt-2 max-w-2xl">
                You are part of a supervisor group. Use Messages and Evaluation here; your team leader handles milestone and monthly report submissions.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={() => navigate(ROUTES.STUDENT_MESSAGES)}>
                Open Messages
              </Button>
              <Button variant="primary" onClick={() => navigate(ROUTES.STUDENT_EVALUATION)}>
                View Evaluation
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h3 className="text-h3 text-text-primary mb-4">Assignment</h3>
            {assignment ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-caption uppercase tracking-wider text-text-muted">Supervisor</p>
                    <p className="text-body font-semibold text-text-primary">{assignment.supervisor_name}</p>
                  </div>
                  <StatusBadge status={assignment.status} />
                </div>
                <div className="grid grid-cols-2 gap-3">
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
            ) : (
              <p className="text-body-sm text-text-muted">Your internship assignment will appear here once it is available.</p>
            )}
          </Card>

          <Card>
            <h3 className="text-h3 text-text-primary mb-4">Your Group</h3>
            {group?.has_group && group.group ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-caption uppercase tracking-wider text-text-muted">Team Name</p>
                    <h4 className="text-body font-semibold text-text-primary mt-1">{group.group.team_name || 'Student Group'}</h4>
                    <p className="text-body-sm text-text-muted mt-1">
                      Leader: {group.group.leader_student_name || 'Not assigned'}
                    </p>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => navigate(ROUTES.STUDENT_MESSAGES)}
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Message
                  </Button>
                </div>
                
                {group.group.start_date && group.group.end_date && (
                  <div className="bg-surface-page rounded-lg p-3 border border-border-subtle">
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

                <div>
                  <p className="text-caption text-text-muted uppercase tracking-wider mb-2">Members</p>
                  <div className="space-y-2">
                    {group.group.members.map((member) => (
                      <div 
                        key={member.student_id} 
                        className="flex items-center gap-3 rounded-lg border border-border-default bg-white px-3 py-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-mint-pale flex items-center justify-center text-mint-navy font-semibold text-sm flex-shrink-0">
                          {member.student_name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-body-sm font-medium text-text-primary truncate">{member.student_name}</p>
                          <p className="text-caption text-text-muted truncate">{member.department}</p>
                        </div>
                        {member.is_leader && (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700 flex-shrink-0">
                            Leader
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-body-sm text-text-muted">You are not currently part of a group. Your supervisor will create groups when ready.</p>
            )}
          </Card>
        </div>

        <Card>
          <h3 className="text-h3 text-text-primary mb-4">What you can do</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Button variant="secondary" fullWidth onClick={() => navigate(ROUTES.STUDENT_MESSAGES)}>
              Open Messages
            </Button>
            <Button variant="secondary" fullWidth onClick={() => navigate(ROUTES.STUDENT_EVALUATION)}>
              View Evaluation
            </Button>
            <Button variant="secondary" fullWidth disabled={!isEvaluationPublished} onClick={() => navigate(ROUTES.STUDENT_EVALUATION)}>
              Check Published Feedback
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
