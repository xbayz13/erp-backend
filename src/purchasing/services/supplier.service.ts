import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { Supplier } from '../entities/supplier.entity';
import { CreateSupplierDto } from '../dto/create-supplier.dto';
import { PurchaseOrder, PurchaseOrderStatus } from '../entities/purchase-order.entity';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateSupplierDto, actorId: string): Promise<Supplier> {
    const existing = await this.supplierRepository.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new Error(`Supplier with code ${dto.code} already exists`);
    }

    const supplier = this.supplierRepository.create({
      code: dto.code,
      name: dto.name,
      contactPerson: dto.contactPerson,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      rating: dto.rating || 0,
      paymentTerms: dto.paymentTerms,
      notes: dto.notes,
    });

    const created = await this.supplierRepository.save(supplier);

    await this.auditLogService.record({
      actorId,
      action: 'PURCHASING_CREATE_SUPPLIER',
      entity: 'Supplier',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async list(): Promise<Supplier[]> {
    return this.supplierRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Supplier | null> {
    return this.supplierRepository.findOne({ where: { id } });
  }

  async updatePerformanceMetrics(supplierId: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: { id: supplierId },
    });
    if (!supplier) {
      throw new Error(`Supplier ${supplierId} not found`);
    }

    const orders = await this.purchaseOrderRepository.find({
      where: { supplierName: supplier.name },
    });

    const totalOrders = orders.length;
    const completedOrders = orders.filter(
      (o) => o.status === PurchaseOrderStatus.RECEIVED,
    ).length;
    const onTimeOrders = orders.filter((o) => {
      if (o.status !== PurchaseOrderStatus.RECEIVED) return false;
      return o.expectedDate && o.updatedAt <= o.expectedDate;
    }).length;

    supplier.totalOrders = totalOrders;
    supplier.completedOrders = completedOrders;
    supplier.onTimeDeliveryRate =
      completedOrders > 0 ? (onTimeOrders / completedOrders) * 100 : 0;

    return this.supplierRepository.save(supplier);
  }

  async getPerformanceAnalytics(supplierId: string) {
    const supplier = await this.supplierRepository.findOne({
      where: { id: supplierId },
    });
    if (!supplier) {
      throw new Error(`Supplier ${supplierId} not found`);
    }

    const updated = await this.updatePerformanceMetrics(supplierId);
    if (!updated) {
      throw new Error(`Supplier ${supplierId} not found`);
    }

    return {
      supplier: updated,
      metrics: {
        onTimeDeliveryRate: updated.onTimeDeliveryRate,
        qualityScore: updated.qualityScore,
        priceCompetitiveness: updated.priceCompetitiveness || 0,
        totalOrders: updated.totalOrders,
        completedOrders: updated.completedOrders,
        completionRate:
          updated.totalOrders > 0
            ? (updated.completedOrders / updated.totalOrders) * 100
            : 0,
        overallScore:
          (updated.onTimeDeliveryRate * 0.4 +
            updated.qualityScore * 0.4 +
            (updated.priceCompetitiveness || 0) * 0.2) / 100,
      },
    };
  }

  async getRankings() {
    const suppliers = await this.supplierRepository.find({
      where: { isActive: true },
    });

    const rankings = await Promise.all(
      suppliers.map(async (supplier) => {
        const analytics = await this.getPerformanceAnalytics(supplier.id);
        return {
          supplier,
          ...analytics.metrics,
        };
      }),
    );

    return rankings.sort((a, b) => b.overallScore - a.overallScore);
  }
}

