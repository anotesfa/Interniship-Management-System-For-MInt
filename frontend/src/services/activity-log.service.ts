import { apiService } from './api.service';

class ActivityLogService {
  async getAll(limit = 100, offset = 0, filters?: any) {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    if (filters?.userId) params.append('userId', filters.userId.toString());
    if (filters?.action) params.append('action', filters.action);
    if (filters?.userName) params.append('userName', filters.userName);
    if (filters?.entityType) params.append('entityType', filters.entityType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiService.get(`/activity-logs?${params.toString()}`);
    return response.data;
  }

  async getByUser(userId: number, limit = 50, offset = 0) {
    const response = await apiService.get(
      `/activity-logs/user/${userId}?limit=${limit}&offset=${offset}`
    );
    return response.data;
  }

  async getByEntity(entityType: string, entityId: number, limit = 50, offset = 0) {
    const response = await apiService.get(
      `/activity-logs/entity/${entityType}/${entityId}?limit=${limit}&offset=${offset}`
    );
    return response.data;
  }

  async getStats() {
    const response = await apiService.get('/activity-logs/stats');
    return response.data;
  }

  async clearAll() {
    const response = await apiService.delete('/activity-logs');
    return response.data;
  }
}

export const activityLogService = new ActivityLogService();
