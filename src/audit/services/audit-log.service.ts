import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

export interface RecordAuditLogInput {
  actorId: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repository: Repository<AuditLog>,
  ) {}

  async record(input: RecordAuditLogInput): Promise<AuditLog> {
    const log = this.repository.create({
      actorId: input.actorId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      before: input.before ?? null,
      after: input.after ?? null,
      reason: input.reason,
    });

    return this.repository.save(log);
  }

  async list(): Promise<AuditLog[]> {
    return this.repository.find({
      order: { createdAt: 'DESC' },
    });
  }
}


