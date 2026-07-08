// Messaging service — aligned with backend /messages endpoints
import { apiService } from './api.service';
import { Message, MessageThread } from '../types';
import { ApiEnvelope, unwrapEnvelope } from '../utils/api-envelope';

export interface SendMessagePayload {
  receiverId: number | string;
  messageText: string;
}

export interface MessageContact {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
}

class MessageService {
  // Send a message to another user
  async sendMessage(data: SendMessagePayload): Promise<Message> {
    const response = await apiService.post<ApiEnvelope<Message>>('/messages', {
      receiverId: Number(data.receiverId),
      messageText: data.messageText,
    });
    return unwrapEnvelope(response.data);
  }

  // Get all conversation threads for the current user (sidebar list)
  async getMyThreads(): Promise<MessageThread[]> {
    const response = await apiService.get<ApiEnvelope<MessageThread[]>>('/messages/threads');
    return unwrapEnvelope(response.data);
  }

  async getAvailableContacts(pair = 'merged'): Promise<MessageContact[]> {
    const response = await apiService.get<ApiEnvelope<MessageContact[]>>('/messages/contacts', { pair });
    return unwrapEnvelope(response.data);
  }

  // Get full conversation thread with a specific user
  async getThreadWith(otherUserId: number | string): Promise<MessageThread> {
    const response = await apiService.get<ApiEnvelope<MessageThread>>(
      `/messages/with/${otherUserId}`,
    );
    return unwrapEnvelope(response.data);
  }

  // Mark a single message as read
  async markAsRead(messageId: string | number): Promise<void> {
    await apiService.post(`/messages/${messageId}/read`);
  }

  // Mark all messages as read for current user
  async markAllAsRead(): Promise<void> {
    await apiService.post('/messages/read-all');
  }
}

export const messageService = new MessageService();
