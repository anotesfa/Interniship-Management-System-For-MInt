import { Controller, Get, UseGuards, Query, Req, Param, ParseIntPipe, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ActivityLogService } from './activity-log.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('activity-logs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  /**
   * Admin: Get all activity logs
   * GET /activity-logs
   */
  @Get()
  @Roles('Admin')
  async getAll(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('userName') userName?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};
    if (userId) filters.userId = parseInt(userId);
    if (action) filters.action = action;
    if (userName) filters.userName = userName;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await this.activityLogService.getAll(
      limit ? parseInt(limit) : 100,
      offset ? parseInt(offset) : 0,
      filters,
    );

    return { status: 'success', ...result };
  }

  /**
   * Admin: Get activity logs for a specific user
   * GET /activity-logs/user/:userId
   */
  @Get('user/:userId')
  @Roles('Admin')
  async getByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.activityLogService.getByUser(
      userId,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );

    return { status: 'success', ...result };
  }

  /**
   * Admin: Get audit trail for an entity
   * GET /activity-logs/entity/:entityType/:entityId
   */
  @Get('entity/:entityType/:entityId')
  @Roles('Admin')
  async getByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseIntPipe) entityId: number,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.activityLogService.getByEntity(
      entityType,
      entityId,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );

    return { status: 'success', ...result };
  }

  /**
   * Admin: Get activity statistics
   * GET /activity-logs/stats
   */
  @Get('stats')
  @Roles('Admin')
  async getStats() {
    const stats = await this.activityLogService.getStats();
    return { status: 'success', data: stats };
  }

  @Delete()
  @Roles('Admin')
  async clearAll() {
    const result = await this.activityLogService.clearAll();
    return { status: 'success', data: result };
  }
}
