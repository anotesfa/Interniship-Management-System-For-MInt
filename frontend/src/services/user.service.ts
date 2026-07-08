// User management service for Admin
import { apiService } from './api.service';
import { ApiEnvelope, unwrapEnvelope } from '../utils/api-envelope';

export interface SystemUser {
  user_id: number;
  full_name: string;
  email: string;
  account_status: string;
  created_at: string;
  role: {
    role_id: number;
    role_name: string;
  };
  student?: {
    student_id: number;
    department: string;
    registration_number: string;
  } | null;
  supervisor?: {
    supervisor_id: number;
    department: string;
    position: string;
    max_students: number;
  } | null;
}

export interface CreateUserDto {
  full_name: string;
  email: string;
  password: string;
  role_name: string;
  university_id?: number;
  registration_number?: string;
  department?: string;
  position?: string;
  max_students?: number;
  role_title?: string;
  gpa?: number;
}

export interface PaginatedUsers {
  data: SystemUser[];
  pagination: { total: number; limit: number; offset: number };
}

class UserService {
  async getAll(limit = 50, offset = 0): Promise<PaginatedUsers> {
    const response = await apiService.get<ApiEnvelope<SystemUser[]>>('/users', { limit, offset });
    const envelope = response.data as any;
    return {
      data: unwrapEnvelope(envelope),
      pagination: envelope.pagination ?? { total: 0, limit, offset },
    };
  }

  async getStudents(limit = 50, offset = 0): Promise<PaginatedUsers> {
    const response = await apiService.get<ApiEnvelope<SystemUser[]>>('/users/students', { limit, offset });
    const envelope = response.data as any;
    return {
      data: unwrapEnvelope(envelope),
      pagination: envelope.pagination ?? { total: 0, limit, offset },
    };
  }

  async getSupervisors(limit = 50, offset = 0): Promise<PaginatedUsers> {
    const response = await apiService.get<ApiEnvelope<SystemUser[]>>('/users/supervisors', { limit, offset });
    const envelope = response.data as any;
    return {
      data: unwrapEnvelope(envelope),
      pagination: envelope.pagination ?? { total: 0, limit, offset },
    };
  }

  async getById(userId: number): Promise<SystemUser> {
    const response = await apiService.get<ApiEnvelope<SystemUser>>(`/users/${userId}`);
    return unwrapEnvelope(response.data);
  }

  async create(data: CreateUserDto): Promise<SystemUser> {
    const response = await apiService.post<ApiEnvelope<SystemUser>>('/users', data);
    return unwrapEnvelope(response.data);
  }

  async update(userId: number, data: Partial<CreateUserDto & { account_status: string }>): Promise<SystemUser> {
    const response = await apiService.put<ApiEnvelope<SystemUser>>(`/users/${userId}`, data);
    return unwrapEnvelope(response.data);
  }

  async delete(userId: number): Promise<void> {
    await apiService.delete(`/users/${userId}`);
  }

  async lockAccount(userId: number): Promise<void> {
    await apiService.post(`/users/${userId}/lock`);
  }

  async unlockAccount(userId: number): Promise<void> {
    await apiService.post(`/users/${userId}/unlock`);
  }

  async resetPassword(userId: number): Promise<void> {
    await apiService.post(`/users/${userId}/reset-password`);
  }
}

export const userService = new UserService();
