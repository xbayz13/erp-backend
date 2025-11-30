import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { FinanceModule } from '../finance/finance.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ProductionModule } from '../production/production.module';
import { PurchasingModule } from '../purchasing/purchasing.module';
import { ReportsController } from './controllers/reports.controller';
import { ExportService } from './services/export.service';
import { ReportsService } from './services/reports.service';

@Module({
  imports: [
    AuditModule,
    InventoryModule,
    PurchasingModule,
    FinanceModule,
    ProductionModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ExportService],
  exports: [ReportsService],
})
export class ReportsModule {}


