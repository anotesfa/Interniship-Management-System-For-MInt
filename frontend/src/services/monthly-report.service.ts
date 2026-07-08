// Monthly Report Service
import { apiService } from './api.service';
import { MonthlyReport, MonthlyReportReview } from '../types/monthly-report.types';
import { ApiEnvelope, unwrapEnvelope } from '../utils/api-envelope';
import { extractErrorMessage } from '../utils/error-handler';

export interface SubmitReportPayload {
  month: number;
  year: number;
  summary: string;
}

class MonthlyReportService {
  // Student: get own reports (resolves via JWT)
  async getMyReports(): Promise<MonthlyReport[]> {
    try {
      const response = await apiService.get<ApiEnvelope<MonthlyReport[]>>('/monthly-reports/my');
      return unwrapEnvelope(response.data);
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  // Supervisor: get reports for all assigned students (resolves via JWT)
  async getMySupervisorReports(): Promise<MonthlyReport[]> {
    try {
      const response = await apiService.get<ApiEnvelope<MonthlyReport[]>>('/monthly-reports/supervisor/my');
      return unwrapEnvelope(response.data);
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  // Student: submit a new report
  async submitReport(data: SubmitReportPayload): Promise<MonthlyReport> {
    try {
      const response = await apiService.post<ApiEnvelope<MonthlyReport>>('/monthly-reports', data);
      return unwrapEnvelope(response.data);
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  // Supervisor: review a report (approve / return)
  async reviewReport(data: MonthlyReportReview): Promise<MonthlyReport> {
    try {
      const response = await apiService.put<ApiEnvelope<MonthlyReport>>(
        `/monthly-reports/${data.report_id}/review`,
        { status: data.status, feedback: data.feedback },
      );
      return unwrapEnvelope(response.data);
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  // Get reports by student ID (admin/supervisor use)
  async getStudentReports(studentId: string): Promise<MonthlyReport[]> {
    try {
      const response = await apiService.get<ApiEnvelope<MonthlyReport[]>>(
        `/monthly-reports/student/${studentId}`,
      );
      return unwrapEnvelope(response.data);
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }

  // Get reports by internship ID
  async getInternshipReports(internshipId: number): Promise<MonthlyReport[]> {
    try {
      const response = await apiService.get<ApiEnvelope<MonthlyReport[]>>(
        `/monthly-reports/internship/${internshipId}`,
      );
      return unwrapEnvelope(response.data);
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }
}

export const monthlyReportService = new MonthlyReportService();
