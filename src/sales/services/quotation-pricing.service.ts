import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import { CustomerQuotation, CustomerQuotationStatus } from '../entities/customer-quotation.entity';
import { PriceList, PriceListType, PriceListItem } from '../entities/price-list.entity';
import { Discount, DiscountType, DiscountScope } from '../entities/discount.entity';
import { CreateCustomerQuotationDto } from '../dto/create-customer-quotation.dto';
import { Customer } from '../entities/customer.entity';

@Injectable()
export class QuotationPricingService {
  constructor(
    @InjectRepository(CustomerQuotation)
    private readonly quotationRepository: Repository<CustomerQuotation>,
    @InjectRepository(PriceList)
    private readonly priceListRepository: Repository<PriceList>,
    @InjectRepository(Discount)
    private readonly discountRepository: Repository<Discount>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly inventoryService: InventoryService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createQuotation(dto: CreateCustomerQuotationDto, actorId: string): Promise<CustomerQuotation> {
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

        // Get price from price list
        const price = await this.getPriceForItem(item.itemId, dto.customerId, item.quantity);
        const unitPrice = price || item.unitPrice;
        const discount = item.discount || 0;
        const totalPrice = item.quantity * unitPrice * (1 - discount / 100);

        return {
          itemId: item.itemId,
          itemSku: inventoryItem.sku,
          itemName: inventoryItem.name,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
          discount,
          notes: item.notes,
        };
      }),
    );

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountAmount = items.reduce((sum, item) => sum + (item.discount || 0) * item.unitPrice * item.quantity / 100, 0);

    const quotation = this.quotationRepository.create({
      reference: dto.reference,
      customerId: dto.customerId,
      status: CustomerQuotationStatus.DRAFT,
      items,
      totalAmount,
      discountAmount,
      validUntil: new Date(dto.validUntil),
      terms: dto.terms,
      notes: dto.notes,
      createdBy: actorId,
    });

    const created = await this.quotationRepository.save(quotation);

    await this.auditLogService.record({
      actorId,
      action: 'SALES_CREATE_CUSTOMER_QUOTATION',
      entity: 'CustomerQuotation',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async getPriceForItem(itemId: string, customerId?: string, quantity?: number): Promise<number | null> {
    // Get customer-specific price list first
    if (customerId) {
      const customerPriceList = await this.priceListRepository.findOne({
        where: {
          customerId,
          type: PriceListType.CUSTOMER_SPECIFIC,
          isActive: true,
        },
      });

      if (customerPriceList) {
        const item = customerPriceList.items.find((i) => i.itemId === itemId);
        if (item) {
          // Check quantity range
          if (quantity) {
            if (item.minQuantity && quantity < item.minQuantity) return null;
            if (item.maxQuantity && quantity > item.maxQuantity) return null;
          }
          return item.unitPrice;
        }
      }
    }

    // Get standard price list
    const standardPriceList = await this.priceListRepository.findOne({
      where: {
        type: PriceListType.STANDARD,
        isActive: true,
      },
    });

    if (standardPriceList) {
      const item = standardPriceList.items.find((i) => i.itemId === itemId);
      if (item) {
        if (quantity) {
          if (item.minQuantity && quantity < item.minQuantity) return null;
          if (item.maxQuantity && quantity > item.maxQuantity) return null;
        }
        return item.unitPrice;
      }
    }

    return null;
  }

  async createPriceList(
    name: string,
    type: PriceListType,
    items: PriceListItem[],
    customerId?: string,
    actorId?: string,
  ): Promise<PriceList> {
    const priceList = this.priceListRepository.create({
      name,
      type,
      customerId,
      items,
      isActive: true,
    });

    const created = await this.priceListRepository.save(priceList);

    if (actorId) {
      await this.auditLogService.record({
        actorId,
        action: 'SALES_CREATE_PRICE_LIST',
        entity: 'PriceList',
        entityId: created.id,
        after: created as any,
      });
    }

    return created;
  }

  async createDiscount(
    code: string,
    name: string,
    type: DiscountType,
    scope: DiscountScope,
    value: number,
    validFrom: Date,
    validUntil: Date,
    actorId: string,
    itemId?: string,
    customerId?: string,
  ): Promise<Discount> {
    const discount = this.discountRepository.create({
      code,
      name,
      type,
      scope,
      value,
      itemId,
      customerId,
      validFrom,
      validUntil,
      isActive: true,
    });

    const created = await this.discountRepository.save(discount);

    await this.auditLogService.record({
      actorId,
      action: 'SALES_CREATE_DISCOUNT',
      entity: 'Discount',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async applyDiscount(
    discountCode: string,
    orderAmount: number,
    itemId?: string,
    customerId?: string,
    quantity?: number,
  ): Promise<number> {
    const discount = await this.discountRepository.findOne({
      where: { code: discountCode, isActive: true },
    });

    if (!discount) {
      throw new Error(`Discount ${discountCode} not found`);
    }

    const now = new Date();
    if (now < discount.validFrom || now > discount.validUntil) {
      throw new Error(`Discount ${discountCode} is not valid`);
    }

    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
      throw new Error(`Discount ${discountCode} has reached maximum uses`);
    }

    // Check scope
    if (discount.scope === DiscountScope.ITEM && discount.itemId !== itemId) {
      throw new Error(`Discount ${discountCode} is not applicable for this item`);
    }

    if (discount.scope === DiscountScope.CUSTOMER && discount.customerId !== customerId) {
      throw new Error(`Discount ${discountCode} is not applicable for this customer`);
    }

    // Check conditions
    if (discount.minOrderAmount && orderAmount < discount.minOrderAmount) {
      throw new Error(`Order amount must be at least ${discount.minOrderAmount}`);
    }

    if (discount.minQuantity && quantity && quantity < discount.minQuantity) {
      throw new Error(`Quantity must be at least ${discount.minQuantity}`);
    }

    // Calculate discount
    if (discount.type === DiscountType.PERCENTAGE) {
      return (orderAmount * discount.value) / 100;
    } else {
      return discount.value;
    }
  }

  async listPriceLists(customerId?: string): Promise<PriceList[]> {
    const where: any = { isActive: true };
    if (customerId) where.customerId = customerId;

    return this.priceListRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async listDiscounts(isActive?: boolean): Promise<Discount[]> {
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;

    return this.discountRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }
}

