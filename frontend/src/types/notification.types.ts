// Notification types based on SRS
export enum NotificationType {
  APPLICATION_APPROVED = 'application_approved',
  APPLICATION_REJECTED = 'application_rejected',
  APPLICATION_ON_HOLD = 'application_on_hold',
  ACCOUNT_CREATED = 'account_created',
  SUPERVISOR_ASSIGNED = 'supervisor_assigned',
  MILESTONE_SUBMITTED = 'milestone_submitted',
  MILESTONE_REVIEWED = 'milestone_reviewed',
  EVALUATION_SUBMITTED = 'evaluation_submitted',
  GRADE_PUBLISHED = 'grade_published',
  NEW_MESSAGE = 'new_message'
}

export interface Notification {
  notification_id: string;
  recipient_id: string;
  type: NotificationType;
  message: string;
  entity_id?: string;
  entity_type?: string;
  is_read: boolean;
  created_at: string;
}
