// Milestone types based on SRS state machine
export enum MilestoneStatus {
  PENDING_REVIEW = 'pending_review',
  ACCEPTED = 'accepted',
  PENDING_REVISION = 'pending_revision',
  REJECTED = 'rejected'
}

export interface Milestone {
  milestone_id: string;
  student_id: string;
  student_name?: string;
  group_name?: string; // Group name for display instead of student name
  assignment_id: string;
  title: string;
  description: string;
  submission_date: string;
  status: MilestoneStatus;
  feedback?: string;
  locked: boolean;
  attachment_path?: string;
  attachment_name?: string;
  document_id?: string | null;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface MilestoneFormData {
  title: string;
  description: string;
  attachment?: File | null;
}

export interface MilestoneReviewData {
  status: MilestoneStatus;
  feedback: string;
}
