import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { PurchasingService } from '../../purchasing/services/purchasing.service';
import { Repository } from 'typeorm';
import { IssueInvoiceDto } from '../dto/issue-invoice.dto';
import { RecordTransactionDto } from '../dto/record-transaction.dto';
import { SettleInvoiceDto } from '../dto/settle-invoice.dto';
import {
  FinancialTransaction,
  FinancialTransactionType,
} from '../entities/financial-transaction.entity';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(FinancialTransaction)
    private readonly transactionRepository: Repository<FinancialTransaction>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly purchasingService: PurchasingService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async listTransactions(): Promise<FinancialTransaction[]> {
    return this.transactionRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async recordTransaction(
    dto: RecordTransactionDto,
    actorId: string,
  ): Promise<FinancialTransaction> {
    const transaction = this.transactionRepository.create({
      type: dto.type,
      amount: dto.amount,
      currency: dto.currency,
      description: dto.description,
      reference: dto.reference,
      relatedEntityId: dto.relatedEntityId,
      createdBy: actorId,
    });
    const created = await this.transactionRepository.save(transaction);
    await this.auditLogService.record({
      actorId,
      action: 'FINANCE_TRANSACTION_RECORDED',
      entity: 'FinancialTransaction',
      entityId: created.id,
      after: created as any,
    });
    return created;
  }

  async listInvoices(): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      order: { updatedAt: 'DESC' },
    });
  }

  async issueInvoice(
    dto: IssueInvoiceDto,
    actorId: string,
  ): Promise<Invoice> {
    const targetOrder = await this.purchasingService.findById(
      dto.purchaseOrderId,
    );
    if (!targetOrder) {
      throw new Error('Purchase order not found');
    }

    const invoice = this.invoiceRepository.create({
      purchaseOrderId: dto.purchaseOrderId,
      amount: dto.amount,
      currency: dto.currency,
      status: InvoiceStatus.ISSUED,
      issuedAt: new Date(),
      dueDate: new Date(dto.dueDate),
      createdBy: actorId,
      notes: dto.notes,
    });
    const created = await this.invoiceRepository.save(invoice);
    await this.auditLogService.record({
      actorId,
      action: 'FINANCE_INVOICE_ISSUED',
      entity: 'Invoice',
      entityId: created.id,
      after: created as any,
    });
    return created;
  }

  async settleInvoice(
    id: string,
    dto: SettleInvoiceDto,
    actorId: string,
  ): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new Error(`Invoice ${id} not found`);
    }

    if (invoice.status === InvoiceStatus.PAID) {
      return invoice;
    }

    const updated = await this.invoiceRepository.save({
      ...invoice,
      status: InvoiceStatus.PAID,
      paidAt: new Date(dto.paymentDate),
    });

    await this.recordTransaction(
      {
        type: FinancialTransactionType.PAYMENT,
        amount: invoice.amount,
        currency: invoice.currency,
        description: `Payment for Invoice ${invoice.id}`,
        reference: dto.reference,
        relatedEntityId: invoice.id,
      },
      actorId,
    );

    await this.auditLogService.record({
      actorId,
      action: 'FINANCE_INVOICE_PAID',
      entity: 'Invoice',
      entityId: id,
      before: invoice as any,
      after: updated as any,
      reason: dto.reference,
    });

    return updated;
  }
}


