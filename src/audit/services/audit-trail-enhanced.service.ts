import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { EntityVersion } from '../entities/entity-version.entity';

@Injectable()
export class AuditTrailEnhancedService {
  constructor(
    @InjectRepository(EntityVersion)
    private readonly entityVersionRepository: Repository<EntityVersion>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async saveVersion(
    entityType: string,
    entityId: string,
    data: Record<string, any>,
    changedBy: string,
    reason?: string,
  ): Promise<EntityVersion> {
    // Get current max version
    const existingVersions = await this.entityVersionRepository.find({
      where: { entityType, entityId },
      order: { version: 'DESC' },
      take: 1,
    });

    const nextVersion = existingVersions.length > 0
      ? existingVersions[0].version + 1
      : 1;

    const version = this.entityVersionRepository.create({
      entityType,
      entityId,
      version: nextVersion,
      data,
      changedBy,
      reason,
    });

    return this.entityVersionRepository.save(version);
  }

  async getVersionHistory(
    entityType: string,
    entityId: string,
  ): Promise<EntityVersion[]> {
    return this.entityVersionRepository.find({
      where: { entityType, entityId },
      order: { version: 'DESC' },
    });
  }

  async getVersionAtPoint(
    entityType: string,
    entityId: string,
    version: number,
  ): Promise<EntityVersion | null> {
    return this.entityVersionRepository.findOne({
      where: { entityType, entityId, version },
    });
  }

  async getVersionAtDate(
    entityType: string,
    entityId: string,
    date: Date,
  ): Promise<EntityVersion | null> {
    const versions = await this.entityVersionRepository.find({
      where: {
        entityType,
        entityId,
      },
      order: { version: 'DESC' },
    });

    return (
      versions.find((v) => v.changedAt <= date) ||
      versions[versions.length - 1] ||
      null
    );
  }

  async queryAuditTrail(
    filters: {
      entityType?: string;
      entityId?: string;
      action?: string;
      actorId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 100,
  ): Promise<AuditLog[]> {
    const where: any = {};

    if (filters.entityType) where.entity = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.action) where.action = filters.action;
    if (filters.actorId) where.actorId = filters.actorId;

    return this.auditLogRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
