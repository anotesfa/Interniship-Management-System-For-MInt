import { User, UserRole, UserStatus } from '../types';

const ROLE_MAP: Record<string, UserRole> = {
  Admin: UserRole.ADMIN,
  admin: UserRole.ADMIN,
  'University Coordinator': UserRole.UNIVERSITY,
  university: UserRole.UNIVERSITY,
  Supervisor: UserRole.SUPERVISOR,
  supervisor: UserRole.SUPERVISOR,
  Student: UserRole.STUDENT,
  student: UserRole.STUDENT,
};

export interface ApiAuthUser {
  id: number | string;
  email: string;
  name: string;
  role: string;
}

export function mapApiUser(apiUser: ApiAuthUser): User {
  return {
    user_id: String(apiUser.id),
    full_name: apiUser.name,
    email: apiUser.email,
    role: ROLE_MAP[apiUser.role] ?? UserRole.STUDENT,
    status: UserStatus.ACTIVE,
    created_at: new Date().toISOString(),
  };
}
