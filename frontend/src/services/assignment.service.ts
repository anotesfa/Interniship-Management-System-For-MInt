// Assignment service for Admins
import { apiService } from './api.service';
import { InternshipAssignment, Supervisor } from '../types';
import { ApiEnvelope, unwrapEnvelope } from '../utils/api-envelope';

class AssignmentService {
  // Admin: Get available supervisors (FR-SUP-001, FR-SUP-002)
  async getAvailableSupervisors(): Promise<Supervisor[]> {
    const response = await apiService.get<ApiEnvelope<Supervisor[]>>('/assignments/available-supervisors');
    return unwrapEnvelope(response.data);
  }

  // Admin: Assign supervisor to student (FR-SUP-003, FR-SUP-004)
  async assignSupervisor(data: {
    supervisorId: number;
    internshipId?: number;
    studentId?: number;
    applicationId?: number;
  }): Promise<InternshipAssignment> {
    const response = await apiService.post<ApiEnvelope<InternshipAssignment>>('/assignments', data);
    return unwrapEnvelope(response.data);
  }

  // Admin: Reassign supervisor (FR-SUP-006)
  async reassignSupervisor(
    assignmentId: number,
    newSupervisorId: number,
  ): Promise<InternshipAssignment> {
    const response = await apiService.put<ApiEnvelope<InternshipAssignment>>(
      `/assignments/${assignmentId}`,
      { newSupervisorId },
    );
    return unwrapEnvelope(response.data);
  }

  // Admin: Update assignment status
  async updateStatus(assignmentId: number, status: string): Promise<InternshipAssignment> {
    const response = await apiService.put<ApiEnvelope<InternshipAssignment>>(
      `/assignments/${assignmentId}/status`,
      { status },
    );
    return unwrapEnvelope(response.data);
  }

  // Get assignment by student ID
  async getByStudent(studentId: number): Promise<InternshipAssignment | null> {
    try {
      const response = await apiService.get<ApiEnvelope<InternshipAssignment>>(
        `/assignments/student/${studentId}`,
      );
      return unwrapEnvelope(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  // Supervisor: Get my assigned students — uses JWT to resolve supervisor (FR-SUP-005)
  async getMyAssignedStudents(): Promise<InternshipAssignment[]> {
    const response = await apiService.get<ApiEnvelope<InternshipAssignment[]>>(
      '/assignments/my-students',
    );
    return unwrapEnvelope(response.data);
  }

  // Student: Get own assignment (resolves via JWT on backend)
  async getMyAssignment(): Promise<InternshipAssignment | null> {
    try {
      const response = await apiService.get<ApiEnvelope<InternshipAssignment>>(
        '/assignments/my',
      );
      return unwrapEnvelope(response.data);
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  }

  // Admin: Get all assignments
  async getAllAssignments(): Promise<InternshipAssignment[]> {
    const response = await apiService.get<ApiEnvelope<InternshipAssignment[]>>('/assignments');
    return unwrapEnvelope(response.data);
  }

  // Admin/University Coordinator: Get students assigned to a specific supervisor
  async getStudentsBySupervisor(supervisorId: number): Promise<InternshipAssignment[]> {
    const response = await apiService.get<ApiEnvelope<InternshipAssignment[]>>(
      `/assignments/supervisor/${supervisorId}`,
    );
    return unwrapEnvelope(response.data);
  }
}

export const assignmentService = new AssignmentService();

