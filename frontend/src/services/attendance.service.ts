// Attendance Service
import { apiService } from './api.service';
import { Attendance } from '../types/attendance.types';
import { ApiEnvelope, unwrapEnvelope } from '../utils/api-envelope';

class AttendanceService {
  // Supervisor: get attendance for all assigned students (resolves via JWT)
  async getMyStudentsAttendance(): Promise<Attendance[]> {
    const response = await apiService.get<ApiEnvelope<Attendance[]>>('/attendance/my-students');
    return unwrapEnvelope(response.data);
  }

  // Student: get own attendance
  async getMyAttendance(): Promise<Attendance[]> {
    const response = await apiService.get<ApiEnvelope<Attendance[]>>('/attendance/my');
    return unwrapEnvelope(response.data);
  }

  // Get attendance by internship ID
  async getByInternship(internshipId: number): Promise<Attendance | null> {
    const response = await apiService.get<ApiEnvelope<Attendance>>(
      `/attendance/internship/${internshipId}`,
    );
    return unwrapEnvelope(response.data);
  }

  // Supervisor: record attendance for a student
  async recordAttendance(data: {
    internshipId: number;
    studentId: number;
    month: number;
    year: number;
    weeks: Attendance['weeks'];
    totalAbsentDays: number;
  }): Promise<Attendance> {
    const response = await apiService.post<ApiEnvelope<Attendance>>('/attendance', data);
    return unwrapEnvelope(response.data);
  }

  // Supervisor: update attendance sheet
  async updateAttendance(attendanceId: number, data: {
    month?: number;
    year?: number;
    weeks?: Attendance['weeks'];
    totalAbsentDays?: number;
    percentage?: number;
  }): Promise<Attendance> {
    const response = await apiService.put<ApiEnvelope<Attendance>>(
      `/attendance/${attendanceId}`,
      data,
    );
    return unwrapEnvelope(response.data);
  }
}

export const attendanceService = new AttendanceService();
