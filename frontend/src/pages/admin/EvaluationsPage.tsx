// Admin - Evaluation Publishing Page (FR-EVAL-004 to FR-EVAL-005)
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner, Card, Button, EmptyState, Modal } from '../../components/common';
import { Evaluation } from '../../types';
import { evaluationService } from '../../services';
import { extractErrorMessage } from '../../utils/error-handler';

export default function AdminEvaluationsPage() {
  const [evaluations, setEvaluations]       = useState<Evaluation[]>([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [isSaving, setIsSaving]             = useState(false);
  const [successMsg, setSuccessMsg]         = useState('');
  const [errorMsg, setErrorMsg]             = useState('');

  // Publish confirm modal
  const [publishTarget, setPublishTarget]   = useState<Evaluation | null>(null);

  // Return for correction modal
  const [returnTarget, setReturnTarget]     = useState<Evaluation | null>(null);
  const [returnReason, setReturnReason]     = useState('');

  useEffect(() => { loadEvaluations(); }, []);

  const loadEvaluations = async () => {
    setIsLoading(true);
    try {
      const data = await evaluationService.getPendingEvaluations();
      setEvaluations(data);
    } catch (error) {
      console.error('Failed to load evaluations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 4000); };
  const showError   = (msg: string) => { setErrorMsg(msg);   setTimeout(() => setErrorMsg(''), 5000); };

  const getStudentName = (evaluation: Evaluation) => {
    const nestedStudent = (evaluation as Evaluation & { student?: { full_name?: string } }).student?.full_name;
    return evaluation.student_name || nestedStudent || 'Student';
  };

  const getSupervisorName = (evaluation: Evaluation) => {
    const nestedSupervisor = (evaluation as Evaluation & { supervisor?: { user?: { full_name?: string } } }).supervisor?.user?.full_name;
    return evaluation.supervisor_name || nestedSupervisor || 'Unknown Supervisor';
  };

  const handlePublish = async () => {
    if (!publishTarget) return;
    setIsSaving(true);
    try {
      await evaluationService.publishEvaluation(String(publishTarget.evaluation_id));
      setEvaluations(prev => prev.filter(e => e.evaluation_id !== publishTarget.evaluation_id));
      setPublishTarget(null);
      showSuccess('Evaluation published — student and university coordinator can now view it.');
    } catch (error) {
      showError(`Failed to publish: ${extractErrorMessage(error)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReturn = async () => {
    if (!returnTarget) return;
    if (!returnReason.trim()) { showError('Please enter a reason for returning the evaluation.'); return; }
    setIsSaving(true);
    try {
      await evaluationService.returnForCorrection(String(returnTarget.evaluation_id), returnReason);
      setEvaluations(prev => prev.filter(e => e.evaluation_id !== returnTarget.evaluation_id));
      setReturnTarget(null);
      setReturnReason('');
      showSuccess('Evaluation returned to supervisor for correction.');
    } catch (error) {
      showError(`Failed to return: ${extractErrorMessage(error)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const RatingBar = ({ label, value }: { label: string; value?: number }) => {
    if (!value) return null;
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-body-sm">
          <span className="text-text-muted">{label}</span>
          <span className="font-semibold text-text-primary">{value}/5</span>
        </div>
        <div className="h-1.5 bg-border-subtle rounded-full overflow-hidden">
          <div className="h-full bg-mint-blue rounded-full" style={{ width: `${(value / 5) * 100}%` }} />
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="Pending Evaluations" breadcrumb={['Admin', 'Evaluations']}>
      <div className="space-y-6">

        {successMsg && (
          <div className="flex items-center gap-2 bg-status-approved-bg border border-[#A7F3D0] text-status-approved-text px-4 py-3 rounded-lg text-body-sm font-medium">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 bg-status-rejected-bg border border-[#FECACA] text-status-rejected-text px-4 py-3 rounded-lg text-body-sm font-medium">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {errorMsg}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" text="Loading evaluations..." /></div>
        ) : evaluations.length === 0 ? (
          <EmptyState title="No pending evaluations" description="There are no evaluations waiting for review and publication." />
        ) : (
          <div className="grid gap-5">
            {evaluations.map((evaluation) => (
              <Card key={evaluation.evaluation_id}>
                <div className="space-y-5">

                  {/* Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-mint-pale flex items-center justify-center text-mint-navy font-bold flex-shrink-0">
                        {getStudentName(evaluation).charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-body font-semibold text-text-primary">{getStudentName(evaluation)}</h3>
                        <p className="text-caption text-text-muted">By: {getSupervisorName(evaluation)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {evaluation.score !== undefined && (
                        <div className="text-right">
                          <p className="text-caption text-text-muted">Score</p>
                          <p className="text-h2 font-bold text-mint-navy">{evaluation.score}<span className="text-body-sm text-text-muted">/100</span></p>
                        </div>
                      )}
                      <div className="text-center bg-mint-pale rounded-lg px-4 py-2">
                        <p className="text-caption text-text-muted">Grade</p>
                        <p className="text-h2 font-bold text-mint-navy">{evaluation.grade}</p>
                      </div>
                    </div>
                  </div>

                  {/* Rating bars */}
                  {(evaluation.attendance_rating || evaluation.technical_rating) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface-page rounded-lg p-4">
                      <RatingBar label="Attendance"    value={evaluation.attendance_rating} />
                      <RatingBar label="Technical"     value={evaluation.technical_rating} />
                      <RatingBar label="Teamwork"      value={evaluation.teamwork_rating} />
                      <RatingBar label="Communication" value={evaluation.communication_rating} />
                      <RatingBar label="Initiative"    value={evaluation.initiative_rating} />
                    </div>
                  )}

                  {/* Remarks */}
                  {evaluation.remarks && (
                    <div className="bg-surface-page rounded-lg p-4 border-l-4 border-mint-blue overflow-hidden">
                      <p className="text-caption text-text-muted uppercase tracking-wider mb-1">Supervisor Remarks</p>
                      <p className="text-body-sm text-text-muted italic whitespace-pre-wrap break-words leading-relaxed">
                        "{evaluation.remarks}"
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2 border-t border-border-subtle">
                    <Button
                      variant="primary"
                      onClick={() => setPublishTarget(evaluation)}
                    >
                      Publish to Student and University Coordinator
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => { setReturnTarget(evaluation); setReturnReason(''); }}
                    >
                      Return for Correction
                    </Button>
                  </div>

                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Publish Confirm Modal */}
      {publishTarget && (
        <Modal
          isOpen={!!publishTarget}
          onClose={() => setPublishTarget(null)}
          title="Publish Evaluation?"
          subtitle={`This will make ${getStudentName(publishTarget)}'s evaluation visible to the student and university coordinator.`}
          size="sm"
        >
          <div className="space-y-4">
            <div className="flex justify-between bg-surface-page rounded-lg p-4">
              <span className="text-body-sm text-text-muted">Student</span>
              <span className="text-body-sm font-semibold text-text-primary">{getStudentName(publishTarget)}</span>
            </div>
            <div className="flex justify-between bg-surface-page rounded-lg p-4">
              <span className="text-body-sm text-text-muted">Grade</span>
              <span className="text-body-sm font-bold text-mint-navy">{publishTarget.grade}</span>
            </div>
            <p className="text-body-sm text-text-muted">Once published, both the student and university coordinator will immediately be able to see this evaluation result.</p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setPublishTarget(null)} disabled={isSaving}>Cancel</Button>
              <Button variant="primary" isLoading={isSaving} onClick={handlePublish}>Yes, Publish to Both</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Return for Correction Modal */}
      {returnTarget && (
        <Modal
          isOpen={!!returnTarget}
          onClose={() => setReturnTarget(null)}
          title="Return for Correction"
          subtitle={`Returning ${returnTarget.student_name}'s evaluation to supervisor.`}
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
                Reason for Return <span className="text-eth-red">*</span>
              </label>
              <textarea
                rows={4}
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Explain what needs to be corrected or improved..."
                className="w-full bg-surface-input border border-border-default rounded-lg px-4 py-2.5 text-body text-text-primary placeholder:text-text-hint focus:outline-none focus:ring-2 focus:ring-mint-blue resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setReturnTarget(null)} disabled={isSaving}>Cancel</Button>
              <Button variant="danger" isLoading={isSaving} onClick={handleReturn}>Return to Supervisor</Button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}