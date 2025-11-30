import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { Item } from '../entities/item.entity';
import { SerialNumber } from '../entities/serial-number.entity';
import { CreateSerialNumberDto } from '../dto/create-serial-number.dto';

@Injectable()
export class SerialNumberService {
  constructor(
    @InjectRepository(SerialNumber)
    private readonly serialNumberRepository: Repository<SerialNumber>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateSerialNumberDto, actorId: string): Promise<SerialNumber> {
    const item = await this.itemRepository.findOne({
      where: { id: dto.itemId },
    });
    if (!item) {
      throw new Error(`Item ${dto.itemId} not found`);
    }

    const existing = await this.serialNumberRepository.findOne({
      where: { serialNumber: dto.serialNumber },
    });
    if (existing) {
      throw new Error(`Serial number ${dto.serialNumber} already exists`);
    }

    const serialNumber = this.serialNumberRepository.create({
      serialNumber: dto.serialNumber,
      itemId: dto.itemId,
      warehouseId: dto.warehouseId,
      warrantyStartDate: dto.warrantyStartDate
        ? new Date(dto.warrantyStartDate)
        : undefined,
      warrantyEndDate: dto.warrantyEndDate
        ? new Date(dto.warrantyEndDate)
        : undefined,
      status: dto.status || 'AVAILABLE',
      notes: dto.notes,
    });

    const created = await this.serialNumberRepository.save(serialNumber);

    await this.auditLogService.record({
      actorId,
      action: 'INVENTORY_CREATE_SERIAL_NUMBER',
      entity: 'SerialNumber',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async list(itemId?: string, warehouseId?: string): Promise<SerialNumber[]> {
    const where: any = {};
    if (itemId) where.itemId = itemId;
    if (warehouseId) where.warehouseId = warehouseId;

    return this.serialNumberRepository.find({
      where,
      relations: ['item'],
      order: { createdAt: 'DESC' },
    });
  }

  async findBySerialNumber(serialNumber: string): Promise<SerialNumber | null> {
    return this.serialNumberRepository.findOne({
      where: { serialNumber },
      relations: ['item'],
    });
  }

  async updateStatus(
    id: string,
    status: string,
    actorId: string,
  ): Promise<SerialNumber> {
    const serialNumber = await this.serialNumberRepository.findOne({
      where: { id },
    });
    if (!serialNumber) {
      throw new Error(`Serial number ${id} not found`);
    }

    const before = { ...serialNumber };
    serialNumber.status = status;
    const updated = await this.serialNumberRepository.save(serialNumber);

    await this.auditLogService.record({
      actorId,
      action: 'INVENTORY_UPDATE_SERIAL_NUMBER_STATUS',
      entity: 'SerialNumber',
      entityId: updated.id,
      before: before as any,
      after: updated as any,
    });

    return updated;
  }
}

