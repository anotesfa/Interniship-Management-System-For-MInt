// Supervisor component for reviewing milestones (FR-MIL-006 to FR-MIL-009)
import React, { useState } from 'react';
import { Milestone, MilestoneStatus } from '../../types';
import { Card, Button, StatusBadge, Modal, Textarea } from '../common';
import { formatDateTime } from '../../utils/format';
import { milestoneService } from '../../services';

interface MilestoneReviewCardProps {
  milestone: Milestone;
  onUpdate: () => void;
}

const STATUS_OPTIONS: { value: MilestoneStatus; label: string; description: string; color: string; bg: string; border: string }[] = [
  {
    value: MilestoneStatus.ACCEPTED,
    label: 'Accept',
    description: 'Milestone meets requirements',
    color: 'text-status-approved-text',
    bg: 'bg-status-approved-bg',
    border: 'border-[#A7F3D0]',
  },
  {
    value: MilestoneStatus.PENDING_REVISION,
    label: 'Request Revision',
    description: 'Needs improvement before acceptance',
    color: 'text-status-pending-text',
    bg: 'bg-status-pending-bg',
    border: 'border-[#FDE68A]',
  },
  {
    value: MilestoneStatus.REJECTED,
    label: 'Reject',
    description: 'Does not meet requirements',
    color: 'text-status-rejected-text',
    bg: 'bg-status-rejected-bg',
    border: 'border-[#FECACA]',
  },
];

export const MilestoneReviewCard: React.FC<MilestoneReviewCardProps> = ({
  milestone,
  onUpdate,
}) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [status, setStatus] = useState<MilestoneStatus>(MilestoneStatus.ACCEPTED);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const feedbackRequired = status === MilestoneStatus.PENDING_REVISION || status === MilestoneStatus.REJECTED;
  const isValid = !feedbackRequired || feedback.trim().length >= 10;

  const handleReview = async () => {
    setIsLoading(true);
    try {
      await milestoneService.reviewMilestone(milestone.milestone_id, { status, feedback });
      setShowReviewModal(false);
      setToast({ type: 'success', message: 'Milestone reviewed successfully.' });
      onUpdate();
    } catch {
      setShowReviewModal(false);
      setToast({ type: 'error', message: 'Failed to submit review. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedOption = STATUS_OPTIONS.find(o => o.value === status)!;

  return (
    <>
      <Card>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-start gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-body font-semibold text-text-primary truncate">{milestone.title}</h3>
              <p className="text-caption text-text-muted mt-0.5">
                {milestone.group_name && <span>Group: <strong>{milestone.group_name}</strong> · </span>}
                {formatDateTime(milestone.submission_date)}
              </p>
            </div>
            <StatusBadge status={milestone.status} />
          </div>

          <p className="text-body-sm text-text-muted leading-relaxed">{milestone.description}</p>

          {/* Attachment */}
          {milestone.attachment_name && milestone.document_id && (
            <div className="bg-status-approved-bg border border-[#A7F3D0] rounded-lg p-3">
              <div className="flex items-start gap-2 text-body-sm text-status-approved-text">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                  <span className="truncate font-medium">{milestone.attachment_name}</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      try {
                        await milestoneService.downloadAttachment(
                          String(milestone.document_id),
                          milestone.attachment_name,
                        );
                      } catch (error) {
                        console.error('Failed to download attachment:', error);
                        setToast({ type: 'error', message: 'Failed to download attachment. The file might be missing on the server.' });
                      }
                    }}
                  >
                    Download
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Existing feedback */}
          {milestone.feedback && (
            <div className="bg-mint-pale border-l-4 border-mint-blue rounded-lg p-4">
              <p className="text-body-sm font-semibold text-mint-navy mb-1">Your Feedback</p>
              <p className="text-body-sm text-text-muted">{milestone.feedback}</p>
            </div>
          )}

          {/* Review button */}
          {milestone.status === MilestoneStatus.PENDING_REVIEW && (
            <div className="pt-3 border-t border-border-subtle">
              <Button
                variant="primary"
                size="sm"
                onClick={() => { setStatus(MilestoneStatus.ACCEPTED); setFeedback(''); setShowReviewModal(true); }}
              >
                Review Milestone
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Toast feedback */}
      {toast && (
        <Modal isOpen onClose={() => setToast(null)} title={toast.type === 'success' ? 'Review Submitted' : 'Review Failed'} size="sm">
          <div className="space-y-5">
            <div className="flex flex-col items-center text-center py-2">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${toast.type === 'success' ? 'bg-status-approved-bg' : 'bg-status-rejected-bg'}`}>
                {toast.type === 'success' ? (
                  <svg className="w-7 h-7 text-eth-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 text-eth-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <p className="text-body font-semibold text-text-primary">{toast.message}</p>
            </div>
            <div className="flex justify-center">
              <Button variant={toast.type === 'success' ? 'primary' : 'secondary'} onClick={() => setToast(null)}>Done</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Review Milestone"
        subtitle={`"${milestone.title}"`}
        size="md"
      >
        <div className="space-y-5">
          {/* Milestone summary */}
          <div className="bg-surface-page border border-border-subtle rounded-xl p-4">
            <p className="text-body-sm text-text-muted leading-relaxed line-clamp-3">{milestone.description}</p>
          </div>

          {/* Status selector — visual cards */}
          <div>
            <p className="text-body-sm font-semibold text-text-primary mb-2">
              Decision <span className="text-eth-red">*</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value)}
                  className={`rounded-xl border-2 px-3 py-3 text-left transition-all ${
                    status === opt.value
                      ? `${opt.bg} ${opt.border} ring-2 ring-offset-1 ${opt.border.replace('border-', 'ring-')}`
                      : 'bg-white border-border-default hover:border-border-default hover:bg-surface-page'
                  }`}
                >
                  <p className={`text-body-sm font-semibold ${status === opt.value ? opt.color : 'text-text-primary'}`}>
                    {opt.label}
                  </p>
                  <p className={`text-caption mt-0.5 ${status === opt.value ? opt.color + '/70' : 'text-text-muted'}`}>
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
              Feedback {feedbackRequired ? <span className="text-eth-red">*</span> : <span className="text-text-muted font-normal">(optional)</span>}
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder={
                status === MilestoneStatus.ACCEPTED
                  ? 'Optionally add encouraging feedback for the student...'
                  : 'Explain what needs to be improved or why this milestone is being rejected...'
              }
              showCharCount
              maxLength={1000}
            />
            {feedbackRequired && feedback.trim().length < 10 && (
              <p className="text-caption text-status-pending-text mt-1">Minimum 10 characters required</p>
            )}
          </div>

          {/* Preview of selected decision */}
          <div className={`flex items-center gap-3 rounded-lg px-4 py-3 ${selectedOption.bg} border ${selectedOption.border}`}>
            <svg className={`w-4 h-4 flex-shrink-0 ${selectedOption.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={`text-body-sm font-medium ${selectedOption.color}`}>
              This milestone will be marked as <strong>{selectedOption.label}</strong>.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-1 border-t border-border-subtle">
            <Button variant="secondary" onClick={() => setShowReviewModal(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              variant={status === MilestoneStatus.ACCEPTED ? 'success' : status === MilestoneStatus.REJECTED ? 'danger' : 'primary'}
              onClick={handleReview}
              isLoading={isLoading}
              disabled={!isValid}
            >
              Submit Review
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
