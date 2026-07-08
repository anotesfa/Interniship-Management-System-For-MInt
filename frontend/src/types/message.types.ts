// Messaging types based on SRS
export interface Message {
  message_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  recipient_id: string;
  recipient_name: string;
  assignment_id: string;
  body: string;
  sent_at: string;
  is_read: boolean;
}

export interface MessageThread {
  assignment_id: string;
  student_id: string;
  student_name: string;
  supervisor_id: string;
  supervisor_name: string;
  team_name?: string;
  other_user_id?: string; // User ID of the other party in the conversation
  other_user_name?: string; // Name of the other party
  other_user_role?: string; // Role of the other party in the conversation
  messages: Message[];
  unread_count: number;
  last_message_at?: string;
}

export interface SendMessageData {
  recipient_id: string;
  assignment_id: string;
  body: string;
}
