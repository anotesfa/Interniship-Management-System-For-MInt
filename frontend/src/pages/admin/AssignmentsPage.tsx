// Admin - Advisor Assignment Page (FR-SUP-001 to FR-SUP-007)
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner, Card, Button, EmptyState, Modal } from '../../components/common';
import { Supervisor } from '../../types';
import { assignmentService } from '../../services';
import { applicationService, ApprovedStudent } from '../../services/application.service';

// ─── Assign Advisor Modal ────────────────────────────────────────────────────

function AssignAdvisorModal({
  student,
  supervisors,
  onClose,
  onAssigned,
}: {
  student: ApprovedStudent;
  supervisors: Supervisor[];
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupervisorId) {
      setError('Please select an advisor');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await assignmentService.assignSupervisor({
        internshipId: student.internship_id ?? undefined,
        studentId: student.internship_id ? undefined : student.student_id,
        applicationId: student.internship_id ? undefined : student.application_id,
        supervisorId: Number(selectedSupervisorId),
      });
      onAssigned();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign advisor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Assign Advisor"
      subtitle={`Assigning advisor to ${student.student_name}${student.department ? ` · ${student.department}` : ''}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
            Select Advisor <span className="text-eth-red">*</span>
          </label>

          {supervisors.length === 0 ? (
            <div className="flex items-center gap-2 bg-status-rejected-bg border border-[#FECACA] text-status-rejected-text px-4 py-3 rounded-lg text-body-sm">
              No available advisors at this time.
            </div>
          ) : (
            <select
              value={selectedSupervisorId}
              onChange={(e) => setSelectedSupervisorId(e.target.value)}
              className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
            >
              <option value="">— Choose an advisor —</option>
              {supervisors.map((s) => (
                <option key={s.supervisor_id} value={s.supervisor_id}>
                  {s.full_name} · {s.department} ({s.current_students}/{s.max_students} students)
                </option>
              ))}
            </select>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-status-rejected-bg border border-[#FECACA] text-status-rejected-text px-4 py-3 rounded-lg text-body-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
          <Button variant="secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            disabled={supervisors.length === 0}
          >
            Assign Advisor
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Reassign Modal ──────────────────────────────────────────────────────────

function ReassignModal({
  assignmentId,
  currentSupervisorName,
  supervisors,
  onClose,
  onReassigned,
}: {
  assignmentId: number;
  currentSupervisorName: string;
  supervisors: Supervisor[];
  onClose: () => void;
  onReassigned: () => void;
}) {
  const [selectedSupervisorId, setSelectedSupervisorId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupervisorId) {
      setError('Please select a new advisor');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await assignmentService.reassignSupervisor(assignmentId, Number(selectedSupervisorId));
      onReassigned();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reassign advisor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Reassign Advisor"
      subtitle={`Current advisor: ${currentSupervisorName}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-body-sm font-semibold text-text-primary mb-1.5">
            New Advisor <span className="text-eth-red">*</span>
          </label>

          <select
            value={selectedSupervisorId}
            onChange={(e) => setSelectedSupervisorId(e.target.value)}
            className="w-full h-[42px] bg-surface-input border border-border-default rounded-lg px-3.5 text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-mint-blue focus:border-mint-blue transition-all"
          >
            <option value="">— Choose an advisor —</option>
            {supervisors.map((s) => (
              <option key={s.supervisor_id} value={s.supervisor_id}>
                {s.full_name} · {s.department} ({s.current_students}/{s.max_students} students)
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-status-rejected-bg border border-[#FECACA] text-status-rejected-text px-4 py-3 rounded-lg text-body-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
          <Button variant="secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            Reassign
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminAssignmentsPage() {
  const [approvedStudents, setApprovedStudents] = useState<ApprovedStudent[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [assignTarget, setAssignTarget] = useState<ApprovedStudent | null>(null);
  const [reassignTarget, setReassignTarget] = useState<{
    assignmentId: number;
    supervisorName: string;
  } | null>(null);

  // New: classification tabs inside Assignment section
  const [viewTab, setViewTab] = useState<'supervisors' | 'students'>('students');
  // Existing students status tabs
  const [studentTab, setStudentTab] = useState<'unassigned' | 'assigned'>('unassigned');

  // Supervisor -> view assigned students
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<number | null>(null);
  const [supervisorStudents, setSupervisorStudents] = useState<ApprovedStudent[]>([]);
  const [isSupervisorStudentsLoading, setIsSupervisorStudentsLoading] = useState(false);

  useEffect(() => {

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [studentsData, supervisorsData] = await Promise.all([
        applicationService.getApprovedStudents(),
        assignmentService.getAvailableSupervisors(),
      ]);
      setApprovedStudents(studentsData);
      setSupervisors(supervisorsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const unassigned = approvedStudents.filter((s) => !s.assignment);
  const assigned = approvedStudents.filter((s) => !!s.assignment);

  const loadStudentsForSupervisor = async (supervisorId: number) => {
    setSelectedSupervisorId(supervisorId);
    setIsSupervisorStudentsLoading(true);

    try {
      const assignments = await assignmentService.getStudentsBySupervisor(supervisorId);

      // backend returns InternshipAssignment mapped shape; this page expects ApprovedStudent.
      // We only map fields we can reliably provide. For missing fields, we use safe defaults.
      const mapped: ApprovedStudent[] = (assignments as any[]).map((a) => ({
        application_id: a.application_id ? Number(a.application_id) : 0,
        student_id: Number(a.student_id),
        student_name: a.student_name ?? 'Unknown',
        department: a.department ?? '',
        registration_number: a.registration_number ?? '',
        internship_id: a.internship_id ? Number(a.internship_id) : null,
        internship_status: a.internship_status ?? null,
        assignment: a.assignment_id
          ? {
              assignment_id: Number(a.assignment_id),
              supervisor_name: a.supervisor_name ?? '',
              supervisor_id: Number(a.supervisor_id),
              status: a.status ?? 'active',
            }
          : null,
      }));

      setSupervisorStudents(mapped);
    } catch (error: any) {
      console.error('Failed to load supervisor students:', error);
      setSupervisorStudents([]);
    } finally {
      setIsSupervisorStudentsLoading(false);
    }
  };


  if (isLoading) {
    return (
      <DashboardLayout title="Advisor Assignments">
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading assignments..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Advisor Assignments">
      {assignTarget && (
        <AssignAdvisorModal
          student={assignTarget}
          supervisors={supervisors}
          onClose={() => setAssignTarget(null)}
          onAssigned={loadData}
        />
      )}

      {reassignTarget && (
        <ReassignModal
          assignmentId={reassignTarget.assignmentId}
          currentSupervisorName={reassignTarget.supervisorName}
          supervisors={supervisors}
          onClose={() => setReassignTarget(null)}
          onReassigned={loadData}
        />
      )}


      <div className="space-y-6">
        {/* Summary counts */}
        <div className="flex gap-3">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm">
            <span className="font-semibold text-yellow-800">{unassigned.length}</span>
            <span className="text-yellow-700 ml-1">awaiting assignment</span>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
            <span className="font-semibold text-green-800">{assigned.length}</span>
            <span className="text-green-700 ml-1">assigned</span>
          </div>
        </div>

        {/* Classification Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewTab('students')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewTab === 'students'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Students
          </button>
          <button
            onClick={() => setViewTab('supervisors')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewTab === 'supervisors'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Supervisors
          </button>
        </div>

        {/* Supervisors view */}
        {viewTab === 'supervisors' && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Advisor Capacity</h2>
            {supervisors.length === 0 ? (
              <EmptyState title="No supervisors available" description="No supervisors are available right now." />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {supervisors.map((supervisor) => (
                    <Card key={supervisor.supervisor_id}>
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{supervisor.full_name}</h3>
                            <p className="text-sm text-gray-500">{supervisor.department}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => loadStudentsForSupervisor(Number(supervisor.supervisor_id))}

                          >
                            View students
                          </Button>
                        </div>

                        <div className="flex justify-between items-center pt-1">
                          <span className="text-sm text-gray-600">Students assigned:</span>
                          <span className="font-medium text-sm">
                            {supervisor.current_students} / {supervisor.max_students}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              supervisor.current_students >= supervisor.max_students
                                ? 'bg-red-500'
                                : supervisor.current_students / supervisor.max_students > 0.7
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{
                              width: `${Math.min(
                                (supervisor.current_students / supervisor.max_students) * 100,
                                100,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="mt-6">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Assigned Students
                  </h2>

                  {isSupervisorStudentsLoading ? (
                    <div className="flex justify-center py-6">
                      <LoadingSpinner size="md" text="Loading assigned students…" />
                    </div>
                  ) : supervisorStudents.length === 0 ? (
                    <EmptyState
                      title="No students to show"
                      description={selectedSupervisorId ? 'This supervisor has no students assigned.' : 'Select a supervisor to view their assigned students.'}
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reg. No.</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Internship</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {supervisorStudents.map((student) => (
                            <tr key={`${student.application_id}-${student.student_id}`} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.student_name}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{student.registration_number}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{student.department}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                  {student.internship_status ?? 'pending_assignment'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 text-xs rounded-full font-medium ${
                                    student.assignment?.status === 'active'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {student.assignment?.status ?? 'active'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}


        {/* Students view */}
        {viewTab === 'students' && (
          <>
            {/* Students status tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setStudentTab('unassigned')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  studentTab === 'unassigned'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Needs Assignment ({unassigned.length})
              </button>
              <button
                onClick={() => setStudentTab('assigned')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  studentTab === 'assigned'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Assigned ({assigned.length})
              </button>
            </div>

            {studentTab === 'unassigned' && (
              <Card title="Students Awaiting Advisor Assignment">
                {unassigned.length === 0 ? (
                  <EmptyState
                    title="All students assigned"
                    description="Every approved student has been assigned an advisor."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reg. No.</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Internship</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {unassigned.map((student) => (
                          <tr key={`${student.application_id}-${student.student_id}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.student_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{student.registration_number}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{student.department}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                {student.internship_status ?? 'pending_assignment'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <Button size="sm" variant="primary" onClick={() => setAssignTarget(student)}>
                                Assign Advisor
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}

            {studentTab === 'assigned' && (
              <Card title="Students with Assigned Advisors">
                {assigned.length === 0 ? (
                  <EmptyState
                    title="No assignments yet"
                    description="No students have been assigned an advisor yet."
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Advisor</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {assigned.map((student) => (
                          <tr key={`${student.application_id}-${student.student_id}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.student_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{student.department}</td>
                            <td className="px-4 py-3 text-sm text-gray-700 font-medium">{student.assignment!.supervisor_name}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 text-xs rounded-full font-medium ${
                                  student.assignment!.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {student.assignment!.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() =>
                                  setReassignTarget({
                                    assignmentId: student.assignment!.assignment_id,
                                    supervisorName: student.assignment!.supervisor_name,
                                  })
                                }
                              >
                                Reassign
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

