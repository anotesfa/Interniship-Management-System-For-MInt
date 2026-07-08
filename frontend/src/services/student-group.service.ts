import { apiService } from './api.service';
import { ApiEnvelope, unwrapEnvelope } from '../utils/api-envelope';
import { StudentGroupStatus, StudentGroupSummary } from '../types/student-group.types';

class StudentGroupService {
  async getMyGroup(): Promise<StudentGroupStatus> {
    const response = await apiService.get<ApiEnvelope<StudentGroupStatus>>('/student-groups/my');
    return unwrapEnvelope(response.data);
  }

  async getMySupervisorGroups(): Promise<StudentGroupSummary[]> {
    const response = await apiService.get<ApiEnvelope<StudentGroupSummary[]>>('/student-groups/supervisor/my');
    return unwrapEnvelope(response.data);
  }

  async createGroup(data: {
    supervisorId?: number;
    studentIds: number[];
    leaderStudentId: number;
    teamName?: string;
    startDate?: string;
    endDate?: string;
    attendanceDays?: string;
  }): Promise<StudentGroupSummary> {
    const response = await apiService.post<ApiEnvelope<StudentGroupSummary>>('/student-groups', data);
    return unwrapEnvelope(response.data);
  }

  async updateGroup(groupId: string | number, data: {
    studentIds: number[];
    leaderStudentId: number;
    teamName?: string;
    startDate?: string;
    endDate?: string;
    attendanceDays?: string;
  }): Promise<StudentGroupSummary> {
    const response = await apiService.patch<ApiEnvelope<StudentGroupSummary>>(`/student-groups/${groupId}`, data);
    return unwrapEnvelope(response.data);
  }

  async deleteGroup(groupId: string | number): Promise<{ success: boolean }> {
    const response = await apiService.delete<ApiEnvelope<{ success: boolean }>>(`/student-groups/${groupId}`);
    return unwrapEnvelope(response.data);
  }
}

export const studentGroupService = new StudentGroupService();
