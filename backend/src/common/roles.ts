export const ROLES = {
  ADMIN: 'Admin',
  UNIVERSITY_COORDINATOR: 'University Coordinator',
  SUPERVISOR: 'Supervisor',
  STUDENT: 'Student',
} as const;

export type RoleName = typeof ROLES[keyof typeof ROLES];

export default ROLES;
