export interface StudentGroupMemberSummary {
  student_id: string;
  student_user_id: string | null;
  student_name: string;
  student_email: string;
  department: string;
  is_leader: boolean;
}

export interface StudentGroupSummary {
  group_id: string;
  supervisor_id: string;
  team_name: string | null;
  status?: 'active' | 'complete';
  leader_student_id: string | null;
  leader_student_name: string | null;
  start_date: string | null;
  end_date: string | null;
  attendance_days: string | null;
  created_at: string;
  updated_at: string;
  members: StudentGroupMemberSummary[];
}

export interface StudentGroupStatus {
  has_group: boolean;
  is_team_leader: boolean;
  group: StudentGroupSummary | null;
}
