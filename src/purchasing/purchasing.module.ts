import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PurchasingController } from './controllers/purchasing.controller';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { Supplier } from './entities/supplier.entity';
import { PurchaseRequisition } from './entities/purchase-requisition.entity';
import { RFQ } from './entities/rfq.entity';
import { Quotation } from './entities/quotation.entity';
import { PurchasingService } from './services/purchasing.service';
import { SupplierService } from './services/supplier.service';
import { PurchaseRequisitionService } from './services/purchase-requisition.service';
import { RFQService } from './services/rfq.service';
import { QuotationService } from './services/quotation.service';

@Module({
  imports: [
    AuditModule,
    InventoryModule,
    TypeOrmModule.forFeature([
      PurchaseOrder,
      Supplier,
      PurchaseRequisition,
      RFQ,
      Quotation,
    ]),
  ],
  controllers: [PurchasingController],
  providers: [
    PurchasingService,
    SupplierService,
    PurchaseRequisitionService,
    RFQService,
    QuotationService,
  ],
  exports: [
    PurchasingService,
    SupplierService,
    PurchaseRequisitionService,
    RFQService,
    QuotationService,
  ],
})
export class PurchasingModule {}


