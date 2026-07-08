// Permission utilities based on SRS Permission Matrix (Table 4)
import { UserRole } from '../types';

export const canViewApplications = (role: UserRole): boolean => {
  return [UserRole.ADMIN, UserRole.UNIVERSITY].includes(role);
};

export const canSubmitApplication = (role: UserRole): boolean => {
  return role === UserRole.UNIVERSITY;
};

export const canReviewApplication = (role: UserRole): boolean => {
  return role === UserRole.ADMIN;
};

export const canAssignSupervisor = (role: UserRole): boolean => {
  return role === UserRole.ADMIN;
};

export const canSubmitMilestone = (role: UserRole): boolean => {
  return role === UserRole.STUDENT;
};

export const canReviewMilestone = (role: UserRole): boolean => {
  return role === UserRole.SUPERVISOR;
};

export const canSubmitEvaluation = (role: UserRole): boolean => {
  return role === UserRole.SUPERVISOR;
};

export const canPublishEvaluation = (role: UserRole): boolean => {
  return role === UserRole.ADMIN;
};

export const canViewEvaluation = (role: UserRole): boolean => {
  return [UserRole.ADMIN, UserRole.UNIVERSITY, UserRole.SUPERVISOR, UserRole.STUDENT].includes(role);
};

export const canSendMessage = (role: UserRole): boolean => {
  return [UserRole.ADMIN, UserRole.UNIVERSITY, UserRole.STUDENT, UserRole.SUPERVISOR].includes(role);
};

export const canViewAllMessages = (role: UserRole): boolean => {
  return role === UserRole.ADMIN;
};

export const canManageUsers = (role: UserRole): boolean => {
  return role === UserRole.ADMIN;
};

export const canViewReports = (role: UserRole): boolean => {
  return [UserRole.ADMIN, UserRole.UNIVERSITY].includes(role);
};

export const canViewAuditLogs = (role: UserRole): boolean => {
  return role === UserRole.ADMIN;
};
