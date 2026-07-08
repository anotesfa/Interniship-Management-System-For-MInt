// Student - Milestones Page (FR-MIL-001 to FR-MIL-005)
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { MilestoneSubmissionForm } from '../../components/student';
import { LoadingSpinner, Card, StatusBadge, Button, Modal, EmptyState } from '../../components/common';
import { Milestone, MilestoneStatus } from '../../types';
import { milestoneService, evaluationService } from '../../services';
import { formatDateTime } from '../../utils/format';

export default function StudentMilestonesPage() {
  const [milestones, setMilestones]       = useState<Milestone[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [showNewForm, setShowNewForm]     = useState(false);
  const [editMilestone, setEditMilestone] = useState<Milestone | null>(null);
  const [successMsg, setSuccessMsg]       = useState('');
  const [isEvaluationPublished, setIsEvaluationPublished] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [milestonesData, isPublished] = await Promise.all([
        milestoneService.getMyMilestones(),
        evaluationService.checkPublishedStatus(),
      ]);
      setMilestones(milestonesData);
      setIsEvaluationPublished(isPublished);
    } catch (error) {
      console.error('Failed to load milestones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = (msg = 'Milestone submitted successfully!') => {
    setShowNewForm(false);
    setEditMilestone(null);
    setSuccessMsg(msg);
    loadData();
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Show locked message if evaluation is published
  if (!isLoading && isEvaluationPublished) {
    return (
      <DashboardLayout title="My Milestones" breadcrumb={['Student', 'Milestones']}>
        <Card>
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-status-rejected-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-status-rejected-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-h2 text-text-primary mb-2">Submissions Locked</h2>
            <p className="text-body-sm text-text-muted">Your evaluation has been published. You can no longer submit milestones. If you have questions, please contact your supervisor.</p>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Milestones" breadcrumb={['Student', 'Milestones']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-body-sm text-text-muted">
            {milestones.length} milestone{milestones.length !== 1 ? 's' : ''} submitted
          </p>
          <Button
            variant="primary"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
            onClick={() => setShowNewForm(true)}
          >
            Submit New Milestone
          </Button>
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 bg-status-approved-bg border border-[#A7F3D0] text-status-approved-text px-4 py-3 rounded-lg text-body-sm font-medium">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMsg}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" text="Loading milestones..." /></div>
        ) : milestones.length === 0 ? (
          <EmptyState
            title="No milestones yet"
            description="Submit your first milestone to start tracking your internship progress."
            action={<Button variant="primary" onClick={() => setShowNewForm(true)}>Submit First Milestone</Button>}
          />
        ) : (
          <div className="grid gap-4">
            {milestones.map((milestone) => (
              <Card key={milestone.milestone_id}>
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <h3 className="text-body font-semibold text-text-primary truncate">{milestone.title}</h3>
                      <p className="text-caption text-text-muted mt-0.5">Submitted: {formatDateTime(milestone.submission_date)}</p>
                    </div>
                    <StatusBadge status={milestone.status} />
                  </div>

                  <p className="text-body-sm text-text-muted leading-relaxed">{milestone.description}</p>

                  {milestone.attachment_name && (
                    <div className="bg-status-approved-bg border border-[#A7F3D0] rounded-lg p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 flex-shrink-0 text-status-approved-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span className="truncate font-medium text-status-approved-text">{milestone.attachment_name}</span>
                          </div>
                          <p className="text-caption text-status-approved-text/70">File submitted with your milestone</p>
                        </div>
                        {milestone.document_id && (
                          <a
                            href={`/api/documents/${milestone.document_id}/download`}
                            download
                            className="flex items-center gap-2 px-3 py-2 bg-status-approved-text text-white rounded-lg text-body-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            View
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {milestone.feedback && (
                    <div className="bg-mint-pale border border-border-subtle rounded-lg p-4">
                      <p className="text-body-sm font-semibold text-mint-navy mb-1">Supervisor Feedback</p>
                      <p className="text-body-sm text-text-muted">{milestone.feedback}</p>
                      {milestone.reviewed_at && (
                        <p className="text-caption text-text-hint mt-2">Reviewed: {formatDateTime(milestone.reviewed_at)}</p>
                      )}
                    </div>
                  )}

                  {milestone.status === MilestoneStatus.PENDING_REVISION && !milestone.locked && (
                    <div className="pt-3 border-t border-border-subtle">
                      <Button variant="secondary" size="sm" onClick={() => setEditMilestone(milestone)}>
                        Edit &amp; Resubmit
                      </Button>
                    </div>
                  )}

                  {milestone.locked && (
                    <div className="flex items-center gap-2 text-caption text-text-muted bg-surface-page px-3 py-2 rounded-lg">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      This milestone is locked and cannot be edited
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showNewForm} onClose={() => setShowNewForm(false)} title="Submit New Milestone" subtitle="Describe your progress and attach any supporting files." size="lg">
        <MilestoneSubmissionForm onSuccess={() => handleSuccess('Milestone submitted successfully!')} />
      </Modal>

      {editMilestone && (
        <Modal isOpen={!!editMilestone} onClose={() => setEditMilestone(null)} title="Edit & Resubmit Milestone" subtitle={`Revising: "${editMilestone.title}"`} size="lg">
          <MilestoneSubmissionForm milestone={editMilestone} onSuccess={() => handleSuccess('Milestone resubmitted successfully!')} />
        </Modal>
      )}
    </DashboardLayout>
  );
}