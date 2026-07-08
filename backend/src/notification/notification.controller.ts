import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
  HttpStatus,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Get all notifications for current user (FR-NOT-003)
   * GET /notifications
   */
  @Get()
  @Roles('Admin', 'University Coordinator', 'Supervisor', 'Student')
  async getMyNotifications(@Request() req: any) {
    const notifications = await this.notificationService.getAll(req.user.userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Notifications retrieved successfully',
      data: notifications,
      error: null,
    };
  }

  /**
   * Get unread notifications count
   * GET /notifications/unread/count
   */
  @Get('unread/count')
  @Roles('Admin', 'University Coordinator', 'Supervisor', 'Student')
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationService.getUnreadCount(req.user.userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Unread count retrieved',
      data: { count },
      error: null,
    };
  }

  /**
   * Mark notification as read (FR-NOT-004)
   * PATCH /notifications/:notificationId/read
   */
  @Patch(':notificationId/read')
  @Roles('Admin', 'University Coordinator', 'Supervisor', 'Student')
  async markAsRead(@Param('notificationId', ParseIntPipe) notificationId: number) {
    await this.notificationService.markAsRead(notificationId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Notification marked as read',
      data: null,
      error: null,
    };
  }

  /**
   * Mark all notifications as read (FR-NOT-004)
   * PATCH /notifications/read-all
   */
  @Patch('read-all')
  @Roles('Admin', 'University Coordinator', 'Supervisor', 'Student')
  async markAllAsRead(@Request() req: any) {
    await this.notificationService.markAllAsRead(req.user.userId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'All notifications marked as read',
      data: null,
      error: null,
    };
  }

  /**
   * Delete notification
   * DELETE /notifications/:notificationId
   */
  @Delete(':notificationId')
  @Roles('Admin', 'University Coordinator', 'Supervisor', 'Student')
  async deleteNotification(
    @Param('notificationId', ParseIntPipe) notificationId: number,
  ) {
    await this.notificationService.deleteNotification(notificationId);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Notification deleted successfully',
      data: null,
      error: null,
    };
  }
}
