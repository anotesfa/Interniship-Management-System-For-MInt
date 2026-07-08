// Notification service based on SRS FR-NOT requirements
import { apiService } from './api.service';
import { Notification } from '../types';

class NotificationService {
  // Get all notifications for current user (FR-NOT-003)
  async getMyNotifications(): Promise<Notification[]> {
    const response = await apiService.get<Notification[]>('/notifications');
    return response.data;
  }

  // Get unread notifications count
  async getUnreadCount(): Promise<number> {
    const response = await apiService.get<{ count: number }>('/notifications/unread/count');
    return response.data.count;
  }

  // Mark notification as read (FR-NOT-004)
  async markAsRead(notificationId: string): Promise<void> {
    await apiService.patch(`/notifications/${notificationId}/read`);
  }

  // Mark all notifications as read (FR-NOT-004)
  async markAllAsRead(): Promise<void> {
    await apiService.patch('/notifications/read-all');
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    await apiService.delete(`/notifications/${notificationId}`);
  }
}

export const notificationService = new NotificationService();
