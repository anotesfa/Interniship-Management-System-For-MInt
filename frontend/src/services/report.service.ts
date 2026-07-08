// Report Service - PDF and CSV Downloads
import { apiService } from './api.service';

class ReportService {
  private makeSafeFilename(value: string) {
    return value
      .trim()
      .replace(/[^a-z0-9\s-]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
  }

  private async downloadFile(url: string, filename: string) {
    try {
      const response = await apiService.get<Blob>(url, undefined, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data as BlobPart]);
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
    } catch (error) {
      console.error('Download failed:', error);
      const responseData = (error as any)?.response?.data;
      if (responseData instanceof Blob) {
        try {
          const messageText = await responseData.text();
          const parsed = JSON.parse(messageText);
          throw new Error(parsed.message || 'Failed to download file');
        } catch {
          // Fall through to a generic download failure message.
        }
      }

      throw new Error((error as any)?.response?.data?.message || 'Failed to download file');
    }
  }

  // Application Status Report
  async downloadApplicationStatusPDF(): Promise<void> {
    const filename = `application-status-report-${Date.now()}.pdf`;
    await this.downloadFile('/reports/application-status/pdf', filename);
  }

  // Cohort Grade Report
  async downloadCohortGradePDF(): Promise<void> {
    const filename = `cohort-grades-report-${Date.now()}.pdf`;
    await this.downloadFile('/reports/cohort-grades/pdf', filename);
  }

  async downloadCohortGradeCSV(): Promise<void> {
    const filename = `cohort-grades-report-${Date.now()}.csv`;
    await this.downloadFile('/reports/cohort-grades/csv', filename);
  }

  // Supervisor Assignment Report
  async downloadSupervisorAssignmentPDF(): Promise<void> {
    const filename = `supervisor-assignments-report-${Date.now()}.pdf`;
    await this.downloadFile('/reports/supervisor-assignments/pdf', filename);
  }

  // System Activity Report
  async downloadSystemActivityPDF(): Promise<void> {
    const filename = `system-activity-report-${Date.now()}.pdf`;
    await this.downloadFile('/reports/system-activity/pdf', filename);
  }

  async downloadStudentEvaluationPDF(
    studentId: number | string,
    studentName?: string,
  ): Promise<void> {
    const namePart = studentName ? this.makeSafeFilename(studentName) : String(studentId);
    const filename = `student-evaluation-report-${namePart}-${Date.now()}.pdf`;
    await this.downloadFile(`/reports/student-evaluation/${studentId}/pdf`, filename);
  }

  async getStudentEvaluationSubmissionStatus(studentIds: Array<number | string>): Promise<Array<{
    student_id: number;
    submitted_by_admin: boolean;
    submitted_at: string | null;
  }>> {
    const normalizedIds = studentIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (normalizedIds.length === 0) {
      return [];
    }

    const response = await apiService.get<{
      success: boolean;
      data: Array<{
        student_id: number;
        submitted_by_admin: boolean;
        submitted_at: string | null;
      }>;
    }>('/reports/student-evaluation/submission-status', {
      studentIds: normalizedIds.join(','),
    });

    return response.data?.data || [];
  }
}

export const reportService = new ReportService();
