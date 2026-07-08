// Attendance Types - SDD §6.6
export interface AttendanceWeekEntry {
  week: number;
  from: string | null;
  to: string | null;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
}

export interface Attendance {
  attendance_id: number;
  internship_id: number;
  student_id: string;
  month: number;
  year: number;
  weeks: AttendanceWeekEntry[];
  total_absent_days: number;
  percentage: number; // 0-100
  marked_by: string; // supervisor user_id
  updated_at: string;
  student_name?: string;
  supervisor_name?: string;
  group_id?: string | null;
  group_name?: string | null;
  group_start_date?: string | null;
  group_end_date?: string | null;
  group_attendance_days?: string | null;
}

export interface AttendanceInput {
  internship_id: number;
  student_id: string;
  month: number;
  year: number;
  weeks: AttendanceWeekEntry[];
  total_absent_days: number;
}
