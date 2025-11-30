import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { Repository } from 'typeorm';
import { CreateItemDto } from '../dto/create-item.dto';
import { RecordStockMovementDto } from '../dto/record-stock-movement.dto';
import { TransferStockDto } from '../dto/transfer-stock.dto';
import { UpdateItemDto } from '../dto/update-item.dto';
import { Item } from '../entities/item.entity';
import {
  StockMovement,
  StockMovementType,
} from '../entities/stock-movement.entity';
import { CreateWarehouseDto } from '../dto/create-warehouse.dto';
import { Warehouse } from '../entities/warehouse.entity';

@Injectable()
export class InventoryService implements OnModuleInit {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(StockMovement)
    private readonly movementRepository: Repository<StockMovement>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async onModuleInit() {
    const warehouseCount = await this.warehouseRepository.count();
    if (warehouseCount === 0) {
      await this.createWarehouse(
        {
          name: 'Gudang Utama',
          location: 'Kantor Pusat',
          description: 'Default warehouse',
        },
        'system',
      );
    }
  }

  async listItems(): Promise<Item[]> {
    return this.itemRepository.find({
      order: { name: 'ASC' },
    });
  }

  async getItemById(id: string): Promise<Item | null> {
    return this.itemRepository.findOne({ where: { id } });
  }

