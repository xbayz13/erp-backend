import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { StockMovementType } from '../../inventory/entities/stock-movement.entity';
import { InventoryService } from '../../inventory/services/inventory.service';
import { Repository } from 'typeorm';
import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';
import { UpdatePurchaseOrderStatusDto } from '../dto/update-purchase-order-status.dto';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from '../entities/purchase-order.entity';

@Injectable()
export class PurchasingService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly orderRepository: Repository<PurchaseOrder>,
    private readonly inventoryService: InventoryService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async list(): Promise<PurchaseOrder[]> {
    return this.orderRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async create(
    dto: CreatePurchaseOrderDto,
    actorId: string,
  ): Promise<PurchaseOrder> {
    const order = this.orderRepository.create({
      supplierName: dto.supplierName,
      reference: dto.reference,
      status: PurchaseOrderStatus.DRAFT,
      items: dto.items.map((item) => ({ ...item })),
      expectedDate: new Date(dto.expectedDate),
      totalCost: dto.items.reduce(
        (sum, item) => sum + item.quantity * item.unitCost,
        0,
      ),
      createdBy: actorId,
    });
    const created = await this.orderRepository.save(order);
    await this.auditLogService.record({
      actorId,
      action: 'PURCHASE_ORDER_CREATED',
      entity: 'PurchaseOrder',
      entityId: created.id,
      after: created as any,
    });
    return created;
  }

  async updateStatus(
    id: string,
    dto: UpdatePurchaseOrderStatusDto,
    actorId: string,
  ): Promise<PurchaseOrder> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new Error(`Purchase order ${id} not found`);
    }

    const previousSnapshot = { ...order };

    const next: Partial<PurchaseOrder> = {
      status: dto.status,
    };

    if (dto.status === PurchaseOrderStatus.APPROVED) {
      next.approvedBy = actorId;
    }

    if (dto.status === PurchaseOrderStatus.RECEIVED) {
      next.receivedBy = actorId;
      await this.receiveIntoInventory(order, actorId);
    }

    const updated = await this.orderRepository.save({
      ...order,
      ...next,
    });
    await this.auditLogService.record({
      actorId,
      action: 'PURCHASE_ORDER_STATUS_CHANGED',
      entity: 'PurchaseOrder',
      entityId: id,
      before: previousSnapshot,
      after: updated as any,
      reason: dto.remark,
    });
    return updated;
  }

  private async receiveIntoInventory(
    order: PurchaseOrder,
    actorId: string,
  ): Promise<void> {
    for (const line of order.items) {
      await this.inventoryService.recordStockMovement(
        {
          itemId: line.itemId,
          warehouseId: line.warehouseId,
          quantity: line.quantity,
          type: StockMovementType.INBOUND,
          reference: `PO:${order.reference}`,
          performedBy: actorId,
        },
        actorId,
      );
    }
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    return this.orderRepository.findOne({ where: { id } });
  }
}


