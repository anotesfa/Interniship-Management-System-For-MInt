// User role types based on SRS
export enum UserRole {
  ADMIN = 'admin',
  UNIVERSITY = 'university',
  SUPERVISOR = 'supervisor',
  STUDENT = 'student'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LOCKED = 'locked'
}

export interface User {
  user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
