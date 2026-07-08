// Application service for University Users and Admins
import { apiService } from './api.service';
import { InternshipApplication, ApplicationFormData } from '../types';
import { ApiEnvelope, unwrapEnvelope } from '../utils/api-envelope';

export interface ApprovedStudent {
  application_id: number;
  student_id: number;
  student_name: string;
  department: string;
  registration_number: string;
  internship_id: number | null;
  internship_status: string | null;
  assignment: {
    assignment_id: number;
    supervisor_name: string;
    supervisor_id: number;
    status: string;
  } | null;
}

class ApplicationService {
  async submitApplication(formData: ApplicationFormData): Promise<InternshipApplication> {
    const data = new FormData();
    data.append('student_name', formData.student_name);
    data.append('department', formData.department);
    if (formData.gpa > 0) {
      data.append('gpa', formData.gpa.toString());
    }
    data.append('institutional_email', formData.institutional_email.trim());
    if (formData.internship_start_date) {
      data.append('internship_start_date', formData.internship_start_date);
    }
    if (formData.internship_end_date) {
      data.append('internship_end_date', formData.internship_end_date);
    }

    if (formData.transcript) data.append('transcript', formData.transcript);
    if (formData.request_letter) data.append('request_letter', formData.request_letter);
    if (formData.recommendation_letter) data.append('recommendation_letter', formData.recommendation_letter);

    const response = await apiService.postFormData<ApiEnvelope<InternshipApplication>>(
      '/applications',
      data
    );
    return unwrapEnvelope(response.data);
  }

  async saveDraft(formData: Partial<ApplicationFormData>): Promise<InternshipApplication> {
    const response = await apiService.post<ApiEnvelope<InternshipApplication>>('/applications/draft', formData);
    return unwrapEnvelope(response.data);
  }

  async getMyApplications(): Promise<InternshipApplication[]> {
    const response = await apiService.get<ApiEnvelope<InternshipApplication[]>>('/applications/my');
    return unwrapEnvelope(response.data);
  }

  async getPendingApplications(): Promise<InternshipApplication[]> {
    const response = await apiService.get<ApiEnvelope<InternshipApplication[]>>('/applications/pending');
    return unwrapEnvelope(response.data);
  }

  async getAllApplications(status?: string): Promise<InternshipApplication[]> {
    const params = status ? { status } : {};
    const response = await apiService.get<ApiEnvelope<InternshipApplication[]>>('/applications', params);
    return unwrapEnvelope(response.data);
  }

  async getApplicationById(applicationId: string): Promise<InternshipApplication> {
    const response = await apiService.get<ApiEnvelope<InternshipApplication>>(`/applications/${applicationId}`);
    return unwrapEnvelope(response.data);
  }

  async approveApplication(applicationId: string): Promise<InternshipApplication> {
    const response = await apiService.post<ApiEnvelope<InternshipApplication>>(
      `/applications/${applicationId}/approve`
    );
    return unwrapEnvelope(response.data);
  }

  async rejectApplication(applicationId: string, reason: string): Promise<InternshipApplication> {
    const response = await apiService.post<ApiEnvelope<InternshipApplication>>(
      `/applications/${applicationId}/reject`,
      { rejection_reason: reason }
    );
    return unwrapEnvelope(response.data);
  }

  async holdApplication(applicationId: string, comment: string): Promise<InternshipApplication> {
    const response = await apiService.post<ApiEnvelope<InternshipApplication>>(
      `/applications/${applicationId}/hold`,
      { hold_comment: comment }
    );
    return unwrapEnvelope(response.data);
  }

  async downloadDocument(documentId: string, filename?: string): Promise<void> {
    const response = await apiService.get(`/documents/${documentId}/download`, undefined, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data as BlobPart]);
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename || `document-${documentId}`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
  }

  async getApplicationStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    on_hold: number;
  }> {
    const response = await apiService.get<ApiEnvelope<{
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      on_hold: number;
    }>>('/applications/stats');
    return unwrapEnvelope(response.data);
  }

  async getApprovedStudents(): Promise<ApprovedStudent[]> {
    const response = await apiService.get<ApiEnvelope<ApprovedStudent[]>>('/applications/approved-students');
    return unwrapEnvelope(response.data);
  }
}

export const applicationService = new ApplicationService();
