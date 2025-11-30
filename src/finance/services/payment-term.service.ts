import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { PaymentTerm } from '../entities/payment-term.entity';

@Injectable()
export class PaymentTermService {
  constructor(
    @InjectRepository(PaymentTerm)
    private readonly paymentTermRepository: Repository<PaymentTerm>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    code: string,
    name: string,
    days: number,
    actorId: string,
    discountPercentage?: number,
    discountDays?: number,
  ): Promise<PaymentTerm> {
    const paymentTerm = this.paymentTermRepository.create({
      code,
      name,
      days,
      discountPercentage,
      discountDays,
    });

    const created = await this.paymentTermRepository.save(paymentTerm);

    await this.auditLogService.record({
      actorId,
      action: 'FINANCE_CREATE_PAYMENT_TERM',
      entity: 'PaymentTerm',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async list(): Promise<PaymentTerm[]> {
    return this.paymentTermRepository.find({
      where: { isActive: true },
      order: { days: 'ASC' },
    });
  }

  async calculateDueDate(
    invoiceDate: Date,
    paymentTermCode: string,
  ): Promise<Date> {
    const term = await this.paymentTermRepository.findOne({
      where: { code: paymentTermCode, isActive: true },
    });

    if (!term) {
      throw new Error(`Payment term ${paymentTermCode} not found`);
    }

    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + term.days);
    return dueDate;
  }

  async getAgingReport(
    invoiceDate: Date,
    paymentTermCode: string,
    currentDate: Date = new Date(),
  ) {
    const term = await this.paymentTermRepository.findOne({
      where: { code: paymentTermCode, isActive: true },
    });

    if (!term) {
      throw new Error(`Payment term ${paymentTermCode} not found`);
    }

    const dueDate = await this.calculateDueDate(invoiceDate, paymentTermCode);
    const daysOverdue = Math.max(0, Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      invoiceDate,
      dueDate,
      daysOverdue,
      paymentTerm: term,
      isOverdue: daysOverdue > 0,
    };
  }
}

