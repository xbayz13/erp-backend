import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import { RFQ, RFQStatus } from '../entities/rfq.entity';
import { CreateRFQDto } from '../dto/create-rfq.dto';

@Injectable()
export class RFQService {
  constructor(
    @InjectRepository(RFQ)
    private readonly rfqRepository: Repository<RFQ>,
    private readonly inventoryService: InventoryService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateRFQDto, actorId: string): Promise<RFQ> {
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
          specifications: item.specifications,
        };
      }),
    );

    const rfq = this.rfqRepository.create({
      reference: dto.reference,
      status: RFQStatus.DRAFT,
      items,
      deadline: new Date(dto.deadline),
      createdBy: actorId,
      notes: dto.notes,
    });

    const created = await this.rfqRepository.save(rfq);

    await this.auditLogService.record({
      actorId,
      action: 'PURCHASING_CREATE_RFQ',
      entity: 'RFQ',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async send(id: string, actorId: string): Promise<RFQ> {
    const rfq = await this.rfqRepository.findOne({ where: { id } });
    if (!rfq) {
      throw new Error(`RFQ ${id} not found`);
    }
    if (rfq.status !== RFQStatus.DRAFT) {
      throw new Error('RFQ can only be sent from DRAFT status');
    }

    rfq.status = RFQStatus.SENT;
    const updated = await this.rfqRepository.save(rfq);

    await this.auditLogService.record({
      actorId,
      action: 'PURCHASING_SEND_RFQ',
      entity: 'RFQ',
      entityId: updated.id,
      before: { status: RFQStatus.DRAFT } as any,
      after: updated as any,
    });

    return updated;
  }

  async close(id: string, actorId: string): Promise<RFQ> {
    const rfq = await this.rfqRepository.findOne({
      where: { id },
      relations: ['quotations'],
    });
    if (!rfq) {
      throw new Error(`RFQ ${id} not found`);
    }
    if (rfq.status !== RFQStatus.SENT) {
      throw new Error('RFQ can only be closed from SENT status');
    }

    rfq.status = RFQStatus.CLOSED;
    rfq.closedAt = new Date();
    const updated = await this.rfqRepository.save(rfq);

    await this.auditLogService.record({
      actorId,
      action: 'PURCHASING_CLOSE_RFQ',
      entity: 'RFQ',
      entityId: updated.id,
      before: { status: RFQStatus.SENT } as any,
      after: updated as any,
    });

    return updated;
  }

  async list(status?: RFQStatus): Promise<RFQ[]> {
    const where: any = {};
    if (status) where.status = status;

    return this.rfqRepository.find({
      where,
      relations: ['quotations'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<RFQ | null> {
    return this.rfqRepository.findOne({
      where: { id },
      relations: ['quotations'],
    });
  }

  async getComparisonMatrix(rfqId: string) {
    const rfq = await this.rfqRepository.findOne({
      where: { id: rfqId },
      relations: ['quotations', 'quotations.supplier'],
    });
    if (!rfq) {
      throw new Error(`RFQ ${rfqId} not found`);
    }

    return {
      rfq,
      quotations: rfq.quotations.map((q) => ({
        quotation: q,
        supplier: q.supplier,
        totalAmount: q.totalAmount,
        averageUnitPrice:
          q.items.reduce((sum, item) => sum + item.unitPrice, 0) / q.items.length,
        deliveryDays: q.items.reduce(
          (max, item) => Math.max(max, item.deliveryDays || 0),
          0,
        ),
      })),
      comparison: {
        lowestPrice: Math.min(...rfq.quotations.map((q) => q.totalAmount)),
        highestPrice: Math.max(...rfq.quotations.map((q) => q.totalAmount)),
        averagePrice:
          rfq.quotations.reduce((sum, q) => sum + q.totalAmount, 0) /
          rfq.quotations.length,
        totalQuotations: rfq.quotations.length,
      },
    };
  }
}

