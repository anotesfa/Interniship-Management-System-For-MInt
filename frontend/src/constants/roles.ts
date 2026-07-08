export const ROLE_LABELS = {
  ADMIN: 'Admin',
  UNIVERSITY_COORDINATOR: 'University Coordinator',
  SUPERVISOR: 'Supervisor',
  STUDENT: 'Student',
} as const;

export type RoleLabel = typeof ROLE_LABELS[keyof typeof ROLE_LABELS];

export default ROLE_LABELS;
