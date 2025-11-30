import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import {
  PurchaseRequisition,
  PurchaseRequisitionStatus,
} from '../entities/purchase-requisition.entity';
import { CreatePurchaseRequisitionDto } from '../dto/create-purchase-requisition.dto';

@Injectable()
export class PurchaseRequisitionService {
  constructor(
    @InjectRepository(PurchaseRequisition)
    private readonly prRepository: Repository<PurchaseRequisition>,
    private readonly inventoryService: InventoryService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreatePurchaseRequisitionDto, actorId: string): Promise<PurchaseRequisition> {
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
          unitCost: item.unitCost,
          warehouseId: item.warehouseId,
          notes: item.notes,
        };
      }),
    );

    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0,
    );

    const pr = this.prRepository.create({
      reference: dto.reference,
      status: PurchaseRequisitionStatus.DRAFT,
      items,
      totalAmount,
      requestedBy: actorId,
      department: dto.department,
      notes: dto.notes,
    });

    const created = await this.prRepository.save(pr);

    await this.auditLogService.record({
      actorId,
      action: 'PURCHASING_CREATE_PURCHASE_REQUISITION',
      entity: 'PurchaseRequisition',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async submit(id: string, actorId: string): Promise<PurchaseRequisition> {
    const pr = await this.prRepository.findOne({ where: { id } });
    if (!pr) {
      throw new Error(`Purchase Requisition ${id} not found`);
    }
    if (pr.status !== PurchaseRequisitionStatus.DRAFT) {
      throw new Error('PR can only be submitted from DRAFT status');
    }

    pr.status = PurchaseRequisitionStatus.PENDING_APPROVAL;
    const updated = await this.prRepository.save(pr);

    await this.auditLogService.record({
      actorId,
      action: 'PURCHASING_SUBMIT_PURCHASE_REQUISITION',
      entity: 'PurchaseRequisition',
      entityId: updated.id,
      before: { status: PurchaseRequisitionStatus.DRAFT } as any,
      after: updated as any,
    });

    return updated;
  }

  async approve(
    id: string,
    approverId: string,
    approverName: string,
    comments?: string,
  ): Promise<PurchaseRequisition> {
    const pr = await this.prRepository.findOne({ where: { id } });
    if (!pr) {
      throw new Error(`Purchase Requisition ${id} not found`);
    }
    if (pr.status !== PurchaseRequisitionStatus.PENDING_APPROVAL) {
      throw new Error('PR can only be approved from PENDING_APPROVAL status');
    }

    const before = { ...pr };
    pr.status = PurchaseRequisitionStatus.APPROVED;
    pr.approvalHistory = [
      ...(pr.approvalHistory || []),
      {
        approverId,
        approverName,
        status: PurchaseRequisitionStatus.APPROVED,
        comments,
        approvedAt: new Date(),
      },
    ];
    pr.currentApproverId = undefined;

    const updated = await this.prRepository.save(pr);

    await this.auditLogService.record({
      actorId: approverId,
      action: 'PURCHASING_APPROVE_PURCHASE_REQUISITION',
      entity: 'PurchaseRequisition',
      entityId: updated.id,
      before: before as any,
      after: updated as any,
    });

    return updated;
  }

  async reject(
    id: string,
    approverId: string,
    approverName: string,
    reason: string,
  ): Promise<PurchaseRequisition> {
    const pr = await this.prRepository.findOne({ where: { id } });
    if (!pr) {
      throw new Error(`Purchase Requisition ${id} not found`);
    }
    if (pr.status !== PurchaseRequisitionStatus.PENDING_APPROVAL) {
      throw new Error('PR can only be rejected from PENDING_APPROVAL status');
    }

    const before = { ...pr };
    pr.status = PurchaseRequisitionStatus.REJECTED;
    pr.rejectionReason = reason;
    pr.approvalHistory = [
      ...(pr.approvalHistory || []),
      {
        approverId,
        approverName,
        status: PurchaseRequisitionStatus.REJECTED,
        comments: reason,
        approvedAt: new Date(),
      },
    ];
    pr.currentApproverId = undefined;

    const updated = await this.prRepository.save(pr);

    await this.auditLogService.record({
      actorId: approverId,
      action: 'PURCHASING_REJECT_PURCHASE_REQUISITION',
      entity: 'PurchaseRequisition',
      entityId: updated.id,
      before: before as any,
      after: updated as any,
    });

    return updated;
  }

  async list(status?: PurchaseRequisitionStatus): Promise<PurchaseRequisition[]> {
    const where: any = {};
    if (status) where.status = status;

    return this.prRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<PurchaseRequisition | null> {
    return this.prRepository.findOne({ where: { id } });
  }
}

