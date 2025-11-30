import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { TaxRate, TaxType } from '../entities/tax-rate.entity';

@Injectable()
export class TaxService {
  constructor(
    @InjectRepository(TaxRate)
    private readonly taxRateRepository: Repository<TaxRate>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createTaxRate(
    code: string,
    name: string,
    type: TaxType,
    rate: number,
    actorId: string,
    validFrom?: Date,
    validUntil?: Date,
  ): Promise<TaxRate> {
    const taxRate = this.taxRateRepository.create({
      code,
      name,
      type,
      rate,
      validFrom,
      validUntil,
    });

    const created = await this.taxRateRepository.save(taxRate);

    await this.auditLogService.record({
      actorId,
      action: 'FINANCE_CREATE_TAX_RATE',
      entity: 'TaxRate',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async calculateTax(amount: number, taxCode: string): Promise<number> {
    const taxRate = await this.taxRateRepository.findOne({
      where: { code: taxCode, isActive: true },
    });

    if (!taxRate) {
      throw new Error(`Tax rate ${taxCode} not found`);
    }

    const now = new Date();
    if (taxRate.validFrom && now < taxRate.validFrom) {
      throw new Error(`Tax rate ${taxCode} is not yet valid`);
    }
    if (taxRate.validUntil && now > taxRate.validUntil) {
      throw new Error(`Tax rate ${taxCode} has expired`);
    }

    return (amount * taxRate.rate) / 100;
  }

  async listTaxRates(type?: TaxType): Promise<TaxRate[]> {
    const where: any = { isActive: true };
    if (type) where.type = type;

    return this.taxRateRepository.find({
      where,
      order: { code: 'ASC' },
    });
  }
}

