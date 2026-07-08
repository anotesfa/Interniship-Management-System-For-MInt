// Supervisor - My Students Page
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner, Card, EmptyState, StatusBadge, Modal, Button } from '../../components/common';
import { InternshipAssignment } from '../../types';
import { assignmentService, studentGroupService } from '../../services';
import { StudentGroupSummary } from '../../types/student-group.types';
import { formatDate } from '../../utils/format';
import { ROUTES } from '../../constants';

function CreateGroupModal({
  students,
  onClose,
  onCreated,
  existingGroups,
}: {
  students: InternshipAssignment[];
  onClose: () => void;
  onCreated: () => void;
  existingGroups: StudentGroupSummary[];
}) {
  // Get all student IDs that are already in groups
  const assignedStudentIds = new Set(
    existingGroups.flatMap(group => group.members.map(m => m.student_id))
  );
  
  // Filter out students who are already in groups
  const eligibleStudents = students.filter(
    (student) => student.status === 'active' && !assignedStudentIds.has(String(student.student_id))
  );
  const [teamName, setTeamName] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>(
    eligibleStudents.map((student) => Number(student.student_id)),
  );
  const [leaderStudentId, setLeaderStudentId] = useState<number>(
    Number(eligibleStudents[0]?.student_id ?? 0),
  );
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedStudents = eligibleStudents.filter((student) =>
    selectedStudentIds.includes(Number(student.student_id)),
  );

  const toggleStudent = (studentId: number) => {
    setSelectedStudentIds((current) => {
      if (current.includes(studentId)) {
        const next = current.filter((id) => id !== studentId);
        if (leaderStudentId === studentId) {
          setLeaderStudentId(Number(next[0] ?? 0));
        }
        return next;
      }

      return [...current, studentId];
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (selectedStudentIds.length === 0) {
      setError('Select at least one student to create a group.');
      return;
    }

    if (!leaderStudentId || !selectedStudentIds.includes(leaderStudentId)) {
      setError('Choose a team leader from the selected students.');
      return;
    }

    if (!teamName || teamName.trim() === '') {
      setError('Team name is required');
      return;
    }

    if (!startDate || !endDate) {
      setError('Internship start and end dates are required.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('Start date cannot be after end date.');
      return;
    }

    if (selectedDays.length === 0) {
      setError('Specify at least one attendance day per week.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await studentGroupService.createGroup({
        studentIds: selectedStudentIds,
        leaderStudentId,
        teamName: teamName.trim() || undefined,
        startDate,
        endDate,
        attendanceDays: selectedDays.join(','),
      });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Create Student Group"
      subtitle="Group assigned students, set the internship schedule, and choose a team leader."
      size="xl"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-sm font-semibold text-text-primary">Team name</span>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Required team name"
              className="w-full bg-surface-input border border-border-default rounded-lg px-4 py-2.5 text-body focus:outline-none focus:ring-2 focus:ring-mint-blue"
            />
          </label>
          <div className="rounded-lg border border-border-default bg-surface-page px-4 py-3">
            <p className="text-sm font-semibold text-text-primary">Eligible students</p>
            <p className="text-sm text-text-muted">{eligibleStudents.length} active student(s)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border-subtle pt-4">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-text-primary">Internship Period</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-xs text-text-muted">Start Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mint-blue"
                  required
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-text-muted">End Date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mint-blue"
                  required
                />
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-text-primary">Expected Attendance Days</p>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-mint-pale text-mint-navy">
                {selectedDays.length} day{selectedDays.length !== 1 ? 's' : ''}/week
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      setSelectedDays((prev) =>
                        prev.includes(day)
                          ? prev.filter((d) => d !== day)
                          : [...prev, day]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-all ${
                      isSelected
                        ? 'bg-mint-blue text-white border-mint-blue'
                        : 'bg-white text-text-muted border-border-default hover:bg-surface-page'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-border-subtle pt-4">
          <div>
            <p className="text-sm font-semibold text-text-primary">Select students</p>
            <p className="text-caption text-text-muted">Only active students assigned to you can be grouped.</p>
          </div>
          <div className="grid gap-3 max-h-72 overflow-y-auto pr-1">
            {eligibleStudents.map((student) => {
              const studentId = Number(student.student_id);
              const checked = selectedStudentIds.includes(studentId);

              return (
                <label
                  key={student.assignment_id}
                  className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                    checked ? 'border-mint-blue bg-mint-pale/30' : 'border-border-default bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleStudent(studentId)}
                    className="mt-1 h-4 w-4 rounded border-border-default text-mint-blue focus:ring-mint-blue"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">{student.student_name}</p>
                    <p className="text-caption text-text-muted">{student.student_email || ''}</p>
                    <p className="text-caption text-text-muted">{student.department || '—'}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <input
                      type="radio"
                      name="group-leader"
                      checked={leaderStudentId === studentId}
                      onChange={() => setLeaderStudentId(studentId)}
                      disabled={!checked}
                      className="h-4 w-4 border-border-default text-mint-blue focus:ring-mint-blue disabled:opacity-50"
                    />
                    Leader
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="bg-status-rejected-bg border border-[#FECACA] rounded-lg p-3 text-status-rejected-text text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
          <Button variant="secondary" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting} disabled={selectedStudents.length === 0 || teamName.trim() === ''}>
            Create Group
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function SupervisorStudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<InternshipAssignment[]>([]);
  const [groups, setGroups] = useState<StudentGroupSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGroupsLoading, setIsGroupsLoading] = useState(true);
  const [selectedStudent, setSelected] = useState<InternshipAssignment | null>(null);
  const [activeTab, setActiveTab] = useState<'students' | 'groups'>('students');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [editGroup, setEditGroup] = useState<StudentGroupSummary | null>(null);
  const [selectedGroupDetail, setSelectedGroupDetail] = useState<StudentGroupSummary | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudentGroupSummary | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    setIsGroupsLoading(true);
    try { const data = await assignmentService.getMyAssignedStudents(); setStudents(data); }
    catch (error) { console.error('Failed to load students:', error); }
    finally { setIsLoading(false); }

    try {
      const groupData = await studentGroupService.getMySupervisorGroups();
      setGroups(groupData);
    } catch (error) {
      console.error('Failed to load groups:', error);
    } finally {
      setIsGroupsLoading(false);
    }
  };

  const activeCount = students.filter((s) => s.status === 'active').length;
  const completedCount = students.filter((s) => s.status === 'completed').length;

  return (
    <DashboardLayout title="My Students" breadcrumb={['Supervisor', 'Students']}>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'students'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Students
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'groups'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Groups
          </button>
        </div>

        {activeTab === 'students' && students.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total', value: students.length, color: 'text-text-primary' },
              { label: 'Active', value: activeCount, color: 'text-status-approved-text' },
              { label: 'Completed', value: completedCount, color: 'text-mint-blue' },
            ].map((s) => (
              <Card key={s.label}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-caption text-text-muted mt-1">{s.label}</p>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'students' && isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" text="Loading students..." /></div>
        ) : activeTab === 'students' && students.length === 0 ? (
          <EmptyState title="No Students Assigned" description="You don't have any students assigned yet." />
        ) : activeTab === 'students' ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-surface-page">
                    {['Student', 'Department', 'Period', 'Status', ''].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-label uppercase tracking-wider text-text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.assignment_id} className="border-b border-border-subtle hover:bg-mint-pale transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-mint-pale text-mint-navy flex items-center justify-center text-body-sm font-bold flex-shrink-0">
                            {(s.student_name || 'S').charAt(0)}
                          </div>
                          <div>
                            <p className="text-body-sm font-semibold text-text-primary">{s.student_name}</p>
                            <p className="text-caption text-text-muted">{s.student_email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-body-sm text-text-muted">{s.department || '—'}</td>
                      <td className="px-5 py-4 text-body-sm text-text-muted">
                        {s.start_date && s.end_date ? `${formatDate(s.start_date)} – ${formatDate(s.end_date)}` : '—'}
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={s.status} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setSelected(s)}>View Details</Button>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={!s.student_user_id}
                            onClick={() => s.student_user_id && navigate('/supervisor/messages', { state: { studentUserId: s.student_user_id } })}
                          >
                            Message
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}

        {activeTab === 'groups' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Student Groups</h2>
                <p className="text-sm text-gray-600 mt-1">Create groups from your assigned students, then choose a team leader.</p>
              </div>
              <Button 
                variant="primary" 
                onClick={() => setShowCreateGroup(true)} 
                disabled={students.filter((s) => {
                  const assignedIds = new Set(groups.flatMap(g => g.members.map(m => m.student_id)));
                  return s.status === 'active' && !assignedIds.has(String(s.student_id));
                }).length === 0}
              >
                Create Group
              </Button>
            </div>

            {isGroupsLoading ? (
              <div className="flex justify-center py-16"><LoadingSpinner size="lg" text="Loading groups..." /></div>
            ) : groups.length === 0 ? (
              <EmptyState
                title="No groups yet"
                description="Create a group from your assigned students. Once the group is created, the chat thread appears automatically in Messages."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groups.map((group) => (
                  <Card key={group.group_id} className="hover:shadow-md transition-shadow">
                    <div className="space-y-4">
                      {/* Group Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-body font-semibold text-text-primary truncate">
                            {group.team_name || 'Student Group'}
                          </h3>
                          <p className="text-caption text-text-muted mt-0.5">
                            {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <StatusBadge status={group.status || 'active'} />
                      </div>

                      {/* Group Metadata */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-body-sm text-text-muted">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="truncate">Leader: {group.leader_student_name || 'Not set'}</span>
                        </div>
                        
                        {group.start_date && group.end_date && (
                          <div className="flex items-center gap-2 text-body-sm text-text-muted">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="truncate">{formatDate(group.start_date)} – {formatDate(group.end_date)}</span>
                          </div>
                        )}

                        {group.attendance_days && (
                          <div className="flex items-center gap-2 text-body-sm text-text-muted">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span className="truncate capitalize">{group.attendance_days.split(',').join(', ')}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2 border-t border-border-subtle">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => { setSelectedGroupDetail(group); }}
                        >
                          View Details
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(ROUTES.SUPERVISOR_MESSAGES)}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedStudent && (
        <Modal isOpen={!!selectedStudent} onClose={() => setSelected(null)} title={selectedStudent.student_name || 'Student Details'} subtitle="Internship Assignment Details" size="md">
          <div className="space-y-1">
            {[
              { label: 'Student Name', value: selectedStudent.student_name },
              { label: 'Email', value: selectedStudent.student_email },
              { label: 'Department', value: selectedStudent.department },
              { label: 'Status', value: null, badge: selectedStudent.status },
              { label: 'Start Date', value: selectedStudent.start_date ? formatDate(selectedStudent.start_date) : '—' },
              { label: 'End Date', value: selectedStudent.end_date ? formatDate(selectedStudent.end_date) : '—' },
            ].map(({ label, value, badge }) => (
              <div key={label} className="flex justify-between items-center py-3 border-b border-border-subtle last:border-0">
                <span className="text-body-sm text-text-muted">{label}</span>
                {badge ? <StatusBadge status={badge} /> : <span className="text-body-sm font-semibold text-text-primary">{value || '—'}</span>}
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-5 border-t border-border-subtle mt-2">
            <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
          </div>
        </Modal>
      )}

      {showCreateGroup && (
        <CreateGroupModal
          students={students}
          onClose={() => setShowCreateGroup(false)}
          onCreated={loadData}
          existingGroups={groups}
        />
      )}

      {editGroup && (
        <EditGroupModal
          group={editGroup}
          students={students}
          onClose={() => setEditGroup(null)}
          onUpdated={loadData}
          existingGroups={groups}
        />
      )}

      {showDeleteConfirm && deleteTarget && (
        <Modal isOpen onClose={() => setShowDeleteConfirm(false)} title="Delete Group" subtitle="Confirm deletion">
          <div className="space-y-4">
            <p>Are you sure you want to delete <strong>{deleteTarget.team_name || 'this group'}</strong>? This will remove the group and its membership.</p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
              <Button variant="danger" onClick={async () => {
                try {
                  await studentGroupService.deleteGroup(deleteTarget.group_id);
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                  loadData();
                } catch (err) {
                  console.error('Failed to delete group', err);
                }
              }}>Delete</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Group Detail Modal */}
      {selectedGroupDetail && (
        <Modal 
          isOpen 
          onClose={() => setSelectedGroupDetail(null)} 
          title={selectedGroupDetail.team_name || 'Student Group'} 
          subtitle="Group Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* Group Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-page rounded-lg p-4 border border-border-subtle">
                <p className="text-caption text-text-muted uppercase tracking-wider mb-1">Status</p>
                <StatusBadge status={selectedGroupDetail.status || 'active'} />
              </div>
              <div className="bg-surface-page rounded-lg p-4 border border-border-subtle">
                <p className="text-caption text-text-muted uppercase tracking-wider mb-1">Members</p>
                <p className="text-body font-semibold text-text-primary">{selectedGroupDetail.members.length} student{selectedGroupDetail.members.length !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Schedule Info */}
            {selectedGroupDetail.start_date && selectedGroupDetail.end_date && (
              <div className="bg-mint-pale rounded-lg p-4 border border-mint-blue/20">
                <h4 className="text-body-sm font-semibold text-mint-navy mb-3">Internship Schedule</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-caption text-text-muted uppercase tracking-wider mb-1">Period</p>
                    <p className="text-body-sm text-text-primary">
                      {formatDate(selectedGroupDetail.start_date)} – {formatDate(selectedGroupDetail.end_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-caption text-text-muted uppercase tracking-wider mb-1">Attendance Days</p>
                    <p className="text-body-sm text-text-primary capitalize">
                      {selectedGroupDetail.attendance_days ? selectedGroupDetail.attendance_days.split(',').join(', ') : 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Team Leader */}
            <div>
              <h4 className="text-body-sm font-semibold text-text-primary mb-3">Team Leader</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {(selectedGroupDetail.leader_student_name || 'L').charAt(0)}
                  </div>
                  <div>
                    <p className="text-body-sm font-semibold text-text-primary">
                      {selectedGroupDetail.leader_student_name || 'Not assigned'}
                    </p>
                    <p className="text-caption text-text-muted">Responsible for milestone and report submissions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Members List */}
            <div>
              <h4 className="text-body-sm font-semibold text-text-primary mb-3">All Members</h4>
              <div className="space-y-2">
                {selectedGroupDetail.members.map((member) => (
                  <div 
                    key={member.student_id} 
                    className="flex items-center justify-between gap-3 rounded-lg border border-border-default bg-white px-4 py-3 hover:bg-surface-page transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-mint-pale flex items-center justify-center text-mint-navy font-semibold text-sm flex-shrink-0">
                        {member.student_name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-body-sm font-medium text-text-primary truncate">{member.student_name}</p>
                        <p className="text-caption text-text-muted truncate">{member.department}</p>
                      </div>
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

            {/* Info Note */}
            <div className="bg-status-pending-bg border border-[#FDE68A] rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-status-pending-text flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-body-sm text-status-pending-text">
                  A group chat thread is automatically available in Messages for the supervisor and all members.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between gap-3 pt-2 border-t border-border-subtle">
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  onClick={() => { 
                    setSelectedGroupDetail(null); 
                    setEditGroup(selectedGroupDetail); 
                  }}
                >
                  Edit Group
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => { 
                    setDeleteTarget(selectedGroupDetail); 
                    setShowDeleteConfirm(true); 
                    setSelectedGroupDetail(null);
                  }}
                >
                  Delete
                </Button>
              </div>
              <Button variant="primary" onClick={() => navigate(ROUTES.SUPERVISOR_MESSAGES)}>
                Open Messages
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}

function EditGroupModal({
  group,
  students,
  onClose,
  onUpdated,
  existingGroups,
}: {
  group: StudentGroupSummary;
  students: InternshipAssignment[];
  onClose: () => void;
  onUpdated: () => void;
  existingGroups: StudentGroupSummary[];
}) {
  // Get all student IDs that are already in OTHER groups (not this one)
  const assignedStudentIds = new Set(
    existingGroups
      .filter(g => g.group_id !== group.group_id)
      .flatMap(g => g.members.map(m => m.student_id))
  );
  
  // Filter out students who are already in other groups
  const eligibleStudents = students.filter(
    (student) => student.status === 'active' && !assignedStudentIds.has(String(student.student_id))
  );
  const [teamName, setTeamName] = useState(group.team_name || '');
  const initialIds = group.members.map((m) => Number(m.student_id));
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>(initialIds);
  const [leaderStudentId, setLeaderStudentId] = useState<number>(Number(group.leader_student_id || initialIds[0] || 0));
  const [startDate, setStartDate] = useState(
    group.start_date ? new Date(group.start_date).toISOString().split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    group.end_date ? new Date(group.end_date).toISOString().split('T')[0] : ''
  );
  const [selectedDays, setSelectedDays] = useState<string[]>(
    group.attendance_days ? group.attendance_days.split(',') : []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleStudent = (studentId: number) => {
    setSelectedStudentIds((current) => {
      if (current.includes(studentId)) {
        const next = current.filter((id) => id !== studentId);
        if (leaderStudentId === studentId) setLeaderStudentId(Number(next[0] ?? 0));
        return next;
      }
      return [...current, studentId];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) { setError('Select at least one student'); return; }
    if (!selectedStudentIds.includes(leaderStudentId)) { setError('Leader must be one of selected students'); return; }
    if (!teamName || teamName.trim() === '') { setError('Team name is required'); return; }
    if (!startDate || !endDate) { setError('Internship start and end dates are required.'); return; }
    if (new Date(startDate) > new Date(endDate)) { setError('Start date cannot be after end date.'); return; }
    if (selectedDays.length === 0) { setError('Specify at least one attendance day per week.'); return; }

    setError(''); setIsSubmitting(true);
    try {
      await studentGroupService.updateGroup(group.group_id, {
        studentIds: selectedStudentIds,
        leaderStudentId,
        teamName: teamName.trim(),
        startDate,
        endDate,
        attendanceDays: selectedDays.join(','),
      });
      onUpdated(); onClose();
    } catch (err: any) { setError(err?.response?.data?.message || 'Failed to update group'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <Modal isOpen onClose={onClose} title="Edit Group" subtitle="Edit members, team name, and internship schedule" size="xl">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-sm font-semibold text-text-primary">Team name</span>
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)} className="w-full bg-surface-input border border-border-default rounded-lg px-4 py-2.5" />
          </label>
          <div className="rounded-lg border border-border-default bg-surface-page px-4 py-3">
            <p className="text-sm font-semibold text-text-primary">Eligible students</p>
            <p className="text-sm text-text-muted">{eligibleStudents.length} active student(s)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border-subtle pt-4">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-text-primary">Internship Period</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-xs text-text-muted">Start Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mint-blue"
                  required
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-text-muted">End Date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-mint-blue"
                  required
                />
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-text-primary">Expected Attendance Days</p>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-mint-pale text-mint-navy">
                {selectedDays.length} day{selectedDays.length !== 1 ? 's' : ''}/week
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day) => {
                const isSelected = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      setSelectedDays((prev) =>
                        prev.includes(day)
                          ? prev.filter((d) => d !== day)
                          : [...prev, day]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition-all ${
                      isSelected
                        ? 'bg-mint-blue text-white border-mint-blue'
                        : 'bg-white text-text-muted border-border-default hover:bg-surface-page'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-border-subtle pt-4">
          <div>
            <p className="text-sm font-semibold text-text-primary">Select students</p>
            <p className="text-caption text-text-muted">Only active students assigned to you can be grouped.</p>
          </div>
          <div className="grid gap-3 max-h-72 overflow-y-auto pr-1">
            {eligibleStudents.map((student) => {
              const sid = Number(student.student_id);
              const checked = selectedStudentIds.includes(sid);
              return (
                <label key={student.assignment_id} className={`flex items-start gap-3 rounded-xl border p-3 ${checked ? 'border-mint-blue bg-mint-pale/30' : 'border-border-default bg-white'}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleStudent(sid)} className="mt-1 h-4 w-4" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">{student.student_name}</p>
                    <p className="text-caption text-text-muted">{student.student_email}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <input type="radio" name="group-leader-edit" checked={leaderStudentId === sid} onChange={() => setLeaderStudentId(sid)} disabled={!checked} className="h-4 w-4" />
                    Leader
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex justify-end gap-3 pt-2 border-t border-border-subtle">
          <Button variant="secondary" type="button" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting} disabled={isSubmitting || selectedStudentIds.length === 0 || teamName.trim() === ''}>Save changes</Button>
        </div>
      </form>
    </Modal>
  );
}
