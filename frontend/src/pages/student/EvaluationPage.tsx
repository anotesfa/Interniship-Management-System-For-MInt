// Student - Evaluation Page (FR-EVAL-005, FR-EVAL-006)
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner, Card, EmptyState, StatusBadge } from '../../components/common';
import { Evaluation } from '../../types';
import { assignmentService, evaluationService } from '../../services';
import { formatDateTime } from '../../utils/format';
import { EvaluationDisplay } from '../../components/supervisor';

const RATING_CATEGORIES = [
  { key: 'attendance_rating',    label: 'Attendance & Punctuality', color: 'bg-mint-pale text-mint-navy' },
  { key: 'technical_rating',     label: 'Technical Performance',    color: 'bg-status-approved-bg text-status-approved-text' },
  { key: 'teamwork_rating',      label: 'Teamwork & Collaboration', color: 'bg-status-eval-bg text-status-eval-text' },
  { key: 'communication_rating', label: 'Communication Skills',     color: 'bg-status-pending-bg text-status-pending-text' },
  { key: 'initiative_rating',    label: 'Initiative & Conduct',     color: 'bg-status-hold-bg text-status-hold-text' },
] as const;

export default function StudentEvaluationPage() {
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading]   = useState(true);

  useEffect(() => { loadEvaluation(); }, []);

  const loadEvaluation = async () => {
    setIsLoading(true);
    try {
      const assignment = await assignmentService.getMyAssignment();
      const studentId = assignment?.student_id;
      const data = studentId ? await evaluationService.getEvaluationByStudent(String(studentId)) : null;
      setEvaluation(data);
    } catch { console.error('Failed to load evaluation'); }
    finally { setIsLoading(false); }
  };

  const hasRatings = evaluation && RATING_CATEGORIES.some(c => evaluation[c.key]);
  const sectionScoreTotal =
    (evaluation?.general_performance_total ?? 0) +
    (evaluation?.personal_skills_total ?? 0) +
    (evaluation?.professional_skills_total ?? 0);
  const overallScore = evaluation?.total_score ?? sectionScoreTotal ?? evaluation?.score;

  return (
    <DashboardLayout title="My Evaluation" breadcrumb={['Student', 'Evaluation']}>
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" text="Loading evaluation..." /></div>
        ) : !evaluation ? (
          <EmptyState title="No evaluation yet" description="Your performance submission will appear here once your supervisor saves or submits it." />
        ) : (
          <>
            <Card>
              <div className="flex flex-col sm:flex-row items-center gap-8 py-4">
                <div className="text-center flex-shrink-0">
                  <p className="text-caption text-text-muted uppercase tracking-wider mb-1">Final Grade</p>
                  <div className="w-24 h-24 rounded-full bg-mint-pale border-4 border-mint-blue flex items-center justify-center">
                    <span className="text-5xl font-bold text-mint-navy">{evaluation.grade}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <StatusBadge status={evaluation.status} />
                    <span className="text-caption text-text-muted">Performance submission</span>
                  </div>
                  {overallScore !== undefined && (
                    <div>
                      <p className="text-caption text-text-muted uppercase tracking-wider">Overall Score</p>
                      <p className="text-h1 font-bold text-text-primary">{overallScore}<span className="text-h3 text-text-muted">/100</span></p>
                    </div>
                  )}
                  <p className="text-body-sm text-text-muted">Submitted: {evaluation.submitted_at ? formatDateTime(evaluation.submitted_at) : 'Pending'}</p>
                  <p className="text-body-sm text-text-muted">Published: {evaluation.published_at ? formatDateTime(evaluation.published_at) : 'Pending'}</p>
                </div>
              </div>
            </Card>

            {hasRatings && (
              <Card>
                <p className="text-h3 text-text-primary mb-4">Performance Ratings</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {RATING_CATEGORIES.map(({ key, label, color }) => {
                    const val = evaluation[key];
                    if (!val) return null;
                    return (
                      <div key={key} className={`rounded-lg p-4 text-center ${color}`}>
                        <p className="text-3xl font-bold">{val}<span className="text-lg">/5</span></p>
                        <p className="text-[11px] font-semibold mt-2 leading-tight">{label}</p>
                        <div className="flex justify-center gap-0.5 mt-2">
                          {[1,2,3,4,5].map(i => (
                            <div key={i} className={`w-2 h-2 rounded-full ${i <= val ? 'opacity-100' : 'opacity-25'} bg-current`} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {evaluation.remarks && (
              <Card>
                <p className="text-h3 text-text-primary mb-3">Supervisor Remarks</p>
                <div className="bg-surface-page rounded-lg p-5 border-l-4 border-mint-blue">
                  <p className="text-body text-text-muted leading-relaxed italic">"{evaluation.remarks}"</p>
                </div>
              </Card>
            )}

            <Card>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-h3 text-text-primary">Evaluation Details</p>
                  <p className="text-caption text-text-muted mt-1">Full breakdown of your submitted performance evaluation.</p>
                </div>
                <StatusBadge status={evaluation.status} />
              </div>
              <EvaluationDisplay evaluation={evaluation} showSectionTotals />
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}