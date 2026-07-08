// Notification state management
import { create } from 'zustand';
import { Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  markAsRead: (notificationId: string) => void;
  addNotification: (notification: Notification) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => set({ notifications }),

  setUnreadCount: (count) => set({ unreadCount: count }),

  markAsRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.notification_id === notificationId ? { ...n, is_read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.is_read ? state.unreadCount : state.unreadCount + 1,
    })),
}));
