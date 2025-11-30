import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { StockMovementType } from '../../inventory/entities/stock-movement.entity';
import { InventoryService } from '../../inventory/services/inventory.service';
import { Repository } from 'typeorm';
import { CreateProductionOrderDto } from '../dto/create-production-order.dto';
import { UpdateProductionStatusDto } from '../dto/update-production-status.dto';
import {
  ProductionOrder,
  ProductionStatus,
} from '../entities/production-order.entity';

@Injectable()
export class ProductionService {
  constructor(
    @InjectRepository(ProductionOrder)
    private readonly productionRepository: Repository<ProductionOrder>,
    private readonly inventoryService: InventoryService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async list(): Promise<ProductionOrder[]> {
    return this.productionRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    dto: CreateProductionOrderDto,
    actorId: string,
  ): Promise<ProductionOrder> {
    const order = this.productionRepository.create({
      code: dto.code,
      productItemId: dto.productItemId,
      quantityPlanned: dto.quantityPlanned,
      quantityCompleted: 0,
      status: ProductionStatus.PLANNED,
      scheduledStart: new Date(dto.scheduledStart),
      scheduledEnd: new Date(dto.scheduledEnd),
      supervisorId: dto.supervisorId,
      materials: dto.materials.map((m) => ({ ...m })),
      outputWarehouseId: dto.outputWarehouseId,
      notes: dto.notes,
    });
    const created = await this.productionRepository.save(order);
    await this.auditLogService.record({
      actorId,
      action: 'PRODUCTION_ORDER_CREATED',
      entity: 'ProductionOrder',
      entityId: created.id,
      after: created as any,
    });
    return created;
  }

  async updateStatus(
    id: string,
    dto: UpdateProductionStatusDto,
    actorId: string,
  ): Promise<ProductionOrder> {
    const order = await this.productionRepository.findOne({ where: { id } });
    if (!order) {
      throw new Error(`Production order ${id} not found`);
    }

    const previousSnapshot = { ...order };

    if (dto.status === ProductionStatus.IN_PROGRESS) {
      await this.consumeMaterials(order, actorId);
    }

    if (dto.status === ProductionStatus.COMPLETED) {
      await this.registerFinishedGoods(order, dto.quantityCompleted ?? 0, actorId);
    }

    const updated = await this.productionRepository.save({
      ...order,
      status: dto.status,
      quantityCompleted: dto.quantityCompleted ?? order.quantityCompleted,
      actualStart:
        dto.actualStart !== undefined
          ? new Date(dto.actualStart)
          : order.actualStart,
      actualEnd:
        dto.actualEnd !== undefined
          ? new Date(dto.actualEnd)
          : order.actualEnd,
      notes: dto.notes ?? order.notes,
    });

    await this.auditLogService.record({
      actorId,
      action: 'PRODUCTION_STATUS_CHANGED',
      entity: 'ProductionOrder',
      entityId: id,
      before: previousSnapshot,
      after: updated as any,
      reason: dto.notes,
    });

    return updated;
  }

  private async consumeMaterials(order: ProductionOrder, actorId: string) {
    for (const material of order.materials) {
      await this.inventoryService.recordStockMovement(
        {
          itemId: material.itemId,
          warehouseId: material.warehouseId,
          quantity: material.quantity,
          type: StockMovementType.OUTBOUND,
          reference: `WO:${order.code}`,
          performedBy: actorId,
        },
        actorId,
      );
    }
  }

  private async registerFinishedGoods(
    order: ProductionOrder,
    producedQuantity: number,
    actorId: string,
  ) {
    if (producedQuantity <= 0) {
      return;
    }

    await this.inventoryService.recordStockMovement(
      {
        itemId: order.productItemId,
        warehouseId: order.outputWarehouseId,
        quantity: producedQuantity,
        type: StockMovementType.INBOUND,
        reference: `WO:${order.code}`,
        performedBy: actorId,
      },
      actorId,
    );
  }
}


