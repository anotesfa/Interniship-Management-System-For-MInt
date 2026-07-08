import { InternshipApplication } from '../../types';
import { Card, EmptyState, Input } from '../common';
import {
  StudentRosterTab,
  StudentRosterFilters,
  getAvailableYears,
} from '../../utils/student-roster';

interface StudentRosterPanelProps {
  students: InternshipApplication[];
  tab: StudentRosterTab;
  onTabChange: (tab: StudentRosterTab) => void;
  filters: StudentRosterFilters;
  onFiltersChange: (filters: StudentRosterFilters) => void;
  emptyTitle: string;
  emptyDescription: string;
  availableYears?: number[];
  renderActions?: (student: InternshipApplication) => React.ReactNode;
}

export function StudentRosterPanel({
  students,
  tab,
  onTabChange,
  filters,
  onFiltersChange,
  emptyTitle,
  emptyDescription,
  availableYears,
  renderActions,
}: StudentRosterPanelProps) {
  const years = availableYears ?? getAvailableYears(students);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex rounded-lg border border-border-default overflow-hidden w-fit">
          <button
            type="button"
            onClick={() => onTabChange('enrolled')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'enrolled'
                ? 'bg-mint-navy text-white'
                : 'bg-white text-text-muted hover:text-text-primary'
            }`}
          >
            Currently Enrolled
          </button>
          <button
            type="button"
            onClick={() => onTabChange('past')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'past'
                ? 'bg-mint-navy text-white'
                : 'bg-white text-text-muted hover:text-text-primary'
            }`}
          >
            Past Students
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <Input
            label="Search by name"
            value={filters.name}
            onChange={(e) => onFiltersChange({ ...filters, name: e.target.value })}
            placeholder="Name, ID, or department..."
            className="sm:w-56"
          />
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Year</label>
            <select
              value={filters.year}
              onChange={(e) => onFiltersChange({ ...filters, year: e.target.value })}
              className="w-full sm:w-36 px-3 py-2 border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-mint-blue"
            >
              <option value="all">All years</option>
              {years.map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {students.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Student Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    GPA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  {renderActions && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.application_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.student_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {student.student_institutional_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {student.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(student.created_at).getFullYear()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {student.gpa ? student.gpa.toFixed(2) : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {student.institutional_email || '—'}
                    </td>
                    {renderActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {renderActions(student)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
