import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationStatus } from '../entities/notification.entity';
import { RealtimeGateway } from '../../realtime/realtime.gateway';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @Optional() private readonly realtimeGateway?: RealtimeGateway,
  ) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    entityType?: string,
    entityId?: string,
    actionUrl?: string,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId,
      type,
      title,
      message,
      entityType,
      entityId,
      actionUrl,
    });

    const created = await this.notificationRepository.save(notification);

    // Send real-time notification
    if (this.realtimeGateway && (this.realtimeGateway as any).server) {
      (this.realtimeGateway as any).server.emit('notification', {
        userId,
        notification: created,
      });
    }

    return created;
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new Error(`Notification ${id} not found`);
    }

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  async list(userId: string, status?: NotificationStatus): Promise<Notification[]> {
    const where: any = { userId };
    if (status) where.status = status;

    return this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: {
        userId,
        status: NotificationStatus.UNREAD,
      },
    });
  }
}

