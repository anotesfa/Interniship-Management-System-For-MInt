// Statistics Service - Fetch system-wide statistics
import { apiService } from './api.service';
import { ApiEnvelope, unwrapEnvelope } from '../utils/api-envelope';

export interface SystemStatistics {
  universities: number;
  students: number;
  users: number;
  supervisors: number;
  activeInternships: number;
  completedInternships: number;
  totalApplications: number;
}

class StatisticsService {
  async getSystemStatistics(): Promise<SystemStatistics> {
    try {
      const response = await apiService.get<ApiEnvelope<SystemStatistics>>('/reports/statistics/system');
      return unwrapEnvelope(response.data);
    } catch (error) {
      // Return default values if API fails (for unauthenticated access)
      return {
        universities: 0,
        students: 0,
        users: 0,
        supervisors: 0,
        activeInternships: 0,
        completedInternships: 0,
        totalApplications: 0,
      };
    }
  }
}

export const statisticsService = new StatisticsService();
