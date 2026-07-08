// Evaluation service for Supervisors and Admins
import { apiService } from './api.service';
import { Evaluation, EvaluationFormData } from '../types';

class EvaluationService {
  /**
   * Flatten nested Prisma relations returned by the backend into the flat
   * fields that the frontend Evaluation interface expects.
   * e.g. student.full_name → student_name
   */
  private normalizeEvaluation(raw: any): Evaluation {
    if (!raw) return raw;
    const student_name =
      raw.student_name ||
      raw.student?.full_name ||
      raw.student?.user?.full_name ||
      '';
    const supervisor_name =
      raw.supervisor_name ||
      raw.supervisor?.user?.full_name ||
      raw.supervisor?.full_name ||
      '';
    // Prefer computed total_score; fall back to legacy score field
    const score = raw.total_score ?? raw.score;
    return { ...raw, student_name, supervisor_name, score } as Evaluation;
  }

  // Supervisor: Create evaluation draft (FR-EVAL-001, FR-EVAL-003)
  async saveDraft(studentId: string, formData: EvaluationFormData): Promise<Evaluation> {
    const response = await apiService.post<any>('/evaluations/draft', {
      student_id: studentId,
      ...formData,
    });
    return this.normalizeEvaluation(response.data?.data || response.data);
  }

  // Supervisor: Submit evaluation (FR-EVAL-001, FR-EVAL-002)
  async submitEvaluation(studentId: string, formData: EvaluationFormData): Promise<Evaluation> {
    const response = await apiService.post<any>('/evaluations', {
      student_id: studentId,
      ...formData,
    });
    return this.normalizeEvaluation(response.data?.data || response.data);
  }

  // Supervisor: Get own evaluations
  async getMyEvaluations(): Promise<Evaluation[]> {
    const response = await apiService.get<any>('/evaluations/my');
    const data: any[] = response.data?.data || response.data || [];
    return data.map((e) => this.normalizeEvaluation(e));
  }

  // Supervisor: Get evaluation for specific student
  async getEvaluationByStudent(studentId: string): Promise<Evaluation | null> {
    try {
      const response = await apiService.get<any>(`/evaluations/student/${studentId}`);
      return this.normalizeEvaluation(response.data?.data || response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // Admin: Get pending evaluations (FR-EVAL-004)
  async getPendingEvaluations(): Promise<Evaluation[]> {
    const response = await apiService.get<any>('/evaluations/pending');
    const data: any[] = response.data?.data || response.data || [];
    return data.map((e) => this.normalizeEvaluation(e));
  }

  // Admin: Publish evaluation (FR-EVAL-004, FR-EVAL-005)
  async publishEvaluation(evaluationId: string): Promise<Evaluation> {
    const response = await apiService.post<any>(
      `/evaluations/${evaluationId}/publish`
    );
    return this.normalizeEvaluation(response.data?.data || response.data);
  }

  // Admin: Return evaluation to supervisor for correction
  async returnForCorrection(evaluationId: string, reason: string): Promise<Evaluation> {
    const response = await apiService.post<any>(
      `/evaluations/${evaluationId}/return`,
      { reason }
    );
    return this.normalizeEvaluation(response.data?.data || response.data);
  }

  // Student/University: Get published evaluation
  async getMyPublishedEvaluation(): Promise<Evaluation | null> {
    try {
      const response = await apiService.get<any>('/evaluations/published/my');
      return this.normalizeEvaluation(response.data?.data || response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // Student: Check if evaluation is published
  async checkPublishedStatus(): Promise<boolean> {
    try {
      const response = await apiService.get<any>('/evaluations/published/status');
      return response.data?.data?.isPublished || false;
    } catch (error) {
      return false;
    }
  }

  // University: Download grade report (FR-EVAL-006)
  async downloadGradeReport(studentId: string): Promise<Blob> {
    const response = await apiService.get(`/evaluations/student/${studentId}/report`, undefined, {
      responseType: 'blob',
    });
    return response.data as Blob;
  }

  // Admin: Generate consolidated grade report (FR-EVAL-007)
  async downloadConsolidatedReport(cohort: string, format: 'pdf' | 'csv'): Promise<Blob> {
    const response = await apiService.get(`/evaluations/cohort/${cohort}/report`,
      { format },
      { responseType: 'blob' }
    );
    return response.data as Blob;
  }
}

export const evaluationService = new EvaluationService();
