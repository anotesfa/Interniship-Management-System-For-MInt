import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(userId: number) {
    const notifications = await this.prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    return notifications;
  }

  async getUnreadCount(userId: number) {
    const count = await this.prisma.notification.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });

    return count;
  }

  async markAsRead(notificationId: number) {
    await this.prisma.notification.update({
      where: { notification_id: notificationId },
      data: { is_read: true },
    });
  }

  async markAllAsRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: { user_id: userId },
      data: { is_read: true },
    });
  }

  async deleteNotification(notificationId: number) {
    await this.prisma.notification.delete({
      where: { notification_id: notificationId },
    });
  }

  async create(userId: number, title: string, message: string, type: string) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    const notification = await this.prisma.notification.create({
      data: {
        user_id: userId,
        title,
        message,
        type,
        is_read: false,
      },
    });

    return notification;
  }
}
