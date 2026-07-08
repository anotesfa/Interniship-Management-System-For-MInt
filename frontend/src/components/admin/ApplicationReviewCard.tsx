// Admin component for reviewing university bulk applications
import React, { useState } from 'react';
import { InternshipApplication } from '../../types';
import { Card, Button, StatusBadge, Modal, Textarea } from '../common';
import { formatDate } from '../../utils/format';
import { applicationService } from '../../services';

interface ApplicationReviewCardProps {
  application: InternshipApplication;
  onUpdate: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract a human-readable message from any thrown value */
function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as any;
    // Axios error with a backend message
    const backendMsg =
      e.response?.data?.message ||
      e.response?.data?.error ||
      e.response?.data;
    if (typeof backendMsg === 'string' && backendMsg.trim()) return backendMsg.trim();
    if (Array.isArray(backendMsg) && backendMsg.length) return backendMsg.join(', ');
    if (e.message && typeof e.message === 'string') return e.message;
  }
  if (typeof err === 'string') return err;
  return 'Something went wrong. Please try again.';
}

// ─── Approve Modal ────────────────────────────────────────────────────────────
function ApproveModal({
  universityName,
  studentCount,
  isLoading,
  onConfirm,
  onClose,
}: {
  universityName: string;
  studentCount: number;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal isOpen onClose={onClose} title="Approve Application" size="sm">
      <div className="space-y-4">
        <div className="bg-status-approved-bg border border-[#A7F3D0] rounded-lg p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-eth-green/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-eth-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-body-sm font-semibold text-text-primary">
              Approve {studentCount} student{studentCount !== 1 ? 's' : ''} from {universityName}
            </p>
            <p className="text-caption text-text-muted mt-0.5">
              Student accounts will be created (or activated) and login credentials emailed to each student.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-1 border-t border-border-subtle">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="success" onClick={onConfirm} isLoading={isLoading}>Approve</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────
function RejectModal({
  universityName,
  isLoading,
  onConfirm,
  onClose,
}: {
  universityName: string;
  isLoading: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const isValid = reason.trim().length >= 20;

  return (
    <Modal isOpen onClose={onClose} title="Reject Application" subtitle={universityName} size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
            Rejection Reason <span className="text-eth-red">*</span>
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Explain why this application is being rejected. The university coordinator will see this message."
            showCharCount
            maxLength={500}
          />
          <p className={`text-caption mt-1 ${reason.trim().length < 20 ? 'text-status-pending-text' : 'text-status-approved-text'}`}>
            {reason.trim().length < 20
              ? `${20 - reason.trim().length} more characters required`
              : 'Looks good'}
          </p>
        </div>
        <div className="flex justify-end gap-3 pt-1 border-t border-border-subtle">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="danger" onClick={() => onConfirm(reason)} isLoading={isLoading} disabled={!isValid}>
            Reject Application
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Hold Modal ───────────────────────────────────────────────────────────────
function HoldModal({
  universityName,
  isLoading,
  onConfirm,
  onClose,
}: {
  universityName: string;
  isLoading: boolean;
  onConfirm: (comment: string) => void;
  onClose: () => void;
}) {
  const [comment, setComment] = useState('');
  const isValid = comment.trim().length >= 10;

  return (
    <Modal isOpen onClose={onClose} title="Request More Information" subtitle={universityName} size="md">
      <div className="space-y-4">
        <p className="text-body-sm text-text-muted">
          The application will be placed on hold and the university coordinator will be notified of what is needed.
        </p>
        <div>
          <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
            What is needed? <span className="text-eth-red">*</span>
          </label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Describe what additional documents or information is required from the university..."
            showCharCount
            maxLength={500}
          />
          <p className={`text-caption mt-1 ${comment.trim().length < 10 ? 'text-status-pending-text' : 'text-status-approved-text'}`}>
            {comment.trim().length < 10
              ? `${10 - comment.trim().length} more characters required`
              : 'Looks good'}
          </p>
        </div>
        <div className="flex justify-end gap-3 pt-1 border-t border-border-subtle">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="primary" onClick={() => onConfirm(comment)} isLoading={isLoading} disabled={!isValid}>
            Send Request
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Feedback Modal ───────────────────────────────────────────────────────────
function FeedbackModal({
  type,
  message,
  onClose,
}: {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}) {
  const isSuccess = type === 'success';
  return (
    <Modal isOpen onClose={onClose} title={isSuccess ? 'Done' : 'Action Failed'} size="sm">
      <div className="space-y-4">
        <div className="flex flex-col items-center text-center py-2">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isSuccess ? 'bg-status-approved-bg' : 'bg-status-rejected-bg'}`}>
            {isSuccess
              ? <svg className="w-6 h-6 text-eth-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              : <svg className="w-6 h-6 text-eth-red" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            }
          </div>
          <p className="text-body-sm font-semibold text-text-primary">{message}</p>
        </div>
        <div className="flex justify-center">
          <Button variant={isSuccess ? 'primary' : 'secondary'} onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Main Card ────────────────────────────────────────────────────────────────
export const ApplicationReviewCard: React.FC<ApplicationReviewCardProps> = ({ application, onUpdate }) => {
  const [modal, setModal] = useState<'approve' | 'reject' | 'hold' | 'success' | 'error' | null>(null);
  const [showStudents, setShowStudents] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ── Derived values ──────────────────────────────────────────────────────────
  // Never fall back to "University {id}" — use a clean unknown label instead
  const universityName =
    application.university_name && application.university_name.trim()
      ? application.university_name.trim()
      : 'Unknown University';

  const coordinatorName =
    application.coordinator_name && application.coordinator_name.trim()
      ? application.coordinator_name.trim()
      : 'University Coordinator';

  const requestLetter = application.documents?.find((d) => d.document_type === 'request_letter');
  const studentCount = application.student_count ?? application.students?.length ?? 1;

  const students = application.students?.length
    ? application.students
    : application.student_name
      ? [{
          student_id: application.student_id || application.application_id,
          full_name: application.student_name,
          registration_number: application.student_institutional_id,
          email: application.institutional_email,
          department: application.department,
          gpa: application.gpa,
          status: application.status,
        }]
      : [];

  // ── Action handlers ─────────────────────────────────────────────────────────
  const handleApprove = async () => {
    setIsLoading(true);
    try {
      await applicationService.approveApplication(application.application_id);
      setModal(null);
      setFeedbackMsg(
        `Application from ${universityName} approved. Login credentials have been sent to all ${studentCount} student${studentCount !== 1 ? 's' : ''}.`,
      );
      setModal('success');
      onUpdate();
    } catch (err) {
      setModal(null);
      setFeedbackMsg(
        extractErrorMessage(err) ||
        'Failed to approve the application. Please check your connection and try again.',
      );
      setModal('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    setIsLoading(true);
    try {
      await applicationService.rejectApplication(application.application_id, reason);
      setModal(null);
      setFeedbackMsg(`Application from ${universityName} has been rejected. The coordinator has been notified.`);
      setModal('success');
      onUpdate();
    } catch (err) {
      setModal(null);
      setFeedbackMsg(
        extractErrorMessage(err) ||
        'Failed to reject the application. Please try again.',
      );
      setModal('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHold = async (comment: string) => {
    setIsLoading(true);
    try {
      await applicationService.holdApplication(application.application_id, comment);
      setModal(null);
      setFeedbackMsg(`Application placed on hold. ${universityName} has been notified of the information required.`);
      setModal('success');
      onUpdate();
    } catch (err) {
      setModal(null);
      setFeedbackMsg(
        extractErrorMessage(err) ||
        'Failed to update the application status. Please try again.',
      );
      setModal('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (docId: string, fileName: string) => {
    try {
      await applicationService.downloadDocument(docId, fileName);
    } catch (err) {
      setFeedbackMsg(`Could not download "${fileName}". The file may have been moved or deleted.`);
      setModal('error');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <Card className="hover:shadow-sm transition-shadow">
        {/* Top row: university identity + status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-mint-pale flex items-center justify-center text-mint-navy font-bold text-base flex-shrink-0">
              {universityName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="text-body font-semibold text-text-primary truncate">{universityName}</h3>
              <p className="text-caption text-text-muted truncate">{coordinatorName}</p>
            </div>
          </div>
          <StatusBadge status={application.status} />
        </div>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-caption text-text-muted">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20H7m10 0a3 3 0 003-3V7a3 3 0 00-3-3H7a3 3 0 00-3 3v10a3 3 0 003 3m10 0v-2a3 3 0 00-3-3H7a3 3 0 00-3 3v2" />
            </svg>
            <span className="font-medium text-text-primary">{studentCount}</span>
            &nbsp;student{studentCount !== 1 ? 's' : ''}
          </span>

          {(requestLetter || application.documents?.[0]) && (
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="truncate max-w-[180px]">
                {requestLetter?.file_name ?? application.documents![0].file_name}
              </span>
            </span>
          )}

          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(application.created_at)}
          </span>
        </div>

        {/* Status notes */}
        {application.rejection_reason && (
          <div className="mt-3 flex items-start gap-2 bg-status-rejected-bg border border-[#FECACA] rounded-lg px-3 py-2.5">
            <svg className="w-4 h-4 text-eth-red flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <div>
              <p className="text-caption font-semibold text-status-rejected-text">Rejection reason</p>
              <p className="text-caption text-status-rejected-text/80 mt-0.5">{application.rejection_reason}</p>
            </div>
          </div>
        )}

        {application.hold_comment && (
          <div className="mt-3 flex items-start gap-2 bg-status-pending-bg border border-[#FDE68A] rounded-lg px-3 py-2.5">
            <svg className="w-4 h-4 text-status-pending-text flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-caption font-semibold text-status-pending-text">On hold — additional information requested</p>
              <p className="text-caption text-status-pending-text/80 mt-0.5">{application.hold_comment}</p>
            </div>
          </div>
        )}

        {/* Student list toggle */}
        {students.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowStudents((v) => !v)}
              className="flex items-center gap-1.5 text-caption font-semibold text-mint-navy hover:text-mint-blue transition-colors"
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform ${showStudents ? 'rotate-90' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {showStudents ? 'Hide' : 'Show'} student list ({students.length})
            </button>

            {showStudents && (
              <div className="mt-2 border border-border-subtle rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-caption">
                    <thead>
                      <tr className="bg-surface-page border-b border-border-subtle">
                        <th className="text-left px-3 py-2 font-semibold text-text-muted w-8">#</th>
                        <th className="text-left px-3 py-2 font-semibold text-text-muted">Name</th>
                        <th className="text-left px-3 py-2 font-semibold text-text-muted hidden sm:table-cell">Email</th>
                        <th className="text-left px-3 py-2 font-semibold text-text-muted hidden md:table-cell">Reg. No.</th>
                        <th className="text-left px-3 py-2 font-semibold text-text-muted hidden md:table-cell">Department</th>
                        <th className="text-left px-3 py-2 font-semibold text-text-muted hidden lg:table-cell">GPA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, i) => (
                        <tr
                          key={s.student_id}
                          className={`border-b border-border-subtle last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-surface-page/50'}`}
                        >
                          <td className="px-3 py-2 text-text-muted">{i + 1}</td>
                          <td className="px-3 py-2 font-medium text-text-primary">{s.full_name}</td>
                          <td className="px-3 py-2 text-text-muted hidden sm:table-cell">{s.email}</td>
                          <td className="px-3 py-2 text-text-muted hidden md:table-cell">{s.registration_number || '—'}</td>
                          <td className="px-3 py-2 text-text-muted hidden md:table-cell">{s.department}</td>
                          <td className="px-3 py-2 text-text-muted hidden lg:table-cell">
                            {s.gpa != null ? Number(s.gpa).toFixed(2) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Document download pills */}
        {application.documents && application.documents.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {application.documents.map((doc) => (
              <button
                key={doc.document_id}
                onClick={() => handleDownload(doc.document_id, doc.file_name)}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface-page border border-border-subtle px-3 py-1 text-caption font-medium text-text-muted hover:border-mint-blue hover:text-mint-navy transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {doc.file_name}
              </button>
            ))}
          </div>
        )}

        {/* Actions — pending only */}
        {application.status === 'pending' && (
          <div className="mt-4 pt-3 border-t border-border-subtle flex gap-2">
            <Button variant="success" size="sm" onClick={() => setModal('approve')}>Approve</Button>
            <Button variant="danger" size="sm" onClick={() => setModal('reject')}>Reject</Button>
            <Button variant="secondary" size="sm" onClick={() => setModal('hold')}>Hold</Button>
          </div>
        )}
      </Card>

      {/* Modals */}
      {modal === 'approve' && (
        <ApproveModal
          universityName={universityName}
          studentCount={studentCount}
          isLoading={isLoading}
          onConfirm={handleApprove}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'reject' && (
        <RejectModal
          universityName={universityName}
          isLoading={isLoading}
          onConfirm={handleReject}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'hold' && (
        <HoldModal
          universityName={universityName}
          isLoading={isLoading}
          onConfirm={handleHold}
          onClose={() => setModal(null)}
        />
      )}
      {(modal === 'success' || modal === 'error') && (
        <FeedbackModal
          type={modal}
          message={feedbackMsg}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
};
