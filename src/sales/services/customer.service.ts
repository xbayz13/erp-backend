import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { Customer } from '../entities/customer.entity';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { SalesOrder, SalesOrderStatus } from '../entities/sales-order.entity';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepository: Repository<SalesOrder>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateCustomerDto, actorId: string): Promise<Customer> {
    const existing = await this.customerRepository.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new Error(`Customer with code ${dto.code} already exists`);
    }

    const customer = this.customerRepository.create({
      code: dto.code,
      name: dto.name,
      contactPerson: dto.contactPerson,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      creditLimit: dto.creditLimit || 0,
      paymentTerms: dto.paymentTerms,
      segment: dto.segment,
      notes: dto.notes,
    });

    const created = await this.customerRepository.save(customer);

    await this.auditLogService.record({
      actorId,
      action: 'SALES_CREATE_CUSTOMER',
      entity: 'Customer',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async list(): Promise<Customer[]> {
    return this.customerRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Customer | null> {
    return this.customerRepository.findOne({ where: { id } });
  }

  async updateCreditLimit(
    id: string,
    creditLimit: number,
    actorId: string,
  ): Promise<Customer> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new Error(`Customer ${id} not found`);
    }

    const before = { ...customer };
    customer.creditLimit = creditLimit;
    const updated = await this.customerRepository.save(customer);

    await this.auditLogService.record({
      actorId,
      action: 'SALES_UPDATE_CUSTOMER_CREDIT_LIMIT',
      entity: 'Customer',
      entityId: updated.id,
      before: before as any,
      after: updated as any,
    });

    return updated;
  }

  async updateOutstandingBalance(customerId: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    const orders = await this.salesOrderRepository.find({
      where: { customerId },
    });

    const totalOrders = orders.length;
    const outstandingBalance = orders
      .filter((o) => o.status !== SalesOrderStatus.DELIVERED)
      .reduce((sum, o) => sum + o.totalAmount, 0);

    customer.totalOrders = totalOrders;
    customer.outstandingBalance = outstandingBalance;

    return this.customerRepository.save(customer);
  }

  async getCustomerAnalytics(customerId: string) {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });
    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    await this.updateOutstandingBalance(customerId);
    const updated = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    const orders = await this.salesOrderRepository.find({
      where: { customerId },
    });

    const totalRevenue = orders
      .filter((o) => o.status === SalesOrderStatus.DELIVERED)
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      customer: updated,
      metrics: {
        totalOrders: updated!.totalOrders,
        outstandingBalance: updated!.outstandingBalance,
        creditUtilization:
          updated!.creditLimit > 0
            ? (updated!.outstandingBalance / updated!.creditLimit) * 100
            : 0,
        totalRevenue,
        averageOrderValue:
          orders.length > 0 ? totalRevenue / orders.length : 0,
      },
    };
  }
}

