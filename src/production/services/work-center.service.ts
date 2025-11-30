import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { WorkCenter } from '../entities/work-center.entity';

@Injectable()
export class WorkCenterService {
  constructor(
    @InjectRepository(WorkCenter)
    private readonly workCenterRepository: Repository<WorkCenter>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    code: string,
    name: string,
    capacity: number,
    hourlyRate: number,
    actorId: string,
    efficiency: number = 100,
  ): Promise<WorkCenter> {
    const workCenter = this.workCenterRepository.create({
      code,
      name,
      capacity,
      efficiency,
      hourlyRate,
    });

    const created = await this.workCenterRepository.save(workCenter);

    await this.auditLogService.record({
      actorId,
      action: 'PRODUCTION_CREATE_WORK_CENTER',
      entity: 'WorkCenter',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async list(): Promise<WorkCenter[]> {
    return this.workCenterRepository.find({
      where: { isActive: true },
      order: { code: 'ASC' },
    });
  }

  async calculateCapacity(workCenterId: string, date: Date): Promise<number> {
    const workCenter = await this.workCenterRepository.findOne({
      where: { id: workCenterId },
    });
    if (!workCenter) {
      throw new Error(`Work center ${workCenterId} not found`);
    }

    return workCenter.capacity * (workCenter.efficiency / 100);
  }
}

