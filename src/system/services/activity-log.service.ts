import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../audit/entities/audit-log.entity';

@Injectable()
export class ActivityLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async getUserActivity(userId: string, limit: number = 100): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { actorId: userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getEntityActivity(
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { entity: entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  async getRecentActivity(limit: number = 50): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}

