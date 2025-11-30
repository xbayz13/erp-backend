import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { InventoryService } from './inventory.service';
import { Stocktake, StocktakeStatus } from '../entities/stocktake.entity';
import { StockMovementType } from '../entities/stock-movement.entity';
import { CreateStocktakeDto } from '../dto/create-stocktake.dto';

@Injectable()
export class StocktakeService {
  constructor(
    @InjectRepository(Stocktake)
    private readonly stocktakeRepository: Repository<Stocktake>,
    @Inject(forwardRef(() => InventoryService))
    private readonly inventoryService: InventoryService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateStocktakeDto, actorId: string): Promise<Stocktake> {
    const items = await Promise.all(
      dto.items.map(async (item) => {
        const inventoryItem = await this.inventoryService.getItemById(item.itemId);
        if (!inventoryItem) {
          throw new Error(`Item ${item.itemId} not found`);
        }
        return {
          itemId: item.itemId,
          itemSku: inventoryItem.sku,
          itemName: inventoryItem.name,
          expectedQuantity: item.expectedQuantity,
          countedQuantity: item.countedQuantity,
          variance: item.countedQuantity - item.expectedQuantity,
          notes: item.notes,
        };
      }),
    );

    const stocktake = this.stocktakeRepository.create({
      reference: dto.reference,
      warehouseId: dto.warehouseId,
      status: StocktakeStatus.PLANNED,
      scheduledDate: new Date(dto.scheduledDate),
      items,
      notes: dto.notes,
      createdBy: actorId,
    });

    const created = await this.stocktakeRepository.save(stocktake);

    await this.auditLogService.record({
      actorId,
      action: 'INVENTORY_CREATE_STOCKTAKE',
      entity: 'Stocktake',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async start(id: string, actorId: string): Promise<Stocktake> {
    const stocktake = await this.stocktakeRepository.findOne({ where: { id } });
    if (!stocktake) {
      throw new Error(`Stocktake ${id} not found`);
    }
    if (stocktake.status !== StocktakeStatus.PLANNED) {
      throw new Error('Stocktake can only be started from PLANNED status');
    }

    stocktake.status = StocktakeStatus.IN_PROGRESS;
    stocktake.startedAt = new Date();
    const updated = await this.stocktakeRepository.save(stocktake);

    await this.auditLogService.record({
      actorId,
      action: 'INVENTORY_START_STOCKTAKE',
      entity: 'Stocktake',
      entityId: updated.id,
      before: { status: StocktakeStatus.PLANNED } as any,
      after: updated as any,
    });

    return updated;
  }

  async complete(id: string, actorId: string): Promise<Stocktake> {
    const stocktake = await this.stocktakeRepository.findOne({ where: { id } });
    if (!stocktake) {
      throw new Error(`Stocktake ${id} not found`);
    }
    if (stocktake.status !== StocktakeStatus.IN_PROGRESS) {
      throw new Error('Stocktake can only be completed from IN_PROGRESS status');
    }

    stocktake.status = StocktakeStatus.COMPLETED;
    stocktake.completedAt = new Date();

    for (const item of stocktake.items) {
      if (item.variance !== 0) {
        await this.inventoryService.recordStockMovement(
          {
            itemId: item.itemId,
            warehouseId: stocktake.warehouseId,
            quantity: Math.abs(item.variance),
            type: item.variance > 0 ? StockMovementType.INBOUND : StockMovementType.OUTBOUND,
            reference: `STOCKTAKE:${stocktake.reference}`,
            performedBy: actorId,
          },
          actorId,
        );
      }
    }

    const updated = await this.stocktakeRepository.save(stocktake);

    await this.auditLogService.record({
      actorId,
      action: 'INVENTORY_COMPLETE_STOCKTAKE',
      entity: 'Stocktake',
      entityId: updated.id,
      before: { status: StocktakeStatus.IN_PROGRESS } as any,
      after: updated as any,
    });

    return updated;
  }

  async list(warehouseId?: string): Promise<Stocktake[]> {
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;

    return this.stocktakeRepository.find({
      where,
      order: { scheduledDate: 'DESC' },
    });
  }

  async findById(id: string): Promise<Stocktake | null> {
    return this.stocktakeRepository.findOne({ where: { id } });
  }
}

