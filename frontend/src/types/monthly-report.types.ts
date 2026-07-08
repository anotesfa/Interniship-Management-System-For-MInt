// Monthly Report Types - SDD §5.3.5
export enum MonthlyReportStatus {
  SUBMITTED = 'submitted',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  RETURNED = 'returned'
}

export interface MonthlyReport {
  report_id: number;
  internship_id: number;
  student_id: string;
  month: number; // 1-12
  year: number;
  summary: string;
  submitted_at: string;
  reviewed_by?: string;
  reviewer_name?: string;
  status: MonthlyReportStatus;
  feedback?: string;
  student_name?: string;
  group_name?: string; // Group name for display instead of student name
}

export interface MonthlyReportInput {
  internship_id: number;
  student_id: string;
  month: number;
  year: number;
  summary: string;
}

export interface MonthlyReportReview {
  report_id: number;
  status: MonthlyReportStatus;
  feedback?: string;
}
