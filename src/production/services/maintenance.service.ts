import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { Equipment } from '../entities/equipment.entity';
import { MaintenanceSchedule, MaintenanceType, MaintenanceStatus } from '../entities/maintenance-schedule.entity';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
    @InjectRepository(MaintenanceSchedule)
    private readonly maintenanceRepository: Repository<MaintenanceSchedule>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createEquipment(
    code: string,
    name: string,
    actorId: string,
    manufacturer?: string,
    model?: string,
  ): Promise<Equipment> {
    const equipment = this.equipmentRepository.create({
      code,
      name,
      manufacturer,
      model,
    });

    const created = await this.equipmentRepository.save(equipment);

    await this.auditLogService.record({
      actorId,
      action: 'PRODUCTION_CREATE_EQUIPMENT',
      entity: 'Equipment',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async scheduleMaintenance(
    equipmentId: string,
    type: MaintenanceType,
    scheduledDate: Date,
    actorId: string,
    intervalDays?: number,
    estimatedCost?: number,
  ): Promise<MaintenanceSchedule> {
    const equipment = await this.equipmentRepository.findOne({
      where: { id: equipmentId },
    });
    if (!equipment) {
      throw new Error(`Equipment ${equipmentId} not found`);
    }

    const maintenance = this.maintenanceRepository.create({
      equipmentId,
      type,
      scheduledDate,
      intervalDays,
      estimatedCost,
    });

    const created = await this.maintenanceRepository.save(maintenance);

    await this.auditLogService.record({
      actorId,
      action: 'PRODUCTION_SCHEDULE_MAINTENANCE',
      entity: 'MaintenanceSchedule',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async completeMaintenance(
    id: string,
    actualCost: number,
    actorId: string,
  ): Promise<MaintenanceSchedule> {
    const maintenance = await this.maintenanceRepository.findOne({
      where: { id },
    });
    if (!maintenance) {
      throw new Error(`Maintenance ${id} not found`);
    }

    const before = { ...maintenance };
    maintenance.status = MaintenanceStatus.COMPLETED;
    maintenance.completedDate = new Date();
    maintenance.actualCost = actualCost;
    const updated = await this.maintenanceRepository.save(maintenance);

    // Schedule next maintenance if interval is set
    if (maintenance.intervalDays) {
      const nextDate = new Date(maintenance.scheduledDate);
      nextDate.setDate(nextDate.getDate() + maintenance.intervalDays);
      await this.scheduleMaintenance(
        maintenance.equipmentId,
        MaintenanceType.PREVENTIVE,
        nextDate,
        actorId,
        maintenance.intervalDays,
        maintenance.estimatedCost,
      );
    }

    await this.auditLogService.record({
      actorId,
      action: 'PRODUCTION_COMPLETE_MAINTENANCE',
      entity: 'MaintenanceSchedule',
      entityId: updated.id,
      before: before as any,
      after: updated as any,
    });

    return updated;
  }

  async getUpcomingMaintenance(days: number = 30): Promise<MaintenanceSchedule[]> {
    const date = new Date();
    date.setDate(date.getDate() + days);

    return this.maintenanceRepository.find({
      where: {
        status: MaintenanceStatus.SCHEDULED,
        scheduledDate: LessThanOrEqual(date),
      },
      order: { scheduledDate: 'ASC' },
    });
  }

  async listEquipment(): Promise<Equipment[]> {
    return this.equipmentRepository.find({
      where: { isActive: true },
      order: { code: 'ASC' },
    });
  }
}

