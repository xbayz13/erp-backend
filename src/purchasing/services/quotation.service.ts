import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import { Quotation, QuotationStatus } from '../entities/quotation.entity';
import { CreateQuotationDto } from '../dto/create-quotation.dto';
import { RFQ, RFQStatus } from '../entities/rfq.entity';
import { Supplier } from '../entities/supplier.entity';

@Injectable()
export class QuotationService {
  constructor(
    @InjectRepository(Quotation)
    private readonly quotationRepository: Repository<Quotation>,
    @InjectRepository(RFQ)
    private readonly rfqRepository: Repository<RFQ>,
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    private readonly inventoryService: InventoryService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateQuotationDto, actorId: string): Promise<Quotation> {
    const rfq = await this.rfqRepository.findOne({ where: { id: dto.rfqId } });
    if (!rfq) {
      throw new Error(`RFQ ${dto.rfqId} not found`);
    }
    if (rfq.status !== RFQStatus.SENT) {
      throw new Error('Quotation can only be created for SENT RFQ');
    }

    const supplier = await this.supplierRepository.findOne({
      where: { id: dto.supplierId },
    });
    if (!supplier) {
      throw new Error(`Supplier ${dto.supplierId} not found`);
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
          deliveryDays: item.deliveryDays,
          notes: item.notes,
        };
      }),
    );

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    const quotation = this.quotationRepository.create({
      rfqId: dto.rfqId,
      supplierId: dto.supplierId,
      status: QuotationStatus.DRAFT,
      items,
      totalAmount,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      terms: dto.terms,
      notes: dto.notes,
      submittedBy: actorId,
    });

    const created = await this.quotationRepository.save(quotation);

    await this.auditLogService.record({
      actorId,
      action: 'PURCHASING_CREATE_QUOTATION',
      entity: 'Quotation',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async submit(id: string, actorId: string): Promise<Quotation> {
    const quotation = await this.quotationRepository.findOne({ where: { id } });
    if (!quotation) {
      throw new Error(`Quotation ${id} not found`);
    }
    if (quotation.status !== QuotationStatus.DRAFT) {
      throw new Error('Quotation can only be submitted from DRAFT status');
    }

    quotation.status = QuotationStatus.SUBMITTED;
    const updated = await this.quotationRepository.save(quotation);

    await this.auditLogService.record({
      actorId,
      action: 'PURCHASING_SUBMIT_QUOTATION',
      entity: 'Quotation',
      entityId: updated.id,
      before: { status: QuotationStatus.DRAFT } as any,
      after: updated as any,
    });

    return updated;
  }

  async accept(id: string, actorId: string): Promise<Quotation> {
    const quotation = await this.quotationRepository.findOne({ where: { id } });
    if (!quotation) {
      throw new Error(`Quotation ${id} not found`);
    }
    if (quotation.status !== QuotationStatus.SUBMITTED) {
      throw new Error('Quotation can only be accepted from SUBMITTED status');
    }

    const before = { ...quotation };
    quotation.status = QuotationStatus.ACCEPTED;
    const updated = await this.quotationRepository.save(quotation);

    await this.auditLogService.record({
      actorId,
      action: 'PURCHASING_ACCEPT_QUOTATION',
      entity: 'Quotation',
      entityId: updated.id,
      before: before as any,
      after: updated as any,
    });

    return updated;
  }

  async reject(id: string, actorId: string): Promise<Quotation> {
    const quotation = await this.quotationRepository.findOne({ where: { id } });
    if (!quotation) {
      throw new Error(`Quotation ${id} not found`);
    }
    if (quotation.status !== QuotationStatus.SUBMITTED) {
      throw new Error('Quotation can only be rejected from SUBMITTED status');
    }

    const before = { ...quotation };
    quotation.status = QuotationStatus.REJECTED;
    const updated = await this.quotationRepository.save(quotation);

    await this.auditLogService.record({
      actorId,
      action: 'PURCHASING_REJECT_QUOTATION',
      entity: 'Quotation',
      entityId: updated.id,
      before: before as any,
      after: updated as any,
    });

    return updated;
  }

  async list(rfqId?: string, supplierId?: string): Promise<Quotation[]> {
    const where: any = {};
    if (rfqId) where.rfqId = rfqId;
    if (supplierId) where.supplierId = supplierId;

    return this.quotationRepository.find({
      where,
      relations: ['rfq', 'supplier'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Quotation | null> {
    return this.quotationRepository.findOne({
      where: { id },
      relations: ['rfq', 'supplier'],
    });
  }
}

