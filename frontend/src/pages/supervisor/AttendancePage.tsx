// Supervisor - Attendance Tracking Page (SDD §6.6)
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner, Button, EmptyState, StatCard, Card } from '../../components/common';
import { Attendance, AttendanceWeekEntry } from '../../types/attendance.types';
import { attendanceService } from '../../services/attendance.service';
import { studentGroupService } from '../../services/student-group.service';
import { StudentGroupSummary } from '../../types/student-group.types';
import { useAuthStore } from '../../store/auth.store';
import { formatDate } from '../../utils/format';

const getTotalWeeks = (startDateStr: string | null, endDateStr: string | null): number => {
  if (!startDateStr || !endDateStr) return 8;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = end.getTime() - start.getTime();
  if (diffTime <= 0) return 8;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.ceil(diffDays / 7));
};

const getWeekRange = (startDateStr: string, weekNum: number): { from: string; to: string } => {
  const start = new Date(startDateStr);
  start.setDate(start.getDate() + (weekNum - 1) * 7);
  
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  
  return {
    from: start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    to: end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };
};

const getWeekStatus = (group: StudentGroupSummary, targetDate: Date = new Date()) => {
  if (!group.start_date) return { currentWeek: 1, isLocked: false, status: 'no_schedule' };
  
  const start = new Date(group.start_date);
  start.setHours(0, 0, 0, 0);
  const end = group.end_date ? new Date(group.end_date) : null;
  if (end) end.setHours(23, 59, 59, 999);
  
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  
  if (target < start) {
    return { currentWeek: 1, isLocked: true, status: 'not_started' };
  }
  
  if (end && target > end) {
    const diffTime = end.getTime() - start.getTime();
    const totalWeeks = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)));
    return { currentWeek: totalWeeks, isLocked: true, status: 'ended' };
  }
  
  const diffTime = target.getTime() - start.getTime();
  const currentWeek = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7)) + 1;
  return { currentWeek, isLocked: false, status: 'active' };
};

const normalizeWeeksToCount = (weeks: AttendanceWeekEntry[], count: number): AttendanceWeekEntry[] => {
  const base: AttendanceWeekEntry[] = Array.from({ length: count }, (_, index) => ({
    week: index + 1,
    from: '',
    to: '',
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
  }));
  
  (weeks || []).forEach((w) => {
    const idx = w.week - 1;
    if (idx >= 0 && idx < count) {
      base[idx] = {
        week: w.week,
        from: w.from || '',
        to: w.to || '',
        monday: Boolean(w.monday),
        tuesday: Boolean(w.tuesday),
        wednesday: Boolean(w.wednesday),
        thursday: Boolean(w.thursday),
        friday: Boolean(w.friday),
      };
    }
  });
  
  return base;
};

const calculateAttendanceStats = (
  weeks: AttendanceWeekEntry[],
  scheduledDays: string[],
  totalWeeksCount: number
) => {
  const totalExpectedDays = totalWeeksCount * scheduledDays.length;
  let totalPresentDays = 0;
  
  weeks.forEach((week) => {
    if (week.week <= totalWeeksCount) {
      scheduledDays.forEach((day) => {
        const key = day.trim().toLowerCase() as keyof AttendanceWeekEntry;
        if (week[key] === true) {
          totalPresentDays++;
        }
      });
    }
  });
  
  const totalAbsentDays = Math.max(0, totalExpectedDays - totalPresentDays);
  const percentage = totalExpectedDays > 0 ? Math.round((totalPresentDays / totalExpectedDays) * 100) : 100;
  
  return {
    totalExpectedDays,
    totalPresentDays,
    totalAbsentDays,
    percentage,
  };
};

const getWeekDayLabels = (daysStr: string | null): Array<{ key: keyof AttendanceWeekEntry; label: string }> => {
  if (!daysStr) return [];
  const days = daysStr.split(',');
  const mapping: Record<string, { key: keyof AttendanceWeekEntry; label: string }> = {
    monday: { key: 'monday', label: 'Mon' },
    tuesday: { key: 'tuesday', label: 'Tue' },
    wednesday: { key: 'wednesday', label: 'Wed' },
    thursday: { key: 'thursday', label: 'Thu' },
    friday: { key: 'friday', label: 'Fri' },
  };
  return days.map(d => mapping[d.trim().toLowerCase()]).filter(Boolean);
};

