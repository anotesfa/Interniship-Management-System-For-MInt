// Central export for all services
export { apiService } from './api.service';
export { authService, getAuthErrorMessage } from './auth.service';
export { applicationService } from './application.service';
export { milestoneService } from './milestone.service';
export { evaluationService } from './evaluation.service';
export { messageService } from './message.service';
export { assignmentService } from './assignment.service';
export { notificationService } from './notification.service';
export { attendanceService } from './attendance.service';
export { monthlyReportService } from './monthly-report.service';
export { reportService } from './report.service';
export { userService } from './user.service';
export { activityLogService } from './activity-log.service';
export { universityService } from './university.service';
export { studentGroupService } from './student-group.service';
export { statisticsService } from './statistics.service';
export type { SystemUser, CreateUserDto, PaginatedUsers } from './user.service';
export type { SystemStatistics } from './statistics.service';
