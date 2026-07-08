// Supervisor - Evaluations Page (FR-EVAL-001 to FR-EVAL-003)
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner, Card, Button, EmptyState, StatusBadge, Modal } from '../../components/common';
import { Evaluation, InternshipAssignment } from '../../types';
import { NewEvaluationForm } from '../../components/supervisor';
import { evaluationService, assignmentService } from '../../services';
import { attendanceService } from '../../services/attendance.service';
import { EvaluationFormData } from '../../types/evaluation.types';

export default function SupervisorEvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [pendingStudents, setPendingStudents] = useState<InternshipAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedStudent, setSelectedStudent] = useState<{ student_id: string | number; student_name?: string; status?: string } | null>(null);
  const [evaluationForm, setEvaluationForm] = useState<EvaluationFormData | null>(null);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isFormSaving, setIsFormSaving] = useState(false);
  const [isFormReadOnly, setIsFormReadOnly] = useState(false);
  const [evalError, setEvalError] = useState('');
  const [evalSuccess, setEvalSuccess] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [evaluationsData, studentsData] = await Promise.all([
        evaluationService.getMyEvaluations(),
        assignmentService.getMyAssignedStudents(),
      ]);
      setEvaluations(evaluationsData);
      const evaluatedStudentIds = new Set(
        evaluationsData
          .filter((e) => e.status !== 'returned')
          .map((e) => String(e.student_id)),
      );
      const pendingEvals = studentsData.filter(
        (s) => !evaluatedStudentIds.has(String(s.student_id)),
      );
      setPendingStudents(pendingEvals);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudentEvaluation = async (studentId: string | number, studentName?: string, status?: string) => {
    setSelectedStudent({ student_id: studentId, student_name: studentName, status });
    setIsFormLoading(true);
    setEvalError('');
    setEvalSuccess('');

    try {
      const [existing, assignment] = await Promise.all([
        evaluationService.getEvaluationByStudent(String(studentId)),
        assignmentService.getByStudent(Number(studentId)),
      ]);

      const internshipId = assignment?.internship?.internship_id ?? assignment?.internship_id;
      const attendance = internshipId ? await attendanceService.getByInternship(Number(internshipId)) : null;

      const attendancePercentage = attendance?.percentage ?? existing?.attendance_percentage;
      const totalAbsentDays = attendance?.total_absent_days ?? existing?.total_absent_days;
      const attendanceWeeks = attendance?.weeks ?? existing?.weeks;
      const groupStartDate = attendance?.group_start_date ?? existing?.group_start_date ?? null;
      const groupEndDate = attendance?.group_end_date ?? existing?.group_end_date ?? null;
      const groupAttendanceDays = attendance?.group_attendance_days ?? existing?.group_attendance_days ?? null;

      if (existing) {
        setEvaluationForm({
          student_id: studentId,
          punctuality_score: existing.punctuality_score,
          reliability_score: existing.reliability_score,
          independence_score: existing.independence_score,
          communication_score: existing.communication_score,
          professionalism_score: existing.professionalism_score,
          speed_of_work_score: existing.speed_of_work_score,
          accuracy_score: existing.accuracy_score,
          engagement_score: existing.engagement_score,
          need_for_work_score: existing.need_for_work_score,
          cooperation_score: existing.cooperation_score,
          technical_skills_score: existing.technical_skills_score,
          organizational_skills_score: existing.organizational_skills_score,
          project_support_score: existing.project_support_score,
          responsibility_score: existing.responsibility_score,
          team_quality_score: existing.team_quality_score,
          attendance_percentage: attendancePercentage,
          total_absent_days: totalAbsentDays,
          grade: existing.grade ?? '',
          remarks: existing.remarks ?? '',
          score: existing.score,
          weeks: attendanceWeeks,
          group_start_date: groupStartDate,
          group_end_date: groupEndDate,
          group_attendance_days: groupAttendanceDays,
        });
        setIsFormReadOnly(existing.status === 'submitted' || existing.status === 'published');
      } else {
        setEvaluationForm({
          student_id: studentId,
          attendance_percentage: attendancePercentage,
          total_absent_days: totalAbsentDays,
          weeks: attendanceWeeks,
          group_start_date: groupStartDate,
          group_end_date: groupEndDate,
          group_attendance_days: groupAttendanceDays,
          grade: '',
          remarks: '',
        });
        setIsFormReadOnly(false);
      }
    } catch (error) {
      console.error('Failed to load evaluation for student', studentId, error);
      setEvaluationForm({ student_id: studentId, grade: '', remarks: '' });
      setIsFormReadOnly(false);
    } finally {
      setIsFormLoading(false);
    }
  };

  const closeFormModal = () => {
    setSelectedStudent(null);
    setEvaluationForm(null);
    setEvalError('');
    setEvalSuccess('');
    setIsFormReadOnly(false);
  };

  const handleSaveDraft = async () => {
    if (!selectedStudent || !evaluationForm) return;
    setIsFormSaving(true);
    setEvalError('');
    try {
      await evaluationService.saveDraft(String(selectedStudent.student_id), evaluationForm);
      setEvalSuccess('Draft saved successfully');
      await loadData();
    } catch (error: any) {
      setEvalError(error?.message || 'Failed to save draft');
    } finally {
      setIsFormSaving(false);
    }
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedStudent || !evaluationForm) return;
    setIsFormSaving(true);
    setEvalError('');
    try {
      await evaluationService.submitEvaluation(String(selectedStudent.student_id), evaluationForm);
      setEvalSuccess('Evaluation submitted successfully');
      await loadData();
      setTimeout(closeFormModal, 800);
    } catch (error: any) {
      setEvalError(error?.message || 'Failed to submit evaluation');
    } finally {
      setIsFormSaving(false);
    }
  };

  return (
    <DashboardLayout title="Student Evaluations" breadcrumb={['Supervisor', 'Evaluations']}>
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" text="Loading evaluations..." /></div>
        ) : (
          <>
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-eth-yellow rounded-full animate-pulse" />
                <h2 className="text-h3 text-text-primary">Awaiting Evaluation</h2>
                <span className="ml-auto text-body-sm text-text-muted">{pendingStudents.length} student{pendingStudents.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-3">
                {pendingStudents.length === 0 ? (
                  <EmptyState title="No pending evaluations" description="All assigned students have been evaluated." />
                ) : (
                  pendingStudents.map((student) => (
                    <button
                      key={student.assignment_id}
                      type="button"
                      onClick={() => loadStudentEvaluation(student.student_id, student.student_name, 'pending')}
                      className="w-full text-left rounded-xl border border-status-pending-bg bg-status-pending-bg/30 px-4 py-4 transition-all hover:bg-status-pending-bg/50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-body-sm font-semibold text-text-primary">{student.student_name}</p>
                          <p className="text-caption text-text-muted mt-0.5">Evaluation pending — open the form to complete.</p>
                        </div>
                        <span className="text-xs font-semibold rounded-full px-2 py-1 bg-[#FDE68A] text-status-pending-text">Pending</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-h3 text-text-primary">Submitted Evaluations</h2>
                <span className="text-body-sm text-text-muted">{evaluations.length} total</span>
              </div>
              {evaluations.length === 0 ? (
                <EmptyState title="No submitted evaluations yet" description="Once you submit an evaluation it will appear here." />
              ) : (
                <div className="space-y-3">
                  {evaluations.map((evaluation) => (
                    <div key={evaluation.evaluation_id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border-subtle rounded-lg hover:bg-surface-page transition-colors gap-3">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-mint-pale flex items-center justify-center text-mint-navy font-bold text-body-sm flex-shrink-0">
                          {(evaluation.student_name || 'S').charAt(0)}
                        </div>
                        <div>
                          <p className="text-body-sm font-semibold text-text-primary">{evaluation.student_name || 'Unknown Student'}</p>
                          <p className="text-caption text-text-muted">
                            Grade: <span className="font-bold text-text-primary">{evaluation.grade}</span>
                            {evaluation.score !== undefined && <> · Score: <span className="font-bold text-text-primary">{evaluation.score}/100</span></>}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusBadge status={evaluation.status} />
                        <Button
                          variant={evaluation.status === 'submitted' || evaluation.status === 'published' ? 'secondary' : 'primary'}
                          size="sm"
                          onClick={() => loadStudentEvaluation(evaluation.student_id, evaluation.student_name, evaluation.status)}
                        >
                          {evaluation.status === 'draft' || evaluation.status === 'returned' ? 'Edit' : 'View'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>

      {selectedStudent && evaluationForm && (
        <Modal
          isOpen
          onClose={closeFormModal}
          title={`Evaluation — ${selectedStudent.student_name || 'Student'}`}
          subtitle="Use the navigation to move between evaluation sections"
          size="xl"
        >
          <div className="space-y-4">
              {isFormLoading ? (
                <div className="flex justify-center py-12"><LoadingSpinner text="Loading evaluation..." /></div>
              ) : (
                <>
                  {evalError && <div className="rounded-lg border border-[#FECACA] bg-status-rejected-bg px-4 py-3 text-sm text-status-rejected-text">{evalError}</div>}
                  {evalSuccess && <div className="rounded-lg border border-[#A7F3D0] bg-status-approved-bg px-4 py-3 text-sm text-status-approved-text">{evalSuccess}</div>}
                  <NewEvaluationForm
                    data={evaluationForm}
                    onChange={(updated) => setEvaluationForm(updated)}
                    showTotals
                    isReadOnly={isFormReadOnly}
                  />
                  <div className="flex flex-wrap justify-end gap-3 pt-3">
                    <Button variant="secondary" onClick={closeFormModal}>
                      Close
                    </Button>
                    <Button variant="secondary" onClick={handleSaveDraft} isLoading={isFormSaving} disabled={isFormReadOnly}>
                      Save Draft
                    </Button>
                    <Button variant="primary" onClick={handleSubmitEvaluation} isLoading={isFormSaving} disabled={isFormReadOnly}>
                      Submit Evaluation
                    </Button>
                  </div>
                </>
              )}
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
