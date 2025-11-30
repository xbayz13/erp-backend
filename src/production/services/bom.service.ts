import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import { BOM, BOMItem } from '../entities/bom.entity';
import { Item } from '../../inventory/entities/item.entity';

@Injectable()
export class BOMService {
  constructor(
    @InjectRepository(BOM)
    private readonly bomRepository: Repository<BOM>,
    private readonly inventoryService: InventoryService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    code: string,
    productItemId: string,
    items: Array<{
      itemId: string;
      quantity: number;
      unitOfMeasure: string;
      level?: number;
      parentItemId?: string;
    }>,
    quantity: number = 1,
    actorId: string,
  ): Promise<BOM> {
    const productItem = await this.inventoryService.getItemById(productItemId);
    if (!productItem) {
      throw new Error(`Product item ${productItemId} not found`);
    }

    const bomItems: BOMItem[] = await Promise.all(
      items.map(async (item) => {
        const inventoryItem = await this.inventoryService.getItemById(item.itemId);
        if (!inventoryItem) {
          throw new Error(`Item ${item.itemId} not found`);
        }
        return {
          itemId: item.itemId,
          itemSku: inventoryItem.sku,
          itemName: inventoryItem.name,
          quantity: item.quantity,
          unitOfMeasure: item.unitOfMeasure,
          level: item.level || 1,
          parentItemId: item.parentItemId,
        };
      }),
    );

    let totalCost = 0;
    for (const item of bomItems) {
      const inventoryItem = await this.inventoryService.getItemById(item.itemId);
      if (inventoryItem) {
        totalCost += item.quantity * inventoryItem.unitCost;
      }
    }

    const maxLevel = Math.max(...bomItems.map((i) => i.level || 1));

    const bom = this.bomRepository.create({
      code,
      productItemId,
      items: bomItems,
      totalCost,
      quantity,
      level: maxLevel,
    });

    const created = await this.bomRepository.save(bom);

    await this.auditLogService.record({
      actorId,
      action: 'PRODUCTION_CREATE_BOM',
      entity: 'BOM',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async explodeBOM(bomId: string, quantity: number): Promise<BOMItem[]> {
    const bom = await this.bomRepository.findOne({ where: { id: bomId } });
    if (!bom) {
      throw new Error(`BOM ${bomId} not found`);
    }

    return bom.items.map((item) => ({
      ...item,
      quantity: item.quantity * quantity,
    }));
  }

  async list(productItemId?: string): Promise<BOM[]> {
    const where: any = { isActive: true };
    if (productItemId) where.productItemId = productItemId;

    return this.bomRepository.find({
      where,
      order: { code: 'ASC' },
    });
  }
}

