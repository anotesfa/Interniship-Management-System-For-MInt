// Milestone service for Students and Supervisors
import { apiService } from './api.service';
import { Milestone, MilestoneFormData, MilestoneReviewData } from '../types';
import { ApiEnvelope, unwrapEnvelope } from '../utils/api-envelope';

class MilestoneService {
  // Student: submit a new milestone
  async submitMilestone(formData: MilestoneFormData): Promise<Milestone> {
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    if (formData.attachment) {
      data.append('attachment', formData.attachment);
    }
    const response = await apiService.postFormData<ApiEnvelope<Milestone>>('/milestones', data);
    return unwrapEnvelope(response.data);
  }

  // Student: resubmit / update a milestone
  async updateMilestone(milestoneId: string, formData: MilestoneFormData): Promise<Milestone> {
    const response = await apiService.put<ApiEnvelope<Milestone>>(
      `/milestones/${milestoneId}`,
      { title: formData.title, description: formData.description },
    );
    return unwrapEnvelope(response.data);
  }

  // Student: get own milestones
  async getMyMilestones(): Promise<Milestone[]> {
    const response = await apiService.get<ApiEnvelope<Milestone[]>>('/milestones/my');
    return unwrapEnvelope(response.data);
  }

  // Supervisor: get milestones for all assigned students
  async getMilestonesForMyStudents(): Promise<Milestone[]> {
    const response = await apiService.get<ApiEnvelope<Milestone[]>>('/milestones/students');
    return unwrapEnvelope(response.data);
  }

  // Get milestones for a specific student (by student_id)
  async getMilestonesByStudent(studentId: string): Promise<Milestone[]> {
    const response = await apiService.get<ApiEnvelope<Milestone[]>>(
      `/milestones/student/${studentId}`,
    );
    return unwrapEnvelope(response.data);
  }

  // Supervisor: review a milestone
  async reviewMilestone(milestoneId: string, reviewData: MilestoneReviewData): Promise<Milestone> {
    const response = await apiService.post<ApiEnvelope<Milestone>>(
      `/milestones/${milestoneId}/review`,
      reviewData,
    );
    return unwrapEnvelope(response.data);
  }

  // Get a single milestone by ID
  async getMilestoneById(milestoneId: string): Promise<Milestone> {
    const response = await apiService.get<ApiEnvelope<Milestone>>(`/milestones/${milestoneId}`);
    return unwrapEnvelope(response.data);
  }

  // Download milestone attachment
  async downloadAttachment(documentId: string, filename?: string): Promise<void> {
    const response = await apiService.get(`/documents/${documentId}/download`, undefined, {
      responseType: 'blob',
    });
    const blob = response.data as Blob;
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename || `milestone-attachment-${documentId}`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);
  }

  // Get progress summary for a student
  async getStudentProgressSummary(studentId: string): Promise<{
    total: number;
    accepted: number;
    pending_review: number;
    pending_revision: number;
    rejected: number;
  }> {
    const response = await apiService.get<ApiEnvelope<any>>(
      `/milestones/student/${studentId}/summary`,
    );
    return unwrapEnvelope(response.data);
  }
}

export const milestoneService = new MilestoneService();
