// Supervisor - Combined Evaluation & Attendance Page
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner, Card, Button, EmptyState, StatusBadge } from '../../components/common';
import { NewEvaluationForm } from '../../components/supervisor';
import { evaluationService, assignmentService } from '../../services';
import { attendanceService } from '../../services/attendance.service';
import { EvaluationFormData } from '../../types/evaluation.types';
import { Attendance } from '../../types/attendance.types';
import { InternshipAssignment } from '../../types';
import { extractErrorMessage } from '../../utils/error-handler';
import { ROUTES } from '../../constants';

const REQUIRED_SCORE_FIELDS: Array<keyof EvaluationFormData> = [
  'punctuality_score',
  'reliability_score',
  'independence_score',
  'communication_score',
  'professionalism_score',
  'speed_of_work_score',
  'accuracy_score',
  'engagement_score',
  'need_for_work_score',
  'cooperation_score',
  'technical_skills_score',
  'organizational_skills_score',
  'project_support_score',
  'responsibility_score',
  'team_quality_score',
  'attendance_percentage',
  'total_absent_days',
];

function hasValue(value: unknown) {
  return value !== undefined && value !== null && value !== '';
}

export default function SupervisorEvaluationFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeStudentId = (location.state as { studentId?: number | string } | null)?.studentId;

  const [student, setStudent] = useState<InternshipAssignment | null>(null);
  const [assignedStudents, setAssignedStudents] = useState<InternshipAssignment[]>([]);
  const [attendanceList, setAttendanceList] = useState<Attendance[]>([]);
  const [pendingStudents, setPendingStudents] = useState<InternshipAssignment[]>([]);
  const [evaluatedStudents, setEvaluatedStudents] = useState<InternshipAssignment[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | number | null>(routeStudentId ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(false);

  const [formData, setFormData] = useState<EvaluationFormData>({
    grade: '',
    remarks: '',
  });

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [students, evaluations, attendances] = await Promise.all([
        assignmentService.getMyAssignedStudents(),
        evaluationService.getMyEvaluations(),
        attendanceService.getMyStudentsAttendance(),
      ]);

      setAssignedStudents(students);
      setAttendanceList(attendances);

      const evaluatedStudentIds = new Set(
        evaluations
          .filter((evaluation: any) => evaluation.status === 'submitted' || evaluation.status === 'published')
          .map((evaluation: any) => String(evaluation.student_id)),
      );

      const pending = students.filter((studentItem: any) => !evaluatedStudentIds.has(String(studentItem.student_id)));
      const evaluated = students.filter((studentItem: any) => evaluatedStudentIds.has(String(studentItem.student_id)));

      setPendingStudents(pending);
      setEvaluatedStudents(evaluated);

      const initialStudentId = routeStudentId ?? pending[0]?.student_id ?? evaluated[0]?.student_id ?? null;
      if (initialStudentId) {
        setSelectedStudentId(initialStudentId);
        await loadStudent(initialStudentId, students, attendances);
      }
    } catch {
      setError('Failed to load student information.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadInitialData(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

  const loadStudent = async (
    studentIdentifier: string | number,
    studentsSource?: InternshipAssignment[],
    attendancesSource?: Attendance[]
  ) => {
    setIsLoading(true);
    try {
      const source = studentsSource || assignedStudents;
      const attSource = attendancesSource || attendanceList;
      const found = source.find((s) => String(s.student_id) === String(studentIdentifier));
      const assignment = await assignmentService.getByStudent(Number(studentIdentifier));
      const internshipId = assignment?.internship?.internship_id ?? assignment?.internship_id;
      const studentAttendance =
        (internshipId ? await attendanceService.getByInternship(Number(internshipId)) : null) ||
        attSource.find((a) => String(a.student_id) === String(studentIdentifier));
      const existing = await evaluationService.getEvaluationByStudent(String(studentIdentifier));
      setStudent(found || null);

      if (existing) {
        setFormData({
          student_id: studentIdentifier,
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
          attendance_percentage: studentAttendance?.percentage ?? existing.attendance_percentage,
          total_absent_days: studentAttendance?.total_absent_days ?? existing.total_absent_days,
          weeks: studentAttendance?.weeks ?? existing.weeks ?? [],
          group_start_date: studentAttendance?.group_start_date ?? existing.group_start_date,
          group_end_date: studentAttendance?.group_end_date ?? existing.group_end_date,
          group_attendance_days: studentAttendance?.group_attendance_days ?? existing.group_attendance_days,
          grade: existing.grade ?? '',
          remarks: existing.remarks ?? '',
          score: existing.score,
        });

        if (existing.status === 'submitted' || existing.status === 'published') {
          setIsReadOnly(true);
        } else {
          setIsReadOnly(false);
        }
      } else {
        setFormData({
          student_id: studentIdentifier,
          attendance_percentage: studentAttendance?.percentage,
          total_absent_days: studentAttendance?.total_absent_days,
          weeks: studentAttendance?.weeks ?? [],
          group_start_date: studentAttendance?.group_start_date ?? null,
          group_end_date: studentAttendance?.group_end_date ?? null,
          group_attendance_days: studentAttendance?.group_attendance_days ?? null,
          grade: '',
          remarks: '',
        });
        setIsReadOnly(false);
      }
    } catch {
      setError('Failed to load student information.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStudent = async (studentIdentifier: string | number) => {
    setSelectedStudentId(studentIdentifier);
    await loadStudent(studentIdentifier);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isReadOnly) {
      setError('This evaluation has already been submitted and cannot be edited.');
      return;
    }

    const missingFields = REQUIRED_SCORE_FIELDS.filter((field) => !hasValue(formData[field]));
    if (missingFields.length > 0) {
      setError('Please complete both the evaluation and attendance sections before submitting.');
      return;
    }

    if (!formData.remarks.trim()) {
      setError('Please add supervisor remarks.');
      return;
    }

    setError('');
    setIsSaving(true);
    try {
      await evaluationService.submitEvaluation(String(selectedStudentId), formData);
      // Refresh lists so the pending/evaluated panes update immediately
      await loadInitialData();
      setSuccess('Evaluation and attendance submitted successfully!');
      // Make form read-only after successful submit
      setIsReadOnly(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    if (isReadOnly) {
      setError('This evaluation has already been submitted and cannot be edited.');
      return;
    }

    setError('');
    setIsSaving(true);
    try {
      await evaluationService.saveDraft(String(selectedStudentId), formData);
      setSuccess('Draft saved successfully!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Evaluation & Attendance">
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" text="Loading student..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Evaluation & Attendance" breadcrumb={['Supervisor', 'Evaluations', 'New']}>
      <div className="space-y-6 max-w-6xl">
        <Card>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-h3 text-text-primary">Evaluation &amp; Attendance Sheet</h2>
              <p className="text-body-sm text-text-muted mt-1">
                Complete all evaluation scores and attendance data, then click <strong>Submit Evaluation</strong>.
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-h3 text-text-primary">Pending Evaluations</h3>
                <p className="text-caption text-text-muted mt-0.5">Students still waiting for evaluation.</p>
              </div>
              <span className="text-body-sm text-text-muted">{pendingStudents.length} student{pendingStudents.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {pendingStudents.length === 0 ? (
                <EmptyState
                  title="No pending students"
                  description="All assigned students have already been evaluated."
                />
              ) : (
                pendingStudents.map((pendingStudent) => (
                  <button
                    key={pendingStudent.assignment_id}
                    type="button"
                    onClick={() => handleSelectStudent(pendingStudent.student_id)}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                      String(selectedStudentId) === String(pendingStudent.student_id)
                        ? 'border-mint-blue bg-mint-pale/30'
                        : 'border-border-default bg-white hover:bg-surface-page'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-mint-pale flex items-center justify-center text-mint-navy font-bold flex-shrink-0">
                          {(pendingStudent.student_name || 'S').charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-body-sm font-semibold text-text-primary truncate">{pendingStudent.student_name}</p>
                          <p className="text-caption text-text-muted truncate">{pendingStudent.department || 'Intern'}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold rounded-full px-2 py-1 bg-status-pending-bg text-status-pending-text">Pending</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-h3 text-text-primary">Already Evaluated</h3>
                <p className="text-caption text-text-muted mt-0.5">Students with submitted or published evaluations.</p>
              </div>
              <span className="text-body-sm text-text-muted">{evaluatedStudents.length} student{evaluatedStudents.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {evaluatedStudents.length === 0 ? (
                <EmptyState
                  title="No evaluated students yet"
                  description="Completed evaluations will appear here after submission."
                />
              ) : (
                evaluatedStudents.map((evaluatedStudent) => (
                  <button
                    key={evaluatedStudent.assignment_id}
                    type="button"
                    onClick={() => handleSelectStudent(evaluatedStudent.student_id)}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                      String(selectedStudentId) === String(evaluatedStudent.student_id)
                        ? 'border-mint-blue bg-mint-pale/30'
                        : 'border-border-default bg-white hover:bg-surface-page'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-mint-navy flex items-center justify-center text-white font-bold flex-shrink-0">
                          {(evaluatedStudent.student_name || 'S').charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-body-sm font-semibold text-text-primary truncate">{evaluatedStudent.student_name}</p>
                          <p className="text-caption text-text-muted truncate">{evaluatedStudent.department || 'Intern'}</p>
                        </div>
                      </div>
                      <StatusBadge status="submitted" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        {student && (
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-mint-pale flex items-center justify-center text-mint-navy font-bold text-h3 flex-shrink-0">
                {(student.student_name || 'S').charAt(0)}
              </div>
              <div>
                <h2 className="text-body font-semibold text-text-primary">{student.student_name}</h2>
                <p className="text-caption text-text-muted">{student.department || 'Intern'}</p>
              </div>
            </div>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <NewEvaluationForm
            data={formData}
            onChange={setFormData}
            isReadOnly={isReadOnly || isSaving || !!success}
            showTotals
          />

          {error && (
            <div className="flex items-center gap-2 bg-status-rejected-bg border border-[#FECACA] text-status-rejected-text px-4 py-3 rounded-lg text-body-sm font-medium">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-status-approved-bg border border-[#A7F3D0] text-status-approved-text px-4 py-3 rounded-lg text-body-sm font-medium">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {success}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleSaveDraft}
              isLoading={isSaving}
              disabled={!!success || isReadOnly || !selectedStudentId}
            >
              Save Draft
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSaving}
              disabled={!!success || isReadOnly || !selectedStudentId}
            >
              Submit Evaluation
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate(ROUTES.SUPERVISOR_EVALUATIONS)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}