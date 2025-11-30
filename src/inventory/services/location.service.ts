import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { Warehouse } from '../entities/warehouse.entity';
import { Location } from '../entities/location.entity';
import { CreateLocationDto } from '../dto/create-location.dto';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateLocationDto, actorId: string): Promise<Location> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id: dto.warehouseId },
    });
    if (!warehouse) {
      throw new Error(`Warehouse ${dto.warehouseId} not found`);
    }

    if (dto.parentId) {
      const parent = await this.locationRepository.findOne({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new Error(`Parent location ${dto.parentId} not found`);
      }
    }

    const location = this.locationRepository.create({
      name: dto.name,
      warehouseId: dto.warehouseId,
      parentId: dto.parentId,
      type: dto.type,
      code: dto.code,
      description: dto.description,
      capacity: dto.capacity,
    });

    const created = await this.locationRepository.save(location);

    await this.auditLogService.record({
      actorId,
      action: 'INVENTORY_CREATE_LOCATION',
      entity: 'Location',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async list(warehouseId?: string): Promise<Location[]> {
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;

    return this.locationRepository.find({
      where,
      relations: ['warehouse', 'parent', 'children'],
      order: { name: 'ASC' },
    });
  }

  async getHierarchy(warehouseId: string): Promise<Location[]> {
    return this.locationRepository.find({
      where: { warehouseId, parentId: IsNull() },
      relations: ['children', 'warehouse'],
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Location | null> {
    return this.locationRepository.findOne({
      where: { id },
      relations: ['warehouse', 'parent', 'children'],
    });
  }
}

