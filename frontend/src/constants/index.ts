// Application constants based on SRS

export const APP_NAME = 'MInT Internship Management System';

export const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export const MAX_FILE_SIZE_MB = 10;

export const ALLOWED_FILE_TYPES = {
  DOCUMENTS: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

export const MIN_LENGTHS = {
  MILESTONE_DESCRIPTION: 50,
  REJECTION_REASON: 20,
  EVALUATION_REMARKS: 100,
  PASSWORD: 8,
};

export const RATING_SCALE = {
  MIN: 1,
  MAX: 5,
};

export const SUPERVISOR_MAX_STUDENTS = 10;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  
  // Admin routes
  ADMIN_APPLICATIONS: '/admin/applications',
  ADMIN_ASSIGNMENTS: '/admin/assignments',
  ADMIN_EVALUATIONS: '/admin/evaluations',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_USERS: '/admin/users',
  ADMIN_AUDIT: '/admin/audit',
  ADMIN_MESSAGES: '/admin/messages',
  ADMIN_SUPERVISOR_MESSAGES: '/admin/supervisor-messages',
  
  // University routes
  UNIVERSITY_APPLICATIONS: '/university/applications',
  UNIVERSITY_STUDENTS: '/university/students',
  UNIVERSITY_REPORTS: '/university/reports',
  UNIVERSITY_MESSAGES: '/university/messages',
  
  // Supervisor routes
  SUPERVISOR_STUDENTS: '/supervisor/students',
  SUPERVISOR_MILESTONES: '/supervisor/milestones',
  SUPERVISOR_EVALUATIONS: '/supervisor/evaluations',
  SUPERVISOR_EVALUATION_FORM: '/supervisor/evaluations/form',
  SUPERVISOR_MESSAGES: '/supervisor/messages',
  SUPERVISOR_ADMIN_MESSAGES: '/supervisor/admin-messages',
  SUPERVISOR_ATTENDANCE: '/supervisor/attendance',
  SUPERVISOR_MONTHLY_REPORTS: '/supervisor/monthly-reports',
  
  // Student routes
  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_MEMBER_DASHBOARD: '/student/member-dashboard',
  STUDENT_MILESTONES: '/student/milestones',
  STUDENT_MESSAGES: '/student/messages',
  STUDENT_EVALUATION: '/student/evaluation',
  STUDENT_MONTHLY_REPORTS: '/student/monthly-reports',
};

export const LETTER_GRADES = ['A', 'B', 'C', 'D', 'F'] as const;

export const EVALUATION_CRITERIA = [
  { key: 'attendance_rating', label: 'Attendance and Punctuality' },
  { key: 'technical_rating', label: 'Technical Performance and Quality of Work' },
  { key: 'teamwork_rating', label: 'Teamwork and Collaboration' },
  { key: 'communication_rating', label: 'Communication Skills' },
  { key: 'initiative_rating', label: 'Initiative and Professional Conduct' },
];

export const DOCUMENT_TYPES = {
  TRANSCRIPT: 'transcript',
  REQUEST_LETTER: 'request_letter',
  RECOMMENDATION_LETTER: 'recommendation_letter',
  MILESTONE_REPORT: 'milestone_report',
  EVALUATION: 'evaluation',
};
