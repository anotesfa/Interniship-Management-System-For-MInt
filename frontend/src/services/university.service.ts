// University service for signup, approval workflow, and bulk applications
import { apiService } from './api.service';
import { ApiEnvelope, unwrapEnvelope } from '../utils/api-envelope';

export interface UniversitySignupData {
  name: string;
  contact_email: string;
  address: string;
  contact_person_name: string;
  contact_person_email: string;
  password: string;
}

export interface University {
  university_id: number;
  name: string;
  contact_email: string;
  address: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  rejected_reason?: string;
  approved_at?: string;
  created_at: string;
  contact_person?: {
    user_id: string;
    full_name: string;
    email: string;
  };
}

export interface BulkApplicationResponse {
  application_id: number;
  bulk_application_id: number;
  status: string;
  total_records: number;
  message: string;
}

export interface BulkStudentRecord {
  full_name: string;
  email: string;
  registration_number: string;
  department: string;
  gpa?: number | string | null;
}

export interface BulkApplicationStatus {
  bulk_application_id: number;
  application_id: number;
  status: string;
  total_records: number;
  processed_records: number;
  failed_records: number;
  file_name: string;
  submission_date: string;
  documents?: Array<{
    document_id: string;
    document_type: string;
    file_name: string;
    file_path: string;
    uploaded_at: string;
    uploaded_by_name?: string;
    uploaded_by_email?: string;
  }>;
  errors: Array<{
    index: number;
    email: string;
    error: string;
  }>;
  students: Array<{
    student_id: number;
    full_name: string;
    email: string;
    registration_number: string;
    department: string;
    gpa?: number;
  }>;
}

export interface BulkApplicationListItem {
  bulk_application_id: number;
  application_id: number;
  status: string;
  total_records: number;
  processed_records: number;
  failed_records: number;
  file_name: string;
  submission_date: string;
  student_count?: number;
}

export interface TemplateItem {
  template_id: number;
  template_name: string;
  file_name: string;
  file_type: string;
  uploaded_at: string;
  uploaded_by_name: string;
  uploaded_by_email: string;
}

class UniversityService {
  // University Registration (Public - No Auth Required)
  async signupUniversity(data: UniversitySignupData): Promise<University> {
    const response = await apiService.post<ApiEnvelope<University>>(
      '/universities/signup',
      data
    );
    return unwrapEnvelope(response.data);
  }

  // Get All Universities (Admin Only)
  async getAllUniversities(status?: 'pending' | 'approved' | 'rejected' | 'all'): Promise<University[]> {
    const params = status ? { status } : {};
    const response = await apiService.get<ApiEnvelope<University[]>>(
      '/universities',
      params
    );
    return unwrapEnvelope(response.data);
  }

  // Get Pending Universities (Admin Only)
  async getPendingUniversities(): Promise<University[]> {
    const response = await apiService.get<ApiEnvelope<University[]>>(
      '/universities/pending'
    );
    return unwrapEnvelope(response.data);
  }

  // Get Single University
  async getUniversity(universityId: number): Promise<University> {
    const response = await apiService.get<ApiEnvelope<University>>(
      `/universities/${universityId}`
    );
    return unwrapEnvelope(response.data);
  }

  // Approve University (Admin Only)
  async approveUniversity(universityId: number): Promise<University> {
    const response = await apiService.post<ApiEnvelope<University>>(
      '/universities/approve',
      { university_id: universityId }
    );
    return unwrapEnvelope(response.data);
  }

  // Reject University (Admin Only)
  async rejectUniversity(universityId: number, rejectedReason: string): Promise<University> {
    const response = await apiService.post<ApiEnvelope<University>>(
      '/universities/reject',
      { university_id: universityId, rejected_reason: rejectedReason }
    );
    return unwrapEnvelope(response.data);
  }

  // Check if University is Approved
  async isUniversityApproved(universityId: number): Promise<boolean> {
    try {
      const response = await apiService.get<ApiEnvelope<{ university_id: number; is_approved: boolean }>>(
        `/universities/${universityId}/status`
      );
      const data = unwrapEnvelope(response.data);
      return data.is_approved;
    } catch {
      return false;
    }
  }

  // Submit Bulk Application (request letter + student list)
  async submitBulkApplication(
    requestLetter: File,
    students: BulkStudentRecord[],
  ): Promise<BulkApplicationResponse> {
    const formData = new FormData();
    formData.append('request_letter', requestLetter);
    formData.append('students', JSON.stringify(students));

    const response = await apiService.postFormData<ApiEnvelope<BulkApplicationResponse>>(
      '/applications/bulk/submit',
      formData
    );
    return unwrapEnvelope(response.data);
  }

  // Get Bulk Application Status
  async getBulkApplicationStatus(bulkApplicationId: number): Promise<BulkApplicationStatus> {
    const response = await apiService.get<ApiEnvelope<BulkApplicationStatus>>(
      `/applications/bulk/${bulkApplicationId}/status`
    );
    return unwrapEnvelope(response.data);
  }

  // Get All Bulk Applications for the logged-in university coordinator
  async getMyUniversityBulkApplications(): Promise<BulkApplicationListItem[]> {
    const response = await apiService.get<ApiEnvelope<BulkApplicationListItem[]>>(
      '/applications/bulk/my'
    );
    return unwrapEnvelope(response.data);
  }

  // Get All Bulk Applications for University (admin use)
  async getUniversityBulkApplications(universityId: number): Promise<BulkApplicationListItem[]> {
    const response = await apiService.get<ApiEnvelope<BulkApplicationListItem[]>>(
      `/applications/bulk/university/${universityId}`
    );
    return unwrapEnvelope(response.data);
  }

  // ─── TEMPLATE METHODS ────────────────────────────────────────────────────

  // Get all templates (authenticated users)
  async getTemplates(): Promise<TemplateItem[]> {
    const response = await apiService.get<ApiEnvelope<TemplateItem[]>>('/templates');
    return unwrapEnvelope(response.data);
  }

  // Upload a template (Admin only)
  async uploadTemplate(templateName: string, file: File): Promise<TemplateItem> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('template_name', templateName);

    const response = await apiService.postFormData<ApiEnvelope<TemplateItem>>(
      '/templates',
      formData,
    );
    return unwrapEnvelope(response.data);
  }

  // Download a template file
  async downloadTemplate(templateId: number, fileName?: string): Promise<void> {
    const response = await apiService.get(`/templates/${templateId}/download`, undefined, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data as BlobPart]);
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName || `template-${templateId}.pdf`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
  }

  // Delete a template (Admin only)
  async deleteTemplate(templateId: number): Promise<void> {
    await apiService.delete(`/templates/${templateId}`);
  }

  // ─── DOCUMENT DOWNLOAD ───────────────────────────────────────────────────

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
}

export const universityService = new UniversityService();
