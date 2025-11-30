import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { QCInspection, QCStatus, QualityCheck } from '../entities/qc-inspection.entity';

@Injectable()
export class QCService {
  constructor(
    @InjectRepository(QCInspection)
    private readonly qcRepository: Repository<QCInspection>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    reference: string,
    productionOrderId: string,
    itemId: string,
    quantityInspected: number,
    checks: Array<{
      checkName: string;
      standard: string;
      actual: string;
      result: 'PASS' | 'FAIL';
    }>,
    actorId: string,
  ): Promise<QCInspection> {
    const quantityPassed = checks.filter((c) => c.result === 'PASS').length;
    const quantityFailed = checks.filter((c) => c.result === 'FAIL').length;

    const status =
      quantityFailed === 0 ? QCStatus.PASSED : QCStatus.FAILED;

    const qc = this.qcRepository.create({
      reference,
      productionOrderId,
      itemId,
      quantityInspected,
      quantityPassed,
      quantityFailed,
      status,
      checks: checks as QualityCheck[],
      inspectorId: actorId,
      inspectedAt: new Date(),
    });

    const created = await this.qcRepository.save(qc);

    await this.auditLogService.record({
      actorId,
      action: 'PRODUCTION_CREATE_QC_INSPECTION',
      entity: 'QCInspection',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async approve(id: string, approverId: string): Promise<QCInspection> {
    const qc = await this.qcRepository.findOne({ where: { id } });
    if (!qc) {
      throw new Error(`QC Inspection ${id} not found`);
    }
    if (qc.status !== QCStatus.PASSED) {
      throw new Error('Only passed inspections can be approved');
    }

    const before = { ...qc };
    qc.approvedBy = approverId;
    qc.approvedAt = new Date();
    const updated = await this.qcRepository.save(qc);

    await this.auditLogService.record({
      actorId: approverId,
      action: 'PRODUCTION_APPROVE_QC_INSPECTION',
      entity: 'QCInspection',
      entityId: updated.id,
      before: before as any,
      after: updated as any,
    });

    return updated;
  }

  async reject(id: string, approverId: string, reason: string): Promise<QCInspection> {
    const qc = await this.qcRepository.findOne({ where: { id } });
    if (!qc) {
      throw new Error(`QC Inspection ${id} not found`);
    }

    const before = { ...qc };
    qc.status = QCStatus.REJECTED;
    qc.rejectionReason = reason;
    const updated = await this.qcRepository.save(qc);

    await this.auditLogService.record({
      actorId: approverId,
      action: 'PRODUCTION_REJECT_QC_INSPECTION',
      entity: 'QCInspection',
      entityId: updated.id,
      before: before as any,
      after: updated as any,
    });

    return updated;
  }

  async list(productionOrderId?: string): Promise<QCInspection[]> {
    const where: any = {};
    if (productionOrderId) where.productionOrderId = productionOrderId;

    return this.qcRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }
}