export default function SupervisorAttendancePage() {
  const [groups, setGroups] = useState<StudentGroupSummary[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [localWeeksData, setLocalWeeksData] = useState<Record<string, AttendanceWeekEntry[]>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewTab, setViewTab] = useState<'students' | 'summary'>('students');
  const { user } = useAuthStore();

  useEffect(() => {
    loadAttendance();
  }, [user]);

  const loadAttendance = async () => {
    setIsLoading(true);
    setError('');
    try {
      const groupData = await studentGroupService.getMySupervisorGroups();
      setGroups(groupData);
      
      const attendanceData = await attendanceService.getMyStudentsAttendance();
      setAttendanceRecords(attendanceData);
      
      if (groupData.length > 0) {
        setSelectedGroupId(prev => {
          const exists = groupData.some(g => g.group_id === prev);
          return exists ? prev : groupData[0].group_id;
        });
      }
    } catch {
      setError('Failed to load attendance records');
    } finally {
      setIsLoading(false);
    }
  };

  const currentGroup = groups.find(g => g.group_id === selectedGroupId);
  const groupRecords = attendanceRecords.filter(r => r.group_id === selectedGroupId);
  const totalWeeks = currentGroup ? getTotalWeeks(currentGroup.start_date, currentGroup.end_date) : 8;
  const weekStatus = currentGroup ? getWeekStatus(currentGroup) : { currentWeek: 1, isLocked: false, status: 'active' };
  const isWeekLocked = weekStatus.isLocked || selectedWeek !== weekStatus.currentWeek;

  let lockReason = '';
  if (weekStatus.status === 'not_started') {
    lockReason = `Internship period hasn't started yet (Starts: ${currentGroup?.start_date ? formatDate(currentGroup.start_date) : ''}).`;
  } else if (weekStatus.status === 'ended') {
    lockReason = `Internship period has ended (Ended: ${currentGroup?.end_date ? formatDate(currentGroup.end_date) : ''}).`;
  } else if (selectedWeek < weekStatus.currentWeek) {
    lockReason = 'Past week records are locked and cannot be modified.';
  } else if (selectedWeek > weekStatus.currentWeek) {
    lockReason = 'Future week records cannot be marked yet.';
  }

  useEffect(() => {
    if (!selectedGroupId || groups.length === 0) return;
    const groupVal = groups.find(g => g.group_id === selectedGroupId);
    if (!groupVal) return;
    
    const totWeeks = getTotalWeeks(groupVal.start_date, groupVal.end_date);
    const { currentWeek } = getWeekStatus(groupVal);
    
    setSelectedWeek(Math.min(Math.max(1, currentWeek), totWeeks));
    
    const records = attendanceRecords.filter(r => r.group_id === selectedGroupId);
    const initialLocalData: Record<string, AttendanceWeekEntry[]> = {};
    records.forEach(r => {
      initialLocalData[r.student_id] = normalizeWeeksToCount(r.weeks, totWeeks);
    });
    setLocalWeeksData(initialLocalData);
    setHasChanges(false);
  }, [selectedGroupId, groups, attendanceRecords]);

  const handleCheckboxChange = (studentId: string, day: keyof AttendanceWeekEntry, checked: boolean) => {
    setLocalWeeksData(prev => {
      const studentWeeks = [...(prev[studentId] || [])];
      const weekIdx = studentWeeks.findIndex(w => w.week === selectedWeek);
      if (weekIdx !== -1) {
        studentWeeks[weekIdx] = {
          ...studentWeeks[weekIdx],
          [day]: checked,
        };
      }
      return {
        ...prev,
        [studentId]: studentWeeks,
      };
    });
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    if (!currentGroup) return;
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const scheduledDays = currentGroup.attendance_days ? currentGroup.attendance_days.split(',') : [];
      const promises = groupRecords.map(async (record) => {
        const localWeeks = localWeeksData[record.student_id];
        if (!localWeeks) return;
        
        const { totalAbsentDays, percentage } = calculateAttendanceStats(
          localWeeks,
          scheduledDays,
          totalWeeks
        );
        
        await attendanceService.updateAttendance(record.attendance_id, {
          weeks: localWeeks,
          totalAbsentDays,
          percentage,
        });
      });
      
      await Promise.all(promises);
      setSuccess('Attendance sheet updated successfully!');
      setHasChanges(false);
      await loadAttendance();
      setTimeout(() => setSuccess(''), 4000);
    } catch {
      setError('Failed to update attendance records');
    } finally {
      setIsSaving(false);
    }
  };

  const scheduledDays = currentGroup?.attendance_days ? currentGroup.attendance_days.split(',') : [];
  const dayLabels = getWeekDayLabels(currentGroup?.attendance_days ?? null);
  const weekRange = currentGroup && currentGroup.start_date
    ? getWeekRange(currentGroup.start_date, selectedWeek)
    : { from: '', to: '' };

  const averageAttendance = groupRecords.length
    ? Math.round(groupRecords.reduce((sum, r) => sum + r.percentage, 0) / groupRecords.length)
    : 0;
  const totalAbsentCount = groupRecords.reduce((sum, r) => sum + (r.total_absent_days || 0), 0);

  return (
    <DashboardLayout title="Attendance Tracking" breadcrumb={['Supervisor', 'Attendance']}>
      <div className="space-y-6">
        {success && (
          <div className="flex items-center gap-2 bg-status-approved-bg border border-[#A7F3D0] text-status-approved-text px-4 py-3 rounded-lg text-body-sm font-medium">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </div>
        )}
        
        {error && (
          <div className="bg-status-rejected-bg border border-[#FECACA] text-status-rejected-text px-4 py-3 rounded-lg text-body-sm font-medium">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-h3 text-text-primary">Attendance Tracking</h2>
            <p className="text-body-sm text-text-muted mt-1">Manage scheduled day attendance for student groups by week.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewTab('students')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewTab === 'students' ? 'bg-mint-blue text-white' : 'bg-white border border-border-default text-text-primary hover:bg-surface-page'}`}
            >
              Weekly Grid
            </button>
            <button
              type="button"
              onClick={() => setViewTab('summary')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewTab === 'summary' ? 'bg-mint-blue text-white' : 'bg-white border border-border-default text-text-primary hover:bg-surface-page'}`}
            >
              Group Summary
            </button>
          </div>
        </div>

        {groups.length === 0 ? (
          <EmptyState
            title="No Student Groups Configured"
            description="You must group your assigned students and define their schedule first before you can track attendance."
          />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-surface-white p-4 rounded-lg border border-border-default shadow-level-1">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-text-primary">Select Group:</span>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="bg-surface-input border border-border-default rounded-lg px-3 py-2 text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-mint-blue"
                >
                  {groups.map(g => (
                    <option key={g.group_id} value={g.group_id}>{g.team_name || `Group ${g.group_id}`}</option>
                  ))}
                </select>
              </div>

              {currentGroup && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                  <div>
                    <span className="font-semibold text-text-primary">Internship Period: </span>
                    {currentGroup.start_date ? formatDate(currentGroup.start_date) : ''} – {currentGroup.end_date ? formatDate(currentGroup.end_date) : ''}
                  </div>
                  <div>
                    <span className="font-semibold text-text-primary">Weekly Schedule: </span>
                    <span className="capitalize">{currentGroup.attendance_days ? currentGroup.attendance_days.split(',').join(', ') : 'None'}</span>
                  </div>
                </div>
              )}
            </div>

            {viewTab === 'summary' && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  label="Students in Group"
                  value={groupRecords.length}
                  accentColor="blue"
                  icon={
                    <svg className="w-5 h-5 text-mint-steel" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  }
                />
                <StatCard
                  label="Average Attendance"
                  value={`${averageAttendance}%`}
                  accentColor={averageAttendance >= 90 ? 'green' : averageAttendance >= 75 ? 'amber' : 'red'}
                  icon={
                    <svg className="w-5 h-5 text-mint-steel" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                    </svg>
                  }
                />
                <StatCard
                  label="Total Absent Days"
                  value={totalAbsentCount}
                  accentColor={totalAbsentCount <= 5 ? 'green' : totalAbsentCount <= 12 ? 'amber' : 'red'}
                  icon={
                    <svg className="w-5 h-5 text-eth-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  }
                />
                <StatCard
                  label="Excellent Standing"
                  value={groupRecords.filter(r => r.percentage >= 90).length}
                  accentColor="green"
                  icon={
                    <svg className="w-5 h-5 text-eth-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  }
                />
              </div>
            )}

            {viewTab === 'students' && currentGroup && (
              <Card>
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border-subtle pb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-text-primary">Weekly Attendance Sheet</h3>
                      {weekStatus.status === 'active' && selectedWeek === weekStatus.currentWeek && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-status-approved-bg text-status-approved-text">
                          Current Week
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={selectedWeek <= 1}
                        onClick={() => setSelectedWeek(prev => prev - 1)}
                      >
                        &larr; Prev Week
                      </Button>
                      <span className="text-sm font-semibold text-text-primary min-w-[120px] text-center">
                        Week {selectedWeek} of {totalWeeks}
                        {weekRange.from && (
                          <span className="block text-xs font-normal text-text-muted">
                            {weekRange.from} – {weekRange.to}
                          </span>
                        )}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={selectedWeek >= totalWeeks}
                        onClick={() => setSelectedWeek(prev => prev + 1)}
                      >
                        Next Week &rarr;
                      </Button>
                    </div>
                  </div>

                  {isWeekLocked && (
                    <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-body-sm font-medium">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      {lockReason}
                    </div>
                  )}

                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner size="md" />
                    </div>
                  ) : groupRecords.length === 0 ? (
                    <EmptyState
                      title="No students assigned"
                      description="This group does not have any members assigned yet."
                    />
                  ) : (
                    <div className="overflow-x-auto border border-border-subtle rounded-lg">
                      <table className="min-w-full text-sm">
                        <thead className="bg-surface-page text-text-muted uppercase text-[11px] tracking-wider border-b border-border-default">
                          <tr>
                            <th className="px-5 py-3 text-left">Student</th>
                            {dayLabels.map((day) => (
                              <th key={day.key} className="px-4 py-3 text-center capitalize">{day.label}</th>
                            ))}
                            <th className="px-4 py-3 text-center">Present (Week)</th>
                            <th className="px-4 py-3 text-center">Absent (Week)</th>
                            <th className="px-5 py-3 text-right">Overall Attendance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle bg-white">
                          {groupRecords.map((record) => {
                            const studentWeeks = localWeeksData[record.student_id] || [];
                            const weekEntry = studentWeeks.find(w => w.week === selectedWeek);
                            const presentInWeek = scheduledDays.reduce((count, day) => {
                              const key = day.trim().toLowerCase() as keyof AttendanceWeekEntry;
                              return count + (weekEntry && weekEntry[key] === true ? 1 : 0);
                            }, 0);
                            const absentInWeek = scheduledDays.length - presentInWeek;
                            
                            const stats = calculateAttendanceStats(studentWeeks, scheduledDays, totalWeeks);

                            return (
                              <tr key={record.attendance_id} className="hover:bg-surface-page/60">
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                  <div className="font-semibold text-text-primary">{record.student_name}</div>
                                  <div className="text-xs text-text-muted">ID: {record.student_id}</div>
                                </td>
                                {dayLabels.map((day) => {
                                  const isChecked = weekEntry ? Boolean(weekEntry[day.key]) : false;
                                  return (
                                    <td key={day.key} className="px-4 py-3.5 text-center">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        disabled={isWeekLocked}
                                        onChange={(e) => handleCheckboxChange(record.student_id, day.key, e.target.checked)}
                                        className="h-5 w-5 rounded border-border-default text-mint-blue focus:ring-mint-blue cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                      />
                                    </td>
                                  );
                                })}
                                <td className="px-4 py-3.5 text-center font-medium text-status-approved-text">
                                  {presentInWeek} day{presentInWeek !== 1 ? 's' : ''}
                                </td>
                                <td className="px-4 py-3.5 text-center font-medium text-status-rejected-text">
                                  {absentInWeek} day{absentInWeek !== 1 ? 's' : ''}
                                </td>
                                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                                    stats.percentage >= 90
                                      ? 'bg-green-50 text-green-700 border border-green-200'
                                      : stats.percentage >= 75
                                      ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                      : 'bg-red-50 text-red-700 border border-red-200'
                                  }`}>
                                    {stats.percentage}% present
                                  </span>
                                  <span className="block text-[11px] text-text-muted mt-0.5">
                                    {stats.totalAbsentDays} absent day{stats.totalAbsentDays !== 1 ? 's' : ''} total
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!isWeekLocked && groupRecords.length > 0 && (
                    <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
                      {hasChanges && (
                        <span className="self-center text-xs text-amber-600 font-medium">
                          You have unsaved changes in this sheet.
                        </span>
                      )}
                      <Button
                        variant="secondary"
                        disabled={isSaving || !hasChanges}
                        onClick={() => {
                          const initialLocalData: Record<string, AttendanceWeekEntry[]> = {};
                          groupRecords.forEach(r => {
                            initialLocalData[r.student_id] = normalizeWeeksToCount(r.weeks, totalWeeks);
                          });
                          setLocalWeeksData(initialLocalData);
                          setHasChanges(false);
                        }}
                      >
                        Reset Changes
                      </Button>
                      <Button
                        variant="primary"
                        isLoading={isSaving}
                        disabled={isSaving || !hasChanges}
                        onClick={handleSaveAll}
                      >
                        Save Week Attendance
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