  async createItem(dto: CreateItemDto, actorId: string): Promise<Item> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { id: dto.warehouseId },
    });
    if (!warehouse) {
      throw new Error(`Warehouse ${dto.warehouseId} not found`);
    }

    const item = this.itemRepository.create({
      sku: dto.sku,
      name: dto.name,
      description: dto.description,
      warehouseId: dto.warehouseId,
      quantityOnHand: dto.quantityOnHand,
      reorderLevel: dto.reorderLevel,
      unitCost: dto.unitCost,
    });
    const created = await this.itemRepository.save(item);

    await this.auditLogService.record({
      actorId,
      action: 'INVENTORY_CREATE_ITEM',
      entity: 'Item',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async updateItem(
    id: string,
    dto: UpdateItemDto,
    actorId: string,
  ): Promise<Item> {
    const existing = await this.itemRepository.findOne({ where: { id } });
    if (!existing) {
      throw new Error(`Item ${id} not found`);
    }

    const previousSnapshot = { ...existing };
    const updated = await this.itemRepository.save({
      ...existing,
      ...dto,
    });

    await this.auditLogService.record({
      actorId,
      action: 'INVENTORY_UPDATE_ITEM',
      entity: 'Item',
      entityId: id,
      before: previousSnapshot,
      after: updated as any,
    });

    return updated;
  }

  async recordStockMovement(
    dto: RecordStockMovementDto,
    actorId: string,
  ): Promise<StockMovement> {
    const [item, warehouse] = await Promise.all([
      this.itemRepository.findOne({ where: { id: dto.itemId } }),
      this.warehouseRepository.findOne({ where: { id: dto.warehouseId } }),
    ]);
    if (!item) {
      throw new Error(`Item ${dto.itemId} not found`);
    }
    if (!warehouse) {
      throw new Error(`Warehouse ${dto.warehouseId} not found`);
    }

    if (dto.type === StockMovementType.TRANSFER) {
      throw new Error('Transfer movements are not yet supported');
    }

    const delta =
      dto.type === StockMovementType.OUTBOUND ? -dto.quantity : dto.quantity;
    const nextQuantity = item.quantityOnHand + delta;
    if (nextQuantity < 0) {
      throw new Error('Stock cannot go below zero');
    }

    const previousSnapshot = { ...item };
    item.quantityOnHand = nextQuantity;
    const updatedItem = await this.itemRepository.save(item);

    const movement = this.movementRepository.create({
      itemId: dto.itemId,
      warehouseId: dto.warehouseId,
      quantity: dto.quantity,
      type: dto.type,
      reference: dto.reference,
      performedBy: dto.performedBy,
    });
    const savedMovement = await this.movementRepository.save(movement);

    await this.auditLogService.record({
      actorId,
      action: 'INVENTORY_STOCK_MOVEMENT',
      entity: 'StockMovement',
      entityId: movement.id,
      before: previousSnapshot,
      after: updatedItem as any,
      reason: dto.reference,
    });

    return savedMovement;
  }

  async listMovements(): Promise<StockMovement[]> {
    return this.movementRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async listWarehouses(): Promise<Warehouse[]> {
    return this.warehouseRepository.find({
      order: { name: 'ASC' },
    });
  }

  async createWarehouse(
    dto: CreateWarehouseDto,
    actorId: string,
  ): Promise<Warehouse> {
    const warehouse = this.warehouseRepository.create({
      name: dto.name,
      location: dto.location,
      description: dto.description,
    });
    const created = await this.warehouseRepository.save(warehouse);
    await this.auditLogService.record({
      actorId,
      action: 'INVENTORY_CREATE_WAREHOUSE',
      entity: 'Warehouse',
      entityId: created.id,
      after: created as any,
    });
    return created;
  }

  async transferStock(dto: TransferStockDto, actorId: string): Promise<{
    outbound: StockMovement;
    inbound: StockMovement;
  }> {
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new Error('Source and destination warehouses must be different');
    }

    const [sourceItem, fromWarehouse, toWarehouse] = await Promise.all([
      this.itemRepository.findOne({
        where: { id: dto.itemId, warehouseId: dto.fromWarehouseId },
      }),
      this.warehouseRepository.findOne({ where: { id: dto.fromWarehouseId } }),
      this.warehouseRepository.findOne({ where: { id: dto.toWarehouseId } }),
    ]);

    if (!sourceItem) {
      throw new Error(
        `Item ${dto.itemId} not found in warehouse ${dto.fromWarehouseId}`,
      );
    }
    if (!fromWarehouse) {
      throw new Error(`Source warehouse ${dto.fromWarehouseId} not found`);
    }
    if (!toWarehouse) {
      throw new Error(`Destination warehouse ${dto.toWarehouseId} not found`);
    }

    if (sourceItem.quantityOnHand < dto.quantity) {
      throw new Error('Insufficient stock in source warehouse');
    }

    const sourceBefore = { ...sourceItem };
    sourceItem.quantityOnHand -= dto.quantity;
    const sourceAfter = await this.itemRepository.save(sourceItem);

    let targetItem = await this.itemRepository.findOne({
      where: { id: dto.itemId, warehouseId: dto.toWarehouseId },
    });

    if (!targetItem) {
      targetItem = this.itemRepository.create({
        sku: sourceItem.sku,
        name: sourceItem.name,
        description: sourceItem.description,
        warehouseId: dto.toWarehouseId,
        quantityOnHand: 0,
        reorderLevel: sourceItem.reorderLevel,
        unitCost: sourceItem.unitCost,
      });
    }

    const targetBefore = { ...targetItem };
    targetItem.quantityOnHand += dto.quantity;
    const targetAfter = await this.itemRepository.save(targetItem);

    const outboundMovement = this.movementRepository.create({
      itemId: dto.itemId,
      warehouseId: dto.fromWarehouseId,
      quantity: dto.quantity,
      type: StockMovementType.OUTBOUND,
      reference: `TRANSFER:${dto.reference}`,
      performedBy: dto.performedBy,
    });
    const savedOutbound = await this.movementRepository.save(outboundMovement);

    const inboundMovement = this.movementRepository.create({
      itemId: dto.itemId,
      warehouseId: dto.toWarehouseId,
      quantity: dto.quantity,
      type: StockMovementType.INBOUND,
      reference: `TRANSFER:${dto.reference}`,
      performedBy: dto.performedBy,
    });
    const savedInbound = await this.movementRepository.save(inboundMovement);

    await this.auditLogService.record({
      actorId,
      action: 'INVENTORY_STOCK_TRANSFER',
      entity: 'StockMovement',
      entityId: savedOutbound.id,
      before: { source: sourceBefore, target: targetBefore },
      after: { source: sourceAfter, target: targetAfter },
      reason: dto.reference,
    });

    return {
      outbound: savedOutbound,
      inbound: savedInbound,
    };
  }
}


