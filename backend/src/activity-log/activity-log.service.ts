import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityLogService {
  constructor(private readonly prisma: PrismaService) {}

  // Create activity log entry
  async log(userId: number, action: string, entityType?: string, entityId?: number, ipAddress?: string) {
    const log = await this.prisma.activityLog.create({
      data: {
        user_id: userId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        ip_address: ipAddress,
      },
    });
    return log;
  }

  // Get all activity logs (Admin only)
  async getAll(limit = 100, offset = 0, filters?: any) {
    const where: any = {};

    if (filters?.userId) {
      where.user_id = filters.userId;
    }
    if (filters?.action) {
      where.action = { contains: filters.action, mode: 'insensitive' };
    }
    if (filters?.entityType) {
      where.entity_type = filters.entityType;
    }
    if (filters?.userName) {
      where.user = {
        is: {
          OR: [
            { full_name: { contains: filters.userName, mode: 'insensitive' } },
            { email: { contains: filters.userName, mode: 'insensitive' } }
          ]
        }
      };
    }
    if (filters?.startDate) {
      where.timestamp = { gte: new Date(filters.startDate) };
    }
    if (filters?.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1); // Include the entire end date
      if (where.timestamp) {
        where.timestamp.lt = endDate;
      } else {
        where.timestamp = { lt: endDate };
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip: offset,
        take: limit,
        include: {
          user: {
            select: { user_id: true, full_name: true, email: true, role: true },
          },
        },
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      data: logs.map(log => ({
        log_id: log.log_id,
        user_id: log.user_id,
        user_name: log.user?.full_name,
        user_email: log.user?.email,
        user_role: log.user?.role?.role_name,
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        ip_address: log.ip_address,
        timestamp: log.timestamp.toISOString(),
      })),
      pagination: { total, limit, offset },
    };
  }

  // Get activity logs for a specific user
  async getByUser(userId: number, limit = 50, offset = 0) {
    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: { user_id: userId },
        skip: offset,
        take: limit,
        include: {
          user: {
            select: { user_id: true, full_name: true, email: true, role: true },
          },
        },
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.activityLog.count({ where: { user_id: userId } }),
    ]);

    return {
      data: logs.map(log => ({
        log_id: log.log_id,
        user_id: log.user_id,
        user_name: log.user?.full_name,
        user_email: log.user?.email,
        user_role: log.user?.role?.role_name,
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        ip_address: log.ip_address,
        timestamp: log.timestamp.toISOString(),
      })),
      pagination: { total, limit, offset },
    };
  }

  // Get activity logs by entity (for audit trail)
  async getByEntity(entityType: string, entityId: number, limit = 50, offset = 0) {
    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where: { entity_type: entityType, entity_id: entityId },
        skip: offset,
        take: limit,
        include: {
          user: {
            select: { user_id: true, full_name: true, email: true, role: true },
          },
        },
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.activityLog.count({ where: { entity_type: entityType, entity_id: entityId } }),
    ]);

    return {
      data: logs.map(log => ({
        log_id: log.log_id,
        user_id: log.user_id,
        user_name: log.user?.full_name,
        user_email: log.user?.email,
        user_role: log.user?.role?.role_name,
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        ip_address: log.ip_address,
        timestamp: log.timestamp.toISOString(),
      })),
      pagination: { total, limit, offset },
    };
  }

  // Get statistics on activity logs
  async getStats() {
    const [totalLogs, logsByRole, recentActivity] = await Promise.all([
      this.prisma.activityLog.count(),
      this.prisma.activityLog.groupBy({
        by: ['user_id'],
        _count: true,
        orderBy: { _count: { user_id: 'desc' } },
        take: 10,
      }),
      this.prisma.activityLog.findMany({
        take: 50,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: { full_name: true, role: true },
          },
        },
      }),
    ]);

    return {
      total_logs: totalLogs,
      recent_activity: recentActivity.map(log => ({
        action: log.action,
        user: log.user?.full_name,
        role: log.user?.role?.role_name,
        timestamp: log.timestamp.toISOString(),
      })),
    };
  }

  async clearAll() {
    const result = await this.prisma.activityLog.deleteMany({});
    return { deleted: result.count };
  }
}
