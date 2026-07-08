// Evaluation types based on SRS
export enum EvaluationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  PUBLISHED = 'published',
  RETURNED = 'returned',
}

export enum LetterGrade {
  A_PLUS = 'A+',
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  F = 'F'
}

export interface Evaluation {
  evaluation_id: string | number;
  student_id: string | number;
  student_name?: string;
  supervisor_id: string | number;
  supervisor_name?: string;
  assignment_id?: string;
  
  // New Metrics Structure (18 granular fields + 3 totals)
  // General Performance (25%)
  punctuality_score?: number;
  reliability_score?: number;
  independence_score?: number;
  communication_score?: number;
  professionalism_score?: number;
  general_performance_total?: number;
  
  // Personal Skills (25%)
  speed_of_work_score?: number;
  accuracy_score?: number;
  engagement_score?: number;
  need_for_work_score?: number;
  cooperation_score?: number;
  personal_skills_total?: number;
  
  // Professional Skills (50%)
  technical_skills_score?: number;
  organizational_skills_score?: number;
  project_support_score?: number;
  responsibility_score?: number;
  team_quality_score?: number;
  professional_skills_total?: number;
  
  // Attendance
  attendance_percentage?: number;
  total_absent_days?: number;
  // Weekly attendance sheet (optional, used by frontend to derive summaries)
  weeks?: import('./attendance.types').AttendanceWeekEntry[];
  
  // Overall
  total_score?: number;
  grade: string;
  remarks: string;
  status: EvaluationStatus | string;
  submitted_at?: string;
  published_at?: string;
  published_by?: string | number;
  
  // Backward compatibility with old fields
  score?: number;
  attendance_rating?: number;
  technical_rating?: number;
  teamwork_rating?: number;
  communication_rating?: number;
  initiative_rating?: number;
  final_grade?: string;
}

export interface EvaluationFormData {
  student_id?: number | string;
  
  // General Performance (25%)
  punctuality_score?: number;
  reliability_score?: number;
  independence_score?: number;
  communication_score?: number;
  professionalism_score?: number;
  
  // Personal Skills (25%)
  speed_of_work_score?: number;
  accuracy_score?: number;
  engagement_score?: number;
  need_for_work_score?: number;
  cooperation_score?: number;
  
  // Professional Skills (50%)
  technical_skills_score?: number;
  organizational_skills_score?: number;
  project_support_score?: number;
  responsibility_score?: number;
  team_quality_score?: number;
  
  // Attendance
  attendance_percentage?: number;
  total_absent_days?: number;
  // Weekly attendance embedded in the form
  weeks?: import('./attendance.types').AttendanceWeekEntry[];
  group_start_date?: string | null;
  group_end_date?: string | null;
  group_attendance_days?: string | null;
  
  // Overall
  grade: string;
  remarks: string;
  
  // Backward compatibility
  score?: number;
  attendance_rating?: number;
  technical_rating?: number;
  teamwork_rating?: number;
  communication_rating?: number;
  initiative_rating?: number;
}
