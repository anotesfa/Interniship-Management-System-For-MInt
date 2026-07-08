// University User - Students Page
import { useEffect, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner, EmptyState, StatusBadge, Modal, Button } from '../../components/common';
import { InternshipApplication } from '../../types';
import { applicationService } from '../../services';
import {
  StudentRosterTab, StudentRosterFilters,
  filterStudentRoster, getAvailableYears,
} from '../../utils/student-roster';

export default function UniversityStudentsPage() {
  const [allStudents, setAllStudents] = useState<InternshipApplication[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [tab, setTab]                 = useState<StudentRosterTab>('enrolled');
  const [filters, setFilters]         = useState<StudentRosterFilters>({ name: '', year: 'all' });
  const [selectedStudent, setSelected] = useState<InternshipApplication | null>(null);

  useEffect(() => { loadStudents(); }, []);

  const loadStudents = async () => {
    setIsLoading(true);
    try { const data = await applicationService.getMyApplications(); setAllStudents(data); }
    catch (error) { console.error('Failed to load students:', error); }
    finally { setIsLoading(false); }
  };

  const filtered = filterStudentRoster(allStudents, tab, filters);
  const years    = getAvailableYears(allStudents);

  const TABS: { value: StudentRosterTab; label: string }[] = [
    { value: 'enrolled', label: 'Currently Enrolled' },
    { value: 'past',     label: 'Past Students'      },
  ];

  return (
    <DashboardLayout title="My Students" breadcrumb={['University', 'Students']}>
      <div className="space-y-6">

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border-default">
          {TABS.map((t) => {
            const count    = filterStudentRoster(allStudents, t.value, { name: '', year: 'all' }).length;
            const isActive = tab === t.value;
            return (
              <button key={t.value} onClick={() => setTab(t.value)}
                className={`flex items-center gap-2 px-4 py-3 text-body-sm font-semibold border-b-2 whitespace-nowrap transition-all ${isActive ? 'border-mint-navy text-mint-navy' : 'border-transparent text-text-muted hover:text-text-primary'}`}
              >
                {t.label}
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-mint-navy text-white' : 'bg-surface-page text-text-muted'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search by name..."
            value={filters.name}
            onChange={(e) => setFilters(f => ({ ...f, name: e.target.value }))}
            className="flex-1 min-w-[200px] bg-surface-input border border-border-default rounded-lg px-4 py-2.5 text-body focus:outline-none focus:ring-2 focus:ring-mint-blue"
          />
          <select
            value={filters.year}
            onChange={(e) => setFilters(f => ({ ...f, year: e.target.value }))}
            className="bg-surface-input border border-border-default rounded-lg px-4 py-2.5 text-body focus:outline-none focus:ring-2 focus:ring-mint-blue"
          >
            <option value="all">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" text="Loading students..." /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={tab === 'enrolled' ? 'No enrolled students' : 'No past students'}
            description={tab === 'enrolled' ? 'Approved students for the current year appear here.' : 'Past students appear here after completing internships.'}
          />
        ) : (
          <div className="bg-white rounded-xl border border-border-default shadow-level-1 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-surface-page">
                    {['Student', 'Department', 'Year', 'Status', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-label uppercase tracking-wider text-text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s.application_id || i} className="border-b border-border-subtle hover:bg-mint-pale transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-mint-pale text-mint-navy flex items-center justify-center font-bold text-body-sm flex-shrink-0">
                            {(s.student_name || 'S').charAt(0)}
                          </div>
                          <div>
                            <p className="text-body-sm font-semibold text-text-primary">{s.student_name}</p>
                            <p className="text-caption text-text-muted">{s.student_email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-body-sm text-text-muted">{s.department || '—'}</td>
                      <td className="px-5 py-4 text-body-sm text-text-muted">{s.academic_year || '—'}</td>
                      <td className="px-5 py-4"><StatusBadge status={s.status} /></td>
                      <td className="px-5 py-4">
                        <Button variant="ghost" size="sm" onClick={() => setSelected(s)}>View Details</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <Modal isOpen={!!selectedStudent} onClose={() => setSelected(null)} title={selectedStudent.student_name || 'Student'} subtitle="Student Details" size="md">
          <div className="space-y-1">
            {[
              { label: 'Full Name',     value: selectedStudent.student_name },
              { label: 'Email',         value: selectedStudent.student_email },
              { label: 'Department',    value: selectedStudent.department },
              { label: 'Academic Year', value: selectedStudent.academic_year },
              { label: 'Status',        value: null, badge: selectedStudent.status },
            ].map(({ label, value, badge }) => (
              <div key={label} className="flex justify-between items-center py-3 border-b border-border-subtle last:border-0">
                <span className="text-body-sm text-text-muted">{label}</span>
                {badge
                  ? <StatusBadge status={badge} />
                  : <span className="text-body-sm font-semibold text-text-primary">{value || '—'}</span>
                }
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-5 border-t border-border-subtle mt-2">
            <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}