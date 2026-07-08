import { InternshipApplication, ApplicationStatus } from '../types';

export type StudentRosterTab = 'enrolled' | 'past';

export interface StudentRosterFilters {
  name: string;
  year: string;
}

export function getApplicationYear(app: InternshipApplication): number {
  const sourceDate = app.reviewed_at || app.created_at;
  return new Date(sourceDate).getFullYear();
}

export function getAvailableYears(applications: InternshipApplication[]): number[] {
  const years = new Set(applications.map(getApplicationYear));
  return Array.from(years).sort((a, b) => b - a);
}

export function isCurrentlyEnrolled(app: InternshipApplication): boolean {
  const currentYear = new Date().getFullYear();
  return app.status === ApplicationStatus.APPROVED && getApplicationYear(app) >= currentYear;
}

export function isPastStudent(app: InternshipApplication): boolean {
  const currentYear = new Date().getFullYear();
  return app.status === ApplicationStatus.APPROVED && getApplicationYear(app) < currentYear;
}

export function filterStudentRoster(
  applications: InternshipApplication[],
  tab: StudentRosterTab,
  filters: StudentRosterFilters
): InternshipApplication[] {
  const approved = applications.filter((app) => app.status === ApplicationStatus.APPROVED || app.status === ApplicationStatus.EVALUATED);

  return approved
    .filter((app) => (tab === 'enrolled' ? isCurrentlyEnrolled(app) : isPastStudent(app)))
    .filter((app) => {
      if (filters.year && filters.year !== 'all') {
        return getApplicationYear(app) === Number(filters.year);
      }
      return true;
    })
    .filter((app) => {
      if (!filters.name.trim()) return true;
      const query = filters.name.trim().toLowerCase();
      return (
        app.student_name.toLowerCase().includes(query) ||
        app.student_institutional_id.toLowerCase().includes(query) ||
        app.department.toLowerCase().includes(query)
      );
    });
}
