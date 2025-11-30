import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { InventoryModule } from '../inventory/inventory.module';
import { Customer } from './entities/customer.entity';
import { SalesOrder } from './entities/sales-order.entity';
import { CustomerQuotation } from './entities/customer-quotation.entity';
import { PriceList } from './entities/price-list.entity';
import { Discount } from './entities/discount.entity';
import { CustomerService } from './services/customer.service';
import { SalesOrderService } from './services/sales-order.service';
import { QuotationPricingService } from './services/quotation-pricing.service';
import { SalesController } from './controllers/sales.controller';

@Module({
  imports: [
    AuditModule,
    InventoryModule,
    TypeOrmModule.forFeature([
      Customer,
      SalesOrder,
      CustomerQuotation,
      PriceList,
      Discount,
    ]),
  ],
  controllers: [SalesController],
  providers: [CustomerService, SalesOrderService, QuotationPricingService],
  exports: [CustomerService, SalesOrderService, QuotationPricingService],
})
export class SalesModule {}

