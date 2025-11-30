import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { Item } from '../entities/item.entity';
import { Batch } from '../entities/batch.entity';
import { CreateBatchDto } from '../dto/create-batch.dto';

@Injectable()
export class BatchService {
  constructor(
    @InjectRepository(Batch)
    private readonly batchRepository: Repository<Batch>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateBatchDto, actorId: string): Promise<Batch> {
    const item = await this.itemRepository.findOne({
      where: { id: dto.itemId },
    });
    if (!item) {
      throw new Error(`Item ${dto.itemId} not found`);
    }

    const batch = this.batchRepository.create({
      batchNumber: dto.batchNumber,
      itemId: dto.itemId,
      quantity: dto.quantity,
      productionDate: new Date(dto.productionDate),
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      supplierBatchNumber: dto.supplierBatchNumber,
      notes: dto.notes,
    });

    const created = await this.batchRepository.save(batch);

    await this.auditLogService.record({
      actorId,
      action: 'INVENTORY_CREATE_BATCH',
      entity: 'Batch',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async list(itemId?: string): Promise<Batch[]> {
    if (itemId) {
      return this.batchRepository.find({
        where: { itemId },
        relations: ['item'],
        order: { productionDate: 'DESC' },
      });
    }
    return this.batchRepository.find({
      relations: ['item'],
      order: { productionDate: 'DESC' },
    });
  }

  async findByBatchNumber(batchNumber: string): Promise<Batch | null> {
    return this.batchRepository.findOne({
      where: { batchNumber },
      relations: ['item'],
    });
  }

  async getExpiringBatches(days: number = 30): Promise<Batch[]> {
    const date = new Date();
    date.setDate(date.getDate() + days);

    return this.batchRepository
      .createQueryBuilder('batch')
      .where('batch.expiryDate <= :date', { date })
      .andWhere('batch.expiryDate IS NOT NULL')
      .orderBy('batch.expiryDate', 'ASC')
      .getMany();
  }
}

