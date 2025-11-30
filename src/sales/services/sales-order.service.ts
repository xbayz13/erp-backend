import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import { StockMovementType } from '../../inventory/entities/stock-movement.entity';
import { SalesOrder, SalesOrderStatus } from '../entities/sales-order.entity';
import { CreateSalesOrderDto } from '../dto/create-sales-order.dto';
import { Customer } from '../entities/customer.entity';
import { Item } from '../../inventory/entities/item.entity';

@Injectable()
export class SalesOrderService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepository: Repository<SalesOrder>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly inventoryService: InventoryService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateSalesOrderDto, actorId: string): Promise<SalesOrder> {
    const customer = await this.customerRepository.findOne({
      where: { id: dto.customerId },
    });
    if (!customer) {
      throw new Error(`Customer ${dto.customerId} not found`);
    }

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
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          warehouseId: item.warehouseId,
          allocatedQuantity: 0,
          notes: item.notes,
        };
      }),
    );

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    const salesOrder = this.salesOrderRepository.create({
      reference: dto.reference,
      customerId: dto.customerId,
      status: SalesOrderStatus.DRAFT,
      items,
      totalAmount,
      expectedDeliveryDate: dto.expectedDeliveryDate
        ? new Date(dto.expectedDeliveryDate)
        : undefined,
      shippingAddress: dto.shippingAddress,
      notes: dto.notes,
      createdBy: actorId,
    });

    const created = await this.salesOrderRepository.save(salesOrder);

    await this.auditLogService.record({
      actorId,
      action: 'SALES_CREATE_SALES_ORDER',
      entity: 'SalesOrder',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async confirm(id: string, actorId: string): Promise<SalesOrder> {
    const order = await this.salesOrderRepository.findOne({ where: { id } });
    if (!order) {
      throw new Error(`Sales Order ${id} not found`);
    }
    if (order.status !== SalesOrderStatus.DRAFT) {
      throw new Error('Order can only be confirmed from DRAFT status');
    }

    // Check inventory availability
    for (const item of order.items) {
      const inventoryItem = await this.inventoryService.getItemById(item.itemId);
      if (!inventoryItem) {
        throw new Error(`Item ${item.itemId} not found`);
      }
      if (inventoryItem.quantityOnHand < item.quantity) {
        throw new Error(
          `Insufficient stock for item ${item.itemSku}. Available: ${inventoryItem.quantityOnHand}, Required: ${item.quantity}`,
        );
      }
    }

    // Allocate inventory
    for (const item of order.items) {
      item.allocatedQuantity = item.quantity;
      await this.inventoryService.recordStockMovement(
        {
          itemId: item.itemId,
          warehouseId: item.warehouseId,
          quantity: item.quantity,
          type: StockMovementType.OUTBOUND,
          reference: `SO:${order.reference}`,
          performedBy: actorId,
        },
        actorId,
      );
    }

    const before = { ...order };
    order.status = SalesOrderStatus.CONFIRMED;
    order.orderDate = new Date();
    const updated = await this.salesOrderRepository.save(order);

    await this.auditLogService.record({
      actorId,
      action: 'SALES_CONFIRM_SALES_ORDER',
      entity: 'SalesOrder',
      entityId: updated.id,
      before: before as any,
      after: updated as any,
    });

    return updated;
  }

  async ship(id: string, actorId: string): Promise<SalesOrder> {
    const order = await this.salesOrderRepository.findOne({ where: { id } });
    if (!order) {
      throw new Error(`Sales Order ${id} not found`);
    }
    if (order.status !== SalesOrderStatus.CONFIRMED) {
      throw new Error('Order can only be shipped from CONFIRMED status');
    }

    const before = { ...order };
    order.status = SalesOrderStatus.SHIPPED;
    order.shippedDate = new Date();
    const updated = await this.salesOrderRepository.save(order);

    await this.auditLogService.record({
      actorId,
      action: 'SALES_SHIP_SALES_ORDER',
      entity: 'SalesOrder',
      entityId: updated.id,
      before: before as any,
      after: updated as any,
    });

    return updated;
  }

  async deliver(id: string, actorId: string): Promise<SalesOrder> {
    const order = await this.salesOrderRepository.findOne({ where: { id } });
    if (!order) {
      throw new Error(`Sales Order ${id} not found`);
    }
    if (order.status !== SalesOrderStatus.SHIPPED) {
      throw new Error('Order can only be delivered from SHIPPED status');
    }

    const before = { ...order };
    order.status = SalesOrderStatus.DELIVERED;
    order.deliveredDate = new Date();
    const updated = await this.salesOrderRepository.save(order);

    await this.auditLogService.record({
      actorId,
      action: 'SALES_DELIVER_SALES_ORDER',
      entity: 'SalesOrder',
      entityId: updated.id,
      before: before as any,
      after: updated as any,
    });

    return updated;
  }

  async list(customerId?: string): Promise<SalesOrder[]> {
    const where: any = {};
    if (customerId) where.customerId = customerId;

    return this.salesOrderRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<SalesOrder | null> {
    return this.salesOrderRepository.findOne({ where: { id } });
  }
}

